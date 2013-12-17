#!/usr/bin/python
import libxml2
import sys
import simplejson as json
import subprocess
import threading
import os
import signal
import time
import pickle
import time

import pymongo
client = pymongo.MongoClient()
db = client.osg

#load current resource summary (make sure to register if you decide to use this script)
rgsummary_doc = libxml2.parseFile("http://myosg.grid.iu.edu/rgsummary/xml?summary_attrs_showservice=on&summary_attrs_showrsvstatus=on&summary_attrs_showfqdn=on&gip_status_attrs_showtestresults=on&downtime_attrs_showpast=&account_type=cumulative_hours&ce_account_type=gip_vo&se_account_type=vo_transfer_volume&bdiitree_type=total_jobs&bdii_object=service&bdii_server=is-osg&start_type=7daysago&start_date=05%2F31%2F2012&end_type=now&end_date=05%2F31%2F2012&all_resources=on&facility_10009=on&gridtype_1=on&service=on&service_1=on&active=on&active_value=1&disable_value=1")
resources = rgsummary_doc.xpathEval("//Resource")
count = 0
for resource in resources:
    id = resource.xpathEval("ID")[0].content
    name = resource.xpathEval("Name")[0].content
    fqdn = resource.xpathEval("FQDN")[0].content
    status = resource.xpathEval("RSVStatus/Status")[0].content
    gridtype = resource.xpathEval("../../GridType")[0].content
    if gridtype == "OSG Production Resource":
        production = True
    else:
        production = False


    print "#",fqdn,count,"of",len(resources)
    count = count + 1

    for service in resource.xpathEval("Services/Service"):
        service_name = service.xpathEval("Name")[0].content
        if service_name == "CE":
            try:
                if service.xpathEval("Details/hidden")[0].content == "True":
                    print "#hidden service - skipping"
                    #results["sites"][name] = {"hidden":True}
                    print
                    continue
            except:
                #assume not hidden
                None

            #try override
            try:
                override = service.xpathEval("Details/uri_override")[0].content
                if override != "":
                    fqdn = override
                    print "#fqdn overriden to", fqdn
            except:
                #assume not overriden
                None

            #upsert ce info
            db.ce.update({"fqdn": fqdn}, {"$set": {"name": name, "status": status, "production": production}}, True)

            print "globus-url-copy file:///etc/issue gsiftp://"+fqdn+"/tmp/deleteme > /tmp/osgcrawl.osg.ce."+name+".copyout 2> /tmp/osgcrawl.osg.ce."+name+".copyerr &"
            print "globus-job-run",fqdn,"-s tester_ce.py > /tmp/osgcrawl.osg.ce."+name+".out 2> /tmp/osgcrawl.osg.ce."+name+".err &"
            print "ldapsearch -h is.grid.iu.edu -p 2170 -l 3 -x -b mds-vo-name="+name+",mds-vo-name=local,o=grid \"(objectClass=GlueHostMainMemory)\" > /tmp/osgcrawl.osg.bdii."+name+".txt &"
            print 


