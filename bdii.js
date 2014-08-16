#!/usr/bin/env node

var config = require('./config.json');
var fs = require("fs");
var exec = require('child_process').exec;
var assert = require('assert');

var async = require("async");
var mkdirp = require("mkdirp");
var ldap = require('ldapjs');

//for glue schema spec 1.3
//https://twiki.grid.iu.edu/twiki/bin/viewfile/Operations/BdiiInstalledCapacityValidation/GLUESchema.pdf

//var client = ldap.createClient({ url: 'ldap://is.grid.iu.edu:2170', timeout: 10, maxConnections: 10});
var client = ldap.createClient({ url: 'ldap://is.grid.iu.edu:2170'});

//list of bdii errors
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

//iterate resource / services
get_directory(config.datadir, function(err, gridtype, next_gridtype) {
    //console.log("Grid Type:"+gridtype);
    get_directory(config.datadir+"/"+gridtype, function(err, group, next_group) {
        //console.log("Resource Group:"+group);

        var rg_path = config.datadir+"/"+gridtype+"/"+group;
        load_bdii(rg_path, group, next_group);
        
        /*
        get_directory(config.datadir+"/"+gridtype+"/"+group, function(err, resource, next_resource) {
            console.log("Resource:"+resource);

            var resource_path = config.datadir+"/"+gridtype+"/"+group+"/"+resource;
            var resource_info = require(resource_path+"/resource_info.json");

            //aliases is undefined if not set.. otherwise an array
            //[ 'nys1.cac.cornell.edu', 'osg-se.cac.cornell.edu' ]
            var aliases = resource_info.FQDNAliases[0].FQDNAlias;
            load_bdii(resource_path, resource_info.Name, next_resource);
        }, next_group);
        */
    }, next_gridtype);
}, function() {
    client.unbind();
    //console.log("all done");
    fs.writeFile(config.datadir+"/bdii.errors.json", JSON.stringify(errors, null, 4));
});

function load_bdii(resource_path, sitename, next) {
    /*
    var cmd = "ldapsearch -h is.grid.iu.edu -p 2170 -l 3 -x -b mds-vo-name="+sitename+",mds-vo-name=local,o=grid";// \"(objectClass="+obj+")\""
    console.log("running:"+cmd);
    exec(cmd, function(err, stdout, stderr) {
        fs.writeFile(resource_path+"/bdii.ldif", stdout);
        //fs.writeFile(resource_path+"/bdii.err", stderr);
    });
    */

    var opts = {
        //filter: '(&(l=Seattle)(email=*@foo.com))',
        //timeLimit: 20,
        scope: 'sub'
    };

    console.log(resource_path);
    var entries = [];
    client.search("mds-vo-name="+sitename+",mds-vo-name=local,o=grid", opts, function(err, res) {
        if(err) {
            console.log(err);
            next();
        } else {
            res.on('searchEntry', function(entry) {
                //console.log('entry: ' + JSON.stringify(entry.object));
                entries.push(entry.object);
            });
            res.on('searchReference', function(referral) {
                console.log('referral: ' + referral.uris.join());
            });
            res.on('error', function(err) {
                console.log(err.message);
                errors.push({sitename: sitename, msg:err.message});
                //fs.writeFile(resource_path+"/bdii.json", JSON.stringify(entries, null, 4));
                next();
            });
            res.on('end', function(result) {
                //console.log('DEBUG '+sitename+' :: ' + entries.length + ' entries');
                fs.writeFile(resource_path+"/bdii.json", JSON.stringify(entries, null, 4), next());
                //store_bdii_entries(resource_path, entries, next);
            });
        }
    });
}

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


