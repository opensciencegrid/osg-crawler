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

//iterate all CE/SEs
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
                switch(service) {
                case "CE":
                    process_ce(group, fqdn, resource_path+"/"+service, next_service);
                    break;
                case "GridFtp":
                    process_gridftp(group, fqdn, resource_path+"/"+service, next_service);
                    break;
                case "SRMv2":
                    process_srmv2(group, fqdn, resource_path+"/"+service, next_service);
                    break;
                case "net.perfSONAR.Bandwidth":
                case "net.perfSONAR.Latency":
                    process_perf(service, group, fqdn, resource_path+"/"+service, next_service);
                    break;
                default:
                    next_service();
                }
            }, next_resource);

        }, next_group);
    }, next_gridtype);
}, function() {
    console.log("all done");
    fs.writeFile(config.datadir+"/ce.errors.json", JSON.stringify(errors, null, 4));
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

    //load env.json
    var env_path = service_path+"/ce_env.json";
    fs.exists(env_path, function(exists) {
        if(exists) {
            var env = require(service_path+"/ce_env.json");
            /* -- a typical env from a site
            { _CONDOR_ANCESTOR_10544: '9999:1392204351:1296858486',
              _CONDOR_ANCESTOR_9999: '4386:1400788048:366421992',
              _CONDOR_ANCESTOR_4386: '4387:1400788048:85588983',
              PATH: '/sbin:/usr/sbin:/bin:/usr/bin:/sbin:/usr/sbin:/bin:/usr/bin',
              LD_LIBRARY_PATH: '/usr/lib:/usr/lib64',
              OSG_JOB_CONTACT: 'itbv-ce-pbs.uchicago.edu/jobmanager-pbs',
              _CONDOR_SLOT: '',
              OSG_SQUID_LOCATION: 'itbv-web.uchicago.edu:3128',
              OSG_DEFAULT_SE: 'itbv-dc1.uchicago.edu',
              OSG_GRID: '/etc/osg/wn-client',
              TMPDIR: '/var/lib/condor/spool/local_univ_execute/dir_4386',
              GLOBUS_LOCATION: '/usr',
              _CONDOR_SCRATCH_DIR: '/var/lib/condor/spool/local_univ_execute/dir_4386',
              _CONDOR_JOB_IWD: '/home/osgvo/mis',
              TEMP: '/var/lib/condor/spool/local_univ_execute/dir_4386',
              OSG_HOSTNAME: 'itbv-ce-pbs.uchicago.edu',
              OSG_STORAGE_ELEMENT: 'True',
              PERL5LIB: '',
              GLOBUS_GRAM_JOB_CONTACT: 'https://itbv-ce-pbs.uchicago.edu:55736/16362116077990930151/3026418950974258605/',
              OSG_SITE_NAME: 'UC_ITB_PBS',
              GLOBUS_GASS_CACHE_DEFAULT: '/home/osgvo/mis/.globus/.gass_cache',
              _CONDOR_JOB_PIDS: '',
              OSG_APP: '/share/osg/app',
              OSG_WN_TMP: '/scratch',
              X509_USER_PROXY: '/home/osgvo/mis/.globus/mis/.globus/job/itbv-ce-pbs/16362116077990930151.3026418950974258605/x509_user_proxy',
              TMP: '/var/lib/condor/spool/local_univ_execute/dir_4386',
              _CONDOR_JOB_AD: '/var/lib/condor/spool/local_univ_execute/dir_4386/.job.ad',
              OSG_SITE_WRITE: '/share/osg/data',
              OSG_GLEXEC_LOCATION: '/usr/sbin/glexec',
              OSG_DATA: '/share/osg/data',
              HOME: '/home/osgvo/mis',
              _CONDOR_MACHINE_AD: '/var/lib/condor/spool/local_univ_execute/dir_4386/.machine.ad',
              LOGNAME: 'mis',
              OSG_SITE_READ: '/share/osg/data' }
            */
            console.log(service_path+" "+env.OSG_HOSTNAME);
            /*
            exec(__dirname+"/ce/run.sh", {
                timeout: 1000*60*5, //5 minutes enough?
                //timeout: 1000*60, //1 minutes enough?
                cwd: __dirname+"/ce",
                env: {
                    SERVICE_PATH: service_path, //location where user should write output to
                    OSG_SITE_NAME: env.OSG_SITE_NAME,
                    OSG_HOSTNAME: env.OSG_HOSTNAME,
                    OSG_JOB_CONTACT: env.OSG_JOB_CONTACT
                }
            }, function(err, stdout, stderr) {
                if(err) {
                    console.dir(err);
                    errors.push({sitename: sitename, hostname: env.OSG_HOSTNAME, err:err});
                }
                if(stderr != "") {
                    if(stderr != "") errors.push({sitename: sitename, hostname: env.OSG_HOSTNAME, msg:stderr});
                }
                console.log(stdout);
                console.log(stderr);
                next_service();
            });
            */
            var run = spawn(__dirname+'/ce/run.sh', [], {
                //timeout: 1000*60, //1 minutes enough?
                cwd: __dirname+"/ce",
                env: {
                    X509_USER_PROXY: "../"+config.proxy,
                    GLOBUS_TCP_PORT_RANGE: "20000,24999",
                    GLOBUS_TCP_SOURCE_RANGE: "20000,24999",
                    SERVICE_PATH: service_path, //location where user should write output to
                    OSG_SITE_NAME: env.OSG_SITE_NAME,
                    OSG_HOSTNAME: env.OSG_HOSTNAME,
                    OSG_JOB_CONTACT: env.OSG_JOB_CONTACT
                }
            });
            run.stdout.on('data', function(data) {
              console.log(data.toString('utf8'));
            });
            run.stderr.on('data', function(data) {
              console.error(data.toString('utf8'));
            });
            run.on('close', function (code) {
                console.log('ce/run.sh ended with ' + code);
                next_service();
            });
        } else {
            console.log("no ce_env.json for "+sitename+" ..skipping");
            next_service();
        }
    });

    /*
    //now run run.sh
    */
}

