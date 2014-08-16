#!/bin/bash

echo "globus-url-copy test on fqdn: $GRIDFTP_FQDN";
echo "SERVICE_PATH: $SERVICE_PATH"; #this is where you should put output files to

globus-url-copy -dbg -vb -rst-timeout 10 file:///etc/issue gsiftp://$GRIDFTP_FQDN/tmp/deleteme > $SERVICE_PATH/globus-url-copy.out 2>&1
if [ $? -ne 0 ]; then
    echo "failed to run globus-url-copy on $GRIDFTP_FQDN see $SERVICE_PATH/globus-url-copy.out"
    #cat $SERVICE_PATH/globus-url-copy.out
    exit 1
fi

