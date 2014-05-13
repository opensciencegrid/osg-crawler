#!/usr/bin/env node

var config = require('./config.json');
var fs = require("fs");
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
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
            //load_bdii(resource_path, resource_info.Name, next_resource);
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
    fs.writeFile(config.datadir+"/ce_config.errors.json", JSON.stringify(errors, null, 4));
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
    var cmd = "globus-job-run "+fqdn+" -s ce/config.sh";
    console.log(sitename+" "+cmd);
    exec(cmd, {encoding: 'binary', maxBuffer: 10*1024*1024}, //if 10M enouch?
        function(err, stdout, stderr) {
        if(stderr != "") {
            console.log(stderr);
            if(stderr != "") errors.push({sitename: sitename, msg:stderr, cmd: cmd});
        }
        if(stdout != "") {
            fs.writeFile(service_path+"/ce_config.tar.gz", stdout, {encoding: 'binary'}, function(err) {
                //untar everything
                exec("tar -xzf "+service_path+"/ce_config.tar.gz -C "+service_path, function(err) {
                    console.log("untarred. removing tar.gz");
                    fs.unlink(service_path+"/ce_config.tar.gz", next_service);
                });
            });
        } else {
            next_service();
        }
    });
   /*
    var job = spawn('globus-job-run', [fqdn, '-s', 'ce/ce_config.sh']);
    var stderr = "";
    var gz = new Buffer(400000); //should hold the entire .gz
    var gz_size = 0;
    job.stdout.on('data', function(data) {
        if(data.length + gz_size > gz.length) {
            stderr += "output too big";
        } else {
            gz_size += data.length;
            data.copy(gz);
        }
    });
    job.stderr.on('data', function(data) {
        stderr += data;
    });
    job.on('exit', function(data) {
        if(stderr != "") errors.push({sitename: sitename, msg:data, cmd: cmd});
        fs.open(service_path+"/ce_config.tar.gz", "w", function(err, f) {
            fs.write(f, gz, 0, gz_size, 0, function(err) {
                fs.close(f, next_service);
            });
        });
    });
    */
}

