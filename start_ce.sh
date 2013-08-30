#!/bin/bash

echo "removing old ce crawl file"
rm /tmp/osgcrawl.osg.ce.*

./stage_ce.py > /tmp/ce.sh
chmod +x /tmp/ce.sh
. /tmp/ce.sh
echo "running globus-job-run"
watch "ps -ef | grep globusrun"
echo "after some time (like 10 minutes?) run finish_ce.sh and killall globusrun"
