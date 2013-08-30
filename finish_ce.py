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
from datetime import datetime

results = {"sites": {}, "crawl_time": str(datetime.now())}

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

    count = count + 1

    results["sites"][name] = {}
    if gridtype == "OSG Production Resource":
        results["sites"][name]["production"] = True
    else:
        results["sites"][name]["production"] = False

    for service in resource.xpathEval("Services/Service"):
        service_name = service.xpathEval("Name")[0].content
        if service_name == "CE":
            try:
                if service.xpathEval("Details/hidden")[0].content == "True":
                    results["sites"][name] = {"hidden":True}
                    continue
            except:
                #assume not hidden
                None

            #try override
            try:
                override = service.xpathEval("Details/uri_override")[0].content
                if override != "":
                    fqdn = override
            except:
                #assume not overriden
                None

            results["sites"][name]["fqdn"] = fqdn

            outpath = "/tmp/osgcrawl.osg.ce."+name+".out"
            errpath = "/tmp/osgcrawl.osg.ce."+name+".err"
            copyerrpath = "/tmp/osgcrawl.osg.ce."+name+".copyerr"
            if os.path.exists(outpath):
                try:
                    f = open(outpath, "r")
                    result = pickle.loads(f.read()) 
                    f.close()
                    results["sites"][name]["ce"] = result
                except:
                    results["sites"][name]["ce"] = None


            if os.path.exists(errpath):
                f = open(errpath, "r")
                err = f.read()
                f.close()
                if err != "":
                    results["sites"][name]["ce_stderr"] = err

            #pull copyerr
            if os.path.exists(copyerrpath):
                f = open(copyerrpath, "r")
                copyerr = f.read()
                f.close()
                if copyerr != "":
                    results["sites"][name]["ce_copyerr"] = copyerr

f = open("/tmp/osgcrawl.osg.json", "w")
f.write(json.dumps(results))
f.close()
print "updated /tmp/osgcrawl.osg.json"
