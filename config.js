#!/usr/bin/env node
//just a small helper script to pull specific config option from config.json
var config = require(process.cwd()+'/config.json');
var key = process.argv[2];
console.log(config[key]);
