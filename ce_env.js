#!/usr/bin/env node

var config = require('./config.json');
var fs = require("fs");
var exec = require('child_process').exec;
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
    var cmd = "globus-job-run "+fqdn+" -m 1 /bin/env";
    console.log(service_path+" "+cmd);
    exec(cmd, {
            GLOBUS_TCP_PORT_RANGE: "20000,24999",
            GLOBUS_TCP_SOURCE_RANGE: "20000,24999",
            timeout: 60*1000
        }, //60 seconds timeout too short?
        function(err, stdout, stderr) {
        if(err) {
            console.error(err);
            errors.push({sitename: sitename, msg:stderr, cmd: cmd, err:err});
            fs.writeFile(service_path+"/ce_env.error", cmd+"\n"+stderr, next_service);
        } else {
            if(stderr != "") {
                console.error(stderr)
                errors.push({sitename: sitename, msg:stderr, cmd: cmd});
                fs.writeFile(service_path+"/ce_env.error", stderr, next_service);
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
}


