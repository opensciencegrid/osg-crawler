#!/usr/bin/env node

var config = require('./config.json');
var fs = require("fs");
var child_process = require('child_process');
var assert = require('assert');

var async = require("async");

//list of errors
var errors = [];

function get_directory(path, callback, done) {
    fs.readdir(path, function (err, items) {
        async.eachSeries(items, function(item, next) {
            if(item[0] == '.') {
                next();
            } else {
                fs.stat(path+"/"+item, function(err, stat) {
                    if(stat && stat.isDirectory()) callback(null, item, next);
                    else next();
                });
            }
        }, done);
    });
}

//iterate all CEs
get_directory(config.datadir, function(err, gridtype, next_gridtype) {
    //console.log("Grid Type:"+gridtype);
    get_directory(config.datadir+"/"+gridtype, function(err, group, next_group) {
        //console.log("Resource Group:"+group);
        get_directory(config.datadir+"/"+gridtype+"/"+group, function(err, resource, next_resource) {
            //console.log("Resource:"+resource);

            var resource_path = config.datadir+"/"+gridtype+"/"+group+"/"+resource;
            var resource_info = require(resource_path+"/resource_info.json");

            //aliases is undefined if not set.. otherwise an array
            //[ 'nys1.cac.cornell.edu', 'osg-se.cac.cornell.edu' ]
            var fqdn = resource_info.FQDN[0];
            var aliases = resource_info.FQDNAliases[0].FQDNAlias;
            get_directory(resource_path, function(err, service, next_service) {
                if(service == "CE") {
                    process_ce(group, fqdn, resource_path+"/"+service, next_service);
                } else {
                    next_service();
                }
            }, next_resource);

        }, next_group);
    }, next_gridtype);
}, function() {
    console.log("all done");
    fs.writeFile(config.datadir+"/ce_env.errors.json", JSON.stringify(errors, null, 4));
});

function process_ce(sitename, fqdn, service_path, next_service) {
    //use override if specified
    var service_info = require(service_path+"/service_info.json");
    if(service_info.Details[0].uri_override) {
        var override = service_info.Details[0].uri_override[0];
        if(override != '') fqdn = override;
    }

    //attach :2119 if port not specified
    if(fqdn.indexOf(":") == -1) {
        fqdn += ":2119";
    }

    //now submit env test
    var cmd = "globus-job-run "+fqdn+" /bin/env";
    console.log(cmd);
    var child = child_process.exec(cmd, {
        //cwd: service_path,
        env: {
            X509_USER_PROXY: config.proxy,
            GLOBUS_TCP_PORT_RANGE: "20000,24999",
            GLOBUS_TCP_SOURCE_RANGE: "20000,24999",
        },
        killSignal: 'SIGKILL',
        timeout: 30*1000
    }, function(err, stdout, stderr) {
        if(err) {
            err.stdout = stdout;
            err.stderr = stderr;
            errors.push(err);
            console.error(err);
            fs.writeFile(service_path+"/ce_env.error", err, next_service);
        } else {
            if(stderr != "") {
                var out = {stdout: stdout, stderr: stderr, sitename: sitename};
                errors.push(out);
                fs.writeFile(service_path+"/ce_env.error", out, next_service);
                console.error(out);
            } else {
                //parse env output to json
                var env = {};
                //parse the env to json
                stdout.split("\n").forEach(function(line) {
                    var pos = line.indexOf("=");
                    var key = line.substr(0, pos);
                    var value = line.substr(pos+1);
                    if(key != "") {
                        env[key] = value;
                    }
                });
                fs.writeFile(service_path+"/ce_env.json", JSON.stringify(env, null, 4), next_service);
            }
        }
    });
    /*
    var timeout = setTimeout(function() {
        console.log("timeout.. sending sigterm");
        child.kill('SIGTERM');
        timeout = null;
    }, 10*1000);
    */
        /*
        if(timeout !== null) {
            console.log("canceling timeout");
            clearTimeout(timeout);
        }
        */
}

