#!/usr/bin/python

import sys
import platform
import os
import getpass
import time
import subprocess
import signal
#import simplejson
#import json

result = {}

#gather basic platform info
result["platform"] = {}
(system, node, release, version, machine, processor) = platform.uname()
result["platform"]["system"] = system
result["platform"]["node"] = node
result["platform"]["release"] = release
result["platform"]["version"] = version
result["platform"]["machine"] = machine
result["platform"]["processor"] = processor
result["username"] = getpass.getuser()

#result["os_name"] = os.name
result["platform"]["dist"] = platform.dist()
#result["platform"]["libc_ver"] = platform.libc_ver("/usr/bin/python")

#pull env parameters that we care about
envs = os.environ
result["env"] = {}
for env in envs:
    #any OSG envs..
    if env.startswith("OSG"):
        result["env"][env] = envs[env]

    #any BLAST envs..
    if env.startswith("BLAST"):
        result["env"][env] = envs[env]

#see if we can write to OSG_DATA
try:
    osg_data = envs["OSG_DATA"]
    result["has_osgdata"] = True
    if os.access(osg_data, os.W_OK):
        result["can_write_osgdata"] = True
    else:
        #try $OSG_DATA/username - sometime admin will create dir for us
        if os.access(osg_data+"/"+result["username"], os.W_OK):
            result["can_write_osgdata"] = True
        else:
            result["can_write_osgdata"] = False
        
except KeyError:
    result["has_osgdata"] = False
    result["can_write_osgdata"] = False

#see if we can write to OSG_APP
try:
    osg_app = envs["OSG_APP"]
    result["has_osgapp"] = True
    if os.access(osg_app, os.W_OK):
        result["can_write_osgapp"] = True
    else:
        #try $OSG_DATA/username - sometime admin will create dir for us
        if os.access(osg_app+"/"+result["username"], os.W_OK):
            result["can_write_osgapp"] = True
        else:
            result["can_write_osgapp"] = False
    
except KeyError:
    result["has_osgapp"] = False
    result["can_write_osgapp"] = False

#NOTE: according to steve, this is only accurate on wn - but, I have a lot of sites that I can't submit jobs..
#see if various cvmfs are mounted
result["cvmfs"] = {}
for test_dir in ["oasis.opensciencegrid.org", "atlas.cern.ch", "atlas-condb.cern.ch", "lhcb.cern.ch", "cms.cern.ch"]:
    if os.path.isdir("/cvmfs/"+test_dir):
        result["cvmfs"].append(test_dir)

def which(program):
    import os
    def is_exe(fpath):
        return os.path.isfile(fpath) and os.access(fpath, os.X_OK)

    fpath, fname = os.path.split(program)
    if fpath:
        if is_exe(program):
            return program
    else:
        for path in os.environ["PATH"].split(os.pathsep):
            path = path.strip('"')
            exe_file = os.path.join(path, program)
            if is_exe(exe_file):
                return exe_file

    return None


#get list of apps installed (under osg for now...)
#result["apps"] = {}
#result["apps"]["gcc"] = which("gcc")
#result["apps"]["python"] = which("python")

#path=envs["OSG_APP"]+"/"+result["username"]+"/python-2.7.5/bin/python"
#if os.path.exists(path) and os.path.getsize(path) > 0: 
#    result["apps"]["python-2.7.5"] = path
#else:
#    result["apps"]["python-2.7.5"] = None

#
#path=envs["OSG_APP"]+"/"+result["username"]+"/ncbi-blast-2.2.28+/bin"
#if os.path.exists(path) and os.path.getsize(path) > 0:
#    result["apps"]["ncbi-blast-2_2_28+"] = path
#else:
#    result["apps"]["ncbi-blast-2_2_28+"] = None