function process_gridftp(sitename, fqdn, service_path, next_service) {
    //use override if specified
    var service_info = require(service_path+"/service_info.json");
    if(service_info.Details[0].uri_override) {
        var override = service_info.Details[0].uri_override[0];
        if(override != '') fqdn = override;
    }

    //attach :2811 if port not specified
    if(fqdn.indexOf(":") == -1) {
        fqdn += ":2811";
    }
    var run = spawn(__dirname+'/gridftp/run.sh', [], {
        cwd: __dirname+"/gridftp",
        env: {
            X509_USER_PROXY: "../"+config.proxy,
            GLOBUS_TCP_PORT_RANGE: "20000,24999",
            GLOBUS_TCP_SOURCE_RANGE: "20000,24999",
            SERVICE_PATH: service_path, //location where user should write output to
            GRIDFTP_FQDN: fqdn
        }
    });
    run.stdout.on('data', function(data) {
      console.log(data.toString('utf8'));
    });
    run.stderr.on('data', function(data) {
      console.error(data.toString('utf8'));
    });
    run.on('close', function (code) {
        console.log('gridftp/run.sh ended with ' + code + ' stored in '+service_path);
        next_service();
    });
}

function process_srmv2(sitename, fqdn, service_path, next_service) {
    //use override if specified
    var service_info = require(service_path+"/service_info.json");
    if(service_info.Details[0].uri_override) {
        var override = service_info.Details[0].uri_override[0];
        if(override != '') fqdn = override;
    }

    //attach :2811 if port not specified
    if(fqdn.indexOf(":") == -1) {
        //fqdn += ":8443/srm/v2/server";
        //fqdn += ":8443/srm/managerv2";
        fqdn += ":8443";
    }
    var run = spawn(__dirname+'/srmv2/run.sh', [], {
        cwd: __dirname+"/srmv2",
        env: {
            //X509_USER_PROXY: "../"+config.proxy,
            GLOBUS_TCP_PORT_RANGE: "20000,24999",
            GLOBUS_TCP_SOURCE_RANGE: "20000,24999",
            SERVICE_PATH: service_path, //location where user should write output to
            SRMV2_FQDN: fqdn
        }
    });
    run.stdout.on('data', function(data) {
      console.log(data.toString('utf8'));
    });
    run.stderr.on('data', function(data) {
      console.error(data.toString('utf8'));
    });
    run.on('close', function (code) {
        console.log('srvmv2/run.sh on '+fqdn+' ended with ' + code + ' stored in '+service_path);
        next_service();
    });
}

function process_perf(type, sitename, fqdn, service_path, next_service) {
    //use override if specified
    var service_info = require(service_path+"/service_info.json");
    if(service_info.Details[0].endpoint) {
        var endpoint = service_info.Details[0].endpoint[0];
        if(endpoint != '') fqdn = endpoint;
    }

    var run = spawn(__dirname+'/perfsonar/test.js', [], {
        cwd: __dirname+"/perfsonar",
        env: {
            SERVICE_PATH: service_path, //location where user should write output to
            ENDPOINT: fqdn, //location where user should write output to
            SERVICE_TYPE: type 
        }
    });
    run.stdout.on('data', function(data) {
      console.log(data.toString('utf8'));
    });
    run.stderr.on('data', function(data) {
      console.error(data.toString('utf8'));
    });
    run.on('close', function (code) {
        console.log('perfsonar/run.sh on '+fqdn+' ended with ' + code + ' stored in '+service_path);
        next_service();
    });
}


