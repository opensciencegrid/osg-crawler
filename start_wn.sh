#!/bin/bash

echo "removing old wn crawl file"
rm /tmp/osgcrawl.osg.wn.*

mv tester_wn.log tester_wn.log.previous

./stage_wn.py > /tmp/wn.submit
condor_submit /tmp/wn.submit

watch condor_q -wide
echo "after some time (like 10 minutes?) run stop_wn.sh <clusterid>"
echo "tail -f tester_wn.log for more info"