#path=envs["OSG_APP"]+"/"+result["username"]+"/blender-2.67b-linux-glibc211-x86_64"
#if os.path.exists(path) and os.path.getsize(path) > 0:
#    result["apps"]["blender-2.67b"] = path
#else:
#    result["apps"]["blender-2.67b"] = None

#test for data
result["data"] = {}

#check data partition disk usage
if os.path.exists(envs["OSG_DATA"]):
    st = os.statvfs(envs["OSG_DATA"])
    free = st.f_bavail * st.f_frsize
    total = st.f_blocks * st.f_frsize
    used = (st.f_blocks - st.f_bfree) * st.f_frsize
    result["data"]["bytes_free_M"] = free/1024/1024
    result["data"]["bytes_total_M"] = total/1024/1024
    result["data"]["bytes_used_M"] = used/1024/1024

    path=envs["OSG_DATA"]+"/"+result["username"]+"/blastdb/nr.pal"
    if os.path.exists(path):
        if os.stat(path).st_size > 0:
            result["data"]["blastdb-nr"] = {"path": path, "ctime":time.ctime(os.path.getctime(path))}
        else:
            result["data"]["blastdb-nr"] = "nr.pal is empty"
    else:
        result["data"]["blastdb-nr"] = None
else:
    result["data"]["missing"] = True

#cluster specific tests
condor_status_path = which("condor_status")
if condor_status_path != None:
    result["condor"] = {"condor_status_path": condor_status_path}
    p = subprocess.Popen(condor_status_path+" -total", shell=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, preexec_fn=os.setsid)
    count = 0
    while True:
        retval = p.poll()
        if retval != None:
            stderr = p.stderr.read()
            if stderr != "":
                result["condor"]["stderr"] = stderr
            if retval == 0:
                try:
                    stdout = p.stdout.read()
                    lines = stdout.split("\n")
                    lastline = lines[-2].split()
                    result["condor"]["slots"] = lastline[1]
                    result["condor"]["idle_slot"] = lastline[4]
                except KeyError:
                    result["condor"]["result_exception"] = "invalid result - keyerror"
                except EOFError:
                    result["condor"]["result_exception"] = "invalid result - eoferror"
                except IndexError:
                    result["condor"]["result_exception"] = "invalid result - indexerror"
            break

        time.sleep(1)
        count = count + 1
        if count > 10:
            os.killpg(p.pid, signal.SIGTERM)
            result["condor"]["timeout"] = True
            break

qstat_path = which("qstat")
if qstat_path != None:
    #PBS cluster
    #TODO - maybe parse output from qstat -B?
    #http://wiki.ibest.uidaho.edu/index.php/Tutorial:_Check_on_the_status_of_the_cluster_or_all_your_jobs#Use_.27qstat_-B.27_to_display_the_status:
    result["pbs"] = {}
    p = subprocess.Popen(qstat_path+" -B", shell=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, preexec_fn=os.setsid)
    count = 0
    while True:
        retval = p.poll()
        if retval != None:
            stderr = p.stderr.read()
            if stderr != "":
                result["pbs"]["stderr"] = stderr
            if retval == 0:
                try:
                    stdout = p.stdout.read()
                    lines = stdout.split("\n")
                    #print lines[2].split()
                    try:
                        stats = lines[2].split()
                        result["pbs"]["total"] = stats[2]
                        result["pbs"]["queue"] = stats[3]
                        result["pbs"]["running"] = stats[4]
                    except IndexError:
                        result["pbs"]["invalid_qstat"] = True

                except KeyError:
                    result["pbs"]["result_exception"] = "invalid result - keyerror"
                except EOFError:
                    result["pbs"]["result_exception"] = "invalid result - eoferror"
                except IndexError:
                    result["pbs"]["result_exception"] = "invalid result - indexerror"
            break

        time.sleep(1)
        count = count + 1
        if count > 10:
            os.killpg(p.pid, signal.SIGTERM)
            result["pbs"]["timeout"] = True
            break

import pickle
print pickle.dumps(result)
