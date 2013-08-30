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
        if info["production"]:
            if info["wn"]["data"]["blastdb-nr"]["ctime"]:
                print name,info["wn"]["data"]["blastdb-nr"]["path"]
    except:
        None
