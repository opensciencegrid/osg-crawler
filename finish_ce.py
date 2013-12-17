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

import pymongo
client = pymongo.MongoClient()
db = client.osg

#results = {"sites": {}, "crawl_time": str(datetime.now())}

#load current resource summary (make sure to register if you decide to use this script)
rgsummary_doc = libxml2.parseFile("http://myosg.grid.iu.edu/rgsummary/xml?summary_attrs_showservice=on&summary_attrs_showrsvstatus=on&summary_attrs_showfqdn=on&gip_status_attrs_showtestresults=on&downtime_attrs_showpast=&account_type=cumulative_hours&ce_account_type=gip_vo&se_account_type=vo_transfer_volume&bdiitree_type=total_jobs&bdii_object=service&bdii_server=is-osg&start_type=7daysago&start_date=05%2F31%2F2012&end_type=now&end_date=05%2F31%2F2012&all_resources=on&facility_10009=on&gridtype_1=on&service=on&service_1=on&active=on&active_value=1&disable_value=1")
resources = rgsummary_doc.xpathEval("//Resource")
for resource in resources:
    rid = resource.xpathEval("ID")[0].content
    name = resource.xpathEval("Name")[0].content
    fqdn = resource.xpathEval("FQDN")[0].content
    status = resource.xpathEval("RSVStatus/Status")[0].content
    gridtype = resource.xpathEval("../../GridType")[0].content
    if gridtype == "OSG Production Resource":
        production = True
    else:
        production = False

    for service in resource.xpathEval("Services/Service"):
        service_name = service.xpathEval("Name")[0].content
        if service_name == "CE":

            hidden = False
            try:
                if service.xpathEval("Details/hidden")[0].content == "True":
                    hidden = True
            except:
                None

            #try override
            try:
                override = service.xpathEval("Details/uri_override")[0].content
                if override != "":
                    fqdn = override
            except:
                #assume not overriden
                None

            outpath = "/tmp/osgcrawl.osg.ce."+name+".out"
            errpath = "/tmp/osgcrawl.osg.ce."+name+".err"
            copyerrpath = "/tmp/osgcrawl.osg.ce."+name+".copyerr"

            #upsert ce info
            #site = db.ce.find_one({"fqdn": fqdn})
            #if site != None:
            #    id = site["_id"]
            #else:
            #    print "adding new ce",fqdn
            #    id = db.ce.insert({"fqdn": fqdn})
            #db.ce.update({"fqdn": fqdn}, {"$set": {"name": name, "status": status, "production": production, "hidden": hidden}})

            results = {}
            print outpath
            if os.path.exists(outpath):
                try:
                    f = open(outpath, "r")
                    results = pickle.loads(f.read()) 
                    f.close()
                except:
                    print "can't parse", outpath

            if os.path.exists(errpath):
                f = open(errpath, "r")
                err = f.read()
                f.close()
                if err != "":
                    results["ce_stderr"] = err

            #pull copyerr
            if os.path.exists(copyerrpath):
                f = open(copyerrpath, "r")
                copyerr = f.read()
                f.close()
                if copyerr != "":
                    results["ce_copyerr"] = copyerr

            #results["ce_id"] = id
            db.ce.update({"fqdn": fqdn}, {"$set": {"ce":results}})

            continue

#f = open("/tmp/osgcrawl.osg.json", "w")
#f.write(json.dumps(results))
#f.close()
#print "updated /tmp/osgcrawl.osg.json"

#post to mongo
#client = pymongo.MongoClient()
#osg = client.osg

#find the site if it already exists
#osg.sites.insert(results);

