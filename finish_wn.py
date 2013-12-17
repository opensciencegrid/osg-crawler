#!/usr/bin/python
import os
import pickle
import json

import pymongo
client = pymongo.MongoClient()
db = client.osg

for root, dirs, files in os.walk("/tmp"):
    for file in files:
        if file.startswith("osgcrawl.osg.wn.") and file.endswith(".out"):
            print "loading",file

            #remove old file
            #if os.path.exists(root+"/"+file+".json"):
            #    os.remove(root+"/"+file+".json")
                
            f = open(root+"/"+file, "r")
            try:
                result = pickle.loads(f.read())
                fqdn = result["_fqdn"]
                db.ce.update({"fqdn": fqdn}, {"$set": {"wn":result}})

                #out = open(root+"/"+file+".json", "w")
                #out.write(json.dumps(result))
                #out.close()
                print "\tok"
            except:
                print "\tfailed to unpickle"
            f.close()
