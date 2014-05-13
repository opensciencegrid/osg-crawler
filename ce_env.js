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
    console.log(cmd);
    exec(cmd, function(err, stdout, stderr) {
        if(stderr != "") {
            console.log(stderr)
            //fs.writeFile(service_path+"/ce.env.err", cmd+"\n"+stderr, next_service);
            errors.push({sitename: sitename, msg:stderr, cmd: cmd});
            next_service();
        } else {
            //parse env output to json
            //fs.writeFile(service_path+"/ce.env.txt", stdout, function(err) {
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
            //});
        }
    });
}

function load_bdii(resource_path, sitename, next) {
    /*
    var cmd = "ldapsearch -h is.grid.iu.edu -p 2170 -l 3 -x -b mds-vo-name="+sitename+",mds-vo-name=local,o=grid";// \"(objectClass="+obj+")\""
    console.log("running:"+cmd);
    exec(cmd, function(err, stdout, stderr) {
        fs.writeFile(resource_path+"/bdii.ldif", stdout);
        //fs.writeFile(resource_path+"/bdii.err", stderr);
    });
    */

}

/*
//store bdii information a split up directory structure
function store_bdii_entries(resource_path, entries, done) {
    async.eachSeries(entries, function(entry, next) {
        //parse DN
        var dn_tokens = entry.dn.split(",").reverse();
        dn_tokens.splice(0, 3); //remove first 3 elements ('o=grid', 'Mds-Vo-name=local', 'Mds-Vo-name=BNL_ATLAS_1')

        //construct directory path
        var path = resource_path+"/bdii";
        //console.log("dn_tokens.length: "+dn_tokens.length);
        dn_tokens.forEach(function(token) {
            //path += "/"+token.replace(/\//g, "\\/");
            path += "/"+token.replace(/\//g, "|");
        });

        //create directory and store entry
        mkdirp(path, function(e) {
        //fs.mkdir(path, function(e) {
            if(e) {
                console.error(e);
                process.exit();
            }
            //console.log("writing "+path+"/entry.json");
            fs.writeFileSync(path+"/entry.json", JSON.stringify(entry, null, 4));
            next();
        });
    }, done);
}


*/
