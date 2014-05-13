#!/usr/bin/env node

var fs = require("fs");
var exec = require('child_process').exec;

exec("cat test.tar.gz", {encoding: 'binary'}, function(err, out, err) {
    console.log(err);
    fs.writeFile("out.binary", out, {encoding: 'binary'});
}); 
