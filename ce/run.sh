#!/bin/bash

# This script will be executed once for each CE

# Basic rules are following...
# 1) Script will be run with CWD set to osg-crawer/ce. You need to prefix any output with $SERVICE_PATH
# 2) Only output files if you succeed to get info. You can write to something.tmp and rename the file if you get 0 return code. If errors out, remove the .tmp file. Remember that other script may be relying on the content of your file even if it's old.

# Following ENV parameters will be set for each run
echo "CE test on $OSG_SITE_NAME"
echo "SERVICE_PATH: $SERVICE_PATH"; #this is where you should put output files to
echo "hostname: $OSG_HOSTNAME";
echo "job_contact: $OSG_JOB_CONTACT"

#the fact that we got env file means we should be able to run program on this site
#echo "running dryrun"
#globus-job-run -dryrun $OSG_HOSTNAME /bin/hostname > $SERVICE_PATH/globus.dryrun.stdout 2> $SERVICE_PATH/globus.dryrun.stderr
#if [ $? -ne 0 ]; then
#    echo "failed to run dry run on $OSG_HOSTNAME.. aborting rest of the test"
#    exit 1
#fi

###################################################################################################
echo "running loadconfig.sh"
echo "globus-job-run $OSG_HOSTNAME -s loadconfig.sh | tar -xz -C $SERVICE_PATH"
globus-job-run $OSG_HOSTNAME -s loadconfig.sh | tar -xz -C $SERVICE_PATH

echo "running ce.sh"
globus-job-run $OSG_HOSTNAME -s ce.sh

echo "checking to see if this is condor cluster"
echo "globus-job-run $OSG_HOSTNAME /usr/bin/condor_version"
globus-job-run $OSG_HOSTNAME /usr/bin/condor_version
if [ $? -eq 0 ]; then
    echo "this seems to be a condor cluster ... running condor script"
    bash run_condor.sh
fi

echo "checking to see if this is pbs cluster"
echo "globus-job-run $OSG_HOSTNAME /usr/bin/pbs-config -- --version"
globus-job-run $OSG_HOSTNAME /usr/bin/pbs-config -- --version
if [ $? -eq 0 ]; then
    echo "this seems to be a pbs cluster ... running pbs script"
    bash run_pbs.sh
fi

echo "all done"
exit 0
