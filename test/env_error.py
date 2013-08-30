#!/usr/bin/python
import simplejson
import urllib

#load crawl info for OSG vo
url="http://soichi6.grid.iu.edu/home/index/osgcrawl"
f = urllib.urlopen(url+"?vo=osg")
siteinfo = simplejson.loads(f.read())

#list sites that has oasis
for name, info in siteinfo["sites"].items():
    try:
        print name

        #check osg_app mismatch
        ce_osg_app = info["result"]["env"]["OSG_APP"]
        wn_osg_app = info["wn"]["env"]["OSG_APP"]
        if ce_osg_app != wn_osg_app:
            print "\tce: OSG_APP =",ce_osg_app
            print "\twn: OSG_APP =",wn_osg_app

        #check osg_data mismatch
        ce_osg_data = info["result"]["env"]["OSG_DATA"]
        wn_osg_data = info["wn"]["env"]["OSG_DATA"]
        if ce_osg_data != wn_osg_data:
            print "\tce: OSG_APP =",ce_osg_data
            print "\twn: OSG_APP =",wn_osg_data

        #check username mismatch
        ce_username = info["result"]["username"]
        wn_username = info["wn"]["username"]
        if ce_username != wn_username:
            print "\tce: username =",ce_osg_data
            print "\twn: username =",wn_osg_data

    except TypeError:
        print "\t??"
    except KeyError:
        print "\t??"
