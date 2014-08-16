#!/usr/bin/env node

var config = require('./config.json');
var fs = require('fs');

var myosg = require('osg').MyOSG;

//console.dir(config);

myosg.rgsummary(). //pull all services
then(function(groups) {
    groups.forEach(function(group) {
        //console.log(group.GroupName[0] + "--------------------------");
        /*
  { GridType: [ 'OSG Production Resource' ],
    GroupID: [ '134' ],
    GroupName: [ 'UTA_SWT2' ],
    Disable: [ 'False' ],
    GIPStatus: [ [Object] ],
    Facility: [ [Object] ],
    Site: [ [Object] ],
    SupportCenter: [ [Object] ],
    GroupDescription: [ '(No resource group description)' ],
    Resources: [ [Object] ] },
        console.dir(group);
        process.exit(1);
        */
        function process_group(gridtype_path, group) {
            var group_path=gridtype_path+"/"+group.GroupName[0];
            fs.mkdir(group_path, function(e) {
                if(!e || e.code === 'EEXIST') {

                    group.Resources[0].Resource.forEach(function(resource) {
                        console.log(resource.Name[0]);
                        //let's use resource name (instead of FQDN) for directory name
                        //since fqdn can be aliased, or overridden
                        var resource_path=group_path+"/"+resource.Name[0];//+"_"+resource.FQDN[0];
                        fs.mkdir(resource_path, function(e) {
                            if(!e || e.code === 'EEXIST') {
                                resource.Services[0].Service.forEach(function(service) {
                                    //console.dir(service);
                                    var service_path = resource_path+"/"+service.Name;
                                    fs.mkdir(service_path, function(e) {
                                        if(!e || e.code === 'EEXIST') {
                                            //store service info
                                            fs.writeFileSync(service_path+"/service_info.json", JSON.stringify(service, null, 4));
                                        } else {
                                            console.log("failed to create service directory:"+service_path); 
                                        }
                                    });
                                });
                            } else {
                                console.log("failed to create resource directory:"+resource_path); 
                            }

                            //store resource info
                            delete resource.Services;
                            fs.writeFileSync(resource_path+"/resource_info.json", JSON.stringify(resource, null, 4));
                        });
                    });

                    //store group info
                    delete group.Resources;
                    fs.writeFileSync(group_path+"/group_info.json", JSON.stringify(group, null, 4));

                } else {
                    console.log("failed to create group directory:"+group_path); 
                }
            });
        }

        var gridtype = group.GridType[0].replace(/ /g, "_");
        var gridtype_path = config.datadir+"/"+gridtype;
        fs.mkdir(gridtype_path, function(e) {
            if(!e || e.code === 'EEXIST') {
                process_group(gridtype_path, group);
            }
        });
    });
});


