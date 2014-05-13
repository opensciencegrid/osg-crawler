#!/bin/bash
echo "initializing proxy"
voms-proxy-init -voms mis -cert cert/crawlercert.pem -key cert/crawlerkey.pem

