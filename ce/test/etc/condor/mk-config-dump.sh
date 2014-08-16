#!/bin/bash

# make a record of the condor configuration

NOWISH=`date +%F-%H-%M`
SHORTHOST=`hostname -s`
DUMPFILE=/etc/condor/condor_config_val.dump.${SHORTHOST}.${NOWISH}
condor_config_val -dump > ${DUMPFILE} 2>&1
chmod 600 ${DUMPFILE}
