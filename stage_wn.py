#!/usr/bin/python
import sys
import os
import urllib
import simplejson

print "universe = grid"
print "notification = never"
print "executable = tester_wn.py"
print "should_transfer_files = YES"
print "log = tester_wn.log"
#print "Requirements = (OpSys==\"LINUX\") && (Arch == \"X86_64\") && (Memory > 1) && (Disk > 100)"
print

#load cluster info
url="http://soichi6.grid.iu.edu/home/index/osgcrawl"
f = urllib.urlopen(url+"?vo=osg")
json = f.read()
siteinfo = simplejson.loads(json)
for name, info in siteinfo["sites"].items():
    print "#",name
    try:
        jobcontact = info["ce"]["env"]["OSG_JOB_CONTACT"]
        print "output = /tmp/osgcrawl.osg.wn."+name+".out"
        print "error = /tmp/osgcrawl.osg.wn."+name+".err"
        print "grid_resource = gt2 "+jobcontact
        print "arguments = "+name
        print "queue"
    except:
        print "#no ce info"

    print


