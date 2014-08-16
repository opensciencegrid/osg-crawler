#!/bin/bash
echo "qnodes"
globus-job-run $OSG_HOSTNAME /usr/bin/qnodes > $SERVICE_PATH/qnodes.txt.tmp
if [ $? -eq  0 ]; then
    #success
    mv $SERVICE_PATH/qnodes.txt.tmp $SERVICE_PATH/qnodes.txt
else
    #failed to load condor_status..
    rm $SERVICE_PATH/qnodes.txt.tmp
fi

