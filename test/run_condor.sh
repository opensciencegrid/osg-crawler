#!/bin/bash

echo "running condor_status"
globus-job-run $OSG_HOSTNAME /usr/bin/condor_status -xml > $service_dir/condor_status.xml
