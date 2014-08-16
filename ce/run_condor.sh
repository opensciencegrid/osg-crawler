#!/bin/bash
echo "condor_status"
globus-job-run $OSG_HOSTNAME /usr/bin/condor_status -xml > $SERVICE_PATH/condor_status.xml.tmp
if [ $? -eq  0 ]; then
    #success
    mv $SERVICE_PATH/condor_status.xml.tmp $SERVICE_PATH/condor_status.xml
else
    #failed to load condor_status..
    rm $SERVICE_PATH/condor_status.xml.tmp
fi

echo "submitting wn.sh"
globus-job-run $OSG_HOSTNAME/jobmanager-condor -m 1 -s wn.sh > $SERVICE_PATH/wn.out
