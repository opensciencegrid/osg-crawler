#!/bin/bash

#env looks like..
#PWD=/usr/local/git/osg-crawler/srmv2
#SERVICE_PATH=/usr/local/crawler_data/OSG_Integration_Test_Bed_Resource/GC1/GC1_SE/SRMv2
#SHLVL=1
#SRMV2_FQDN=gc1-se.uchicago.edu:8443
#GLOBUS_TCP_PORT_RANGE=20000,24999
#X509_USER_PROXY=../cert/crawlerproxy.pem
#GLOBUS_TCP_SOURCE_RANGE=20000,24999
#_=/bin/env

#cmd="srmping -retry_num 0 -x509_user_cert=../cert/crawlercert.pem -x509_user_key=../cert/crawlerkey.pem srm://$SRMV2_FQDN" 
cmd="srm-ping srm://$SRMV2_FQDN -retry_num=0 -debug" 
#echo $cmd
echo $cmd > $SERVICE_PATH/srmping.out
$cmd >> $SERVICE_PATH/srmping.out 2>&1
pingret=$?

if [ $pingret -eq 0 ]; then
    #dcache CLSs (as oppose to bestman2 CLIs.. like srm-ping / srm-ls)
    #cmd="srmls -retry_num 0 -x509_user_cert=../cert/crawlercert.pem -x509_user_key=../cert/crawlerkey.pem srm://$SRMV2_FQDN"
    cmd="srm-ls srm://$SRMV2_FQDN -retry_num=0 -debug"
    #echo $cmd
    echo $cmd > $SERVICE_PATH/srmls.out
    $cmd >> $SERVICE_PATH/srmls.out 2>&1
else
    #failed to ping.. don't bather
    exit $pingret
fi
