#!/usr/bin/node
var ps = require('perfsonar');
var fs = require('fs');
var http = require('http');

var output_path = process.env.SERVICE_PATH;
var service_type = process.env.SERVICE_TYPE;
var endpoint = process.env.ENDPOINT;

console.log("testing SOAP endpoint: "+endpoint);
ps.ma.endpoint({server: endpoint, debug: false}, function(err, endpoints) {
    if(err) {
        console.log("Failed to load soap endpoint");
    } else {
        console.log("writing out :"+output_path+"/perfsonar.soap.endpoints.json"); 
        fs.writeFileSync(output_path+"/perfsonar.soap.endpoints.json", JSON.stringify(endpoints, null, 2));

        console.log("testing REST endpoint: "+"http://"+endpoint+"/esmond/perfsonar/archive/?format=json");
        http.get("http://"+endpoint+"/esmond/perfsonar/archive/?format=json", function(res) {
            //console.dir(res);
            var body = "";
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                if(res.statusCode == "200") {
                    console.log("writing out:"+output_path+"/perfsonar.rest.endpoints.json");
                    fs.writeFileSync(output_path+"/perfsonar.rest.endpoints.json", body);
                } else {
                    //console.log("code:"+res.statusCode+" on REST interface");
                    console.log(body);
                }
            });
        }).on('error', function(e) {
            console.log("failed to access REST");
        });
    }
});

