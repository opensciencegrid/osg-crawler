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
        if info["ce"]["cvmfs"]["oasis.opensciencegrid.org"]:
            print "\tce: mounted"
        else:
            print "\tce: not mounted"
    except:
        print "\tce: ??"

    try:
        if info["wn"]["cvmfs"]["oasis.opensciencegrid.org"]:
            print "\twn: mounted"
        else:
            print "\twn: mounted"
    except:
        print "\twn: ??"
