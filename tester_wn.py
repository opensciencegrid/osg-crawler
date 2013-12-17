#!/usr/bin/python

import os
import subprocess
import platform
import getpass
import time
import sys

#execute by doing
#globus-job-run ce.grid.iu.edu/jobmanger-condor -stdin -s tester_wn.py /usr/bin/python

result = {}

#only on 2.6
#import multiprocessing
#result["cpu_count"] = multiprocessing.cpu_count()

result["_fqdn"] = sys.argv[1]
result["_jobcontact"] = sys.argv[2]

result["platform"] = {}
(system, node, release, version, machine, processor) = platform.uname()
result["platform"]["system"] = system
result["platform"]["node"] = node
result["platform"]["release"] = release
result["platform"]["version"] = version
result["platform"]["machine"] = machine
result["platform"]["processor"] = processor
result["platform"]["dist"] = platform.dist()
result["username"] = getpass.getuser()

#pull all envs
envs = os.environ
result["env"] = {}
for env in envs:
    #any OSG envs..
    if env.startswith("OSG"):
        result["env"][env] = envs[env]

    #any BLAST envs..
    if env.startswith("BLAST"):
        result["env"][env] = envs[env]

#cpu count
p = subprocess.Popen("cat /proc/cpuinfo | grep processor | wc -l", shell=True,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
retval = p.wait()
result["cpu_count"] = p.stdout.read().strip()

#glibc version
p = subprocess.Popen("ldd --version", shell=True,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
retval = p.wait()
try:
    stdout = p.stdout.read()
    lines = stdout.split("\n")
    result["glibc_version"] = lines[0].split(")")[1].strip()
except:
    result["glibc_version"] = None

#memory size
p = subprocess.Popen("cat /proc/meminfo", shell=True,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
retval = p.wait()
stdout = p.stdout.read()
meminfo = {}
for line in stdout.split("\n"):
    line = line.strip()
    if line == "":
        continue
    line_t = line.split(":")
    name = line_t[0].strip()
    size = line_t[1].strip()
    meminfo[name] = size
result["MemTotal"] = meminfo["MemTotal"]
result["MemFree"] = meminfo["MemFree"]

#see if various cvmfs are mounted
result["cvmfs"] = {}
for test_dir in ["oasis.opensciencegrid.org", "atlas.cern.ch", "atlas-condb.cern.ch", "lhcb.cern.ch", "cms.cern.ch"]:
    if os.path.isdir("/cvmfs/"+test_dir):
        result["cvmfs"].append(test_dir)

#get list of apps installed (under osg for now...)
#result["apps"] = {}

#path=envs["OSG_APP"]+"/"+result["username"]+"/python-2.7.5/bin/python"
#if os.path.exists(path) and os.path.getsize(path) > 0: 
#    result["apps"]["python-2.7.5"] = path
#
#    #test modules
#    env = {"PYTHONPATH": envs["OSG_APP"]+"/"+result["username"]+"/python-modules/pika-0.9.13",
#            "LD_LIBRARY_PATH": os.environ["LD_LIBRARY_PATH"]+":"+envs["OSG_APP"]+"/"+result["username"]+"/python-modules/glibc_"+result["glibc_version"]+"/openssl"}
#    #print env
#    result["apps"]["python-modules"] = {}
#    p = subprocess.Popen(path+" -c 'import pika'", shell=True, 
#        env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
#    retval = p.wait()
#    if retval == 0:
#        result["apps"]["python-modules"]["pika"] = True
#    else:
#        result["apps"]["python-modules"]["pika"] = False
#        result["apps"]["python-modules"]["pika_stderr"] = p.stdout.read()
#
#else:
#    result["apps"]["python-2.7.5"] = None

#path=envs["OSG_APP"]+"/"+result["username"]+"/ncbi-blast-2.2.28+/bin"
#if os.path.exists(path) and os.path.getsize(path) > 0:
#    result["apps"]["ncbi-blast-2.2.28+"] = path
#else:
#    result["apps"]["ncbi-blast-2.2.28+"] = None

#path=envs["OSG_APP"]+"/"+result["username"]+"/blender-2.67b-linux-glibc211-x86_64"
#if os.path.exists(path) and os.path.getsize(path) > 0:
#    result["apps"]["blender-2.67b"] = path
#else:
#    result["apps"]["blender-2.67b"] = None
#

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

            #we really should do the blast test after we actually try to install them.. 
            #store test fasta
            #f = open("test.fasta", "w")
            #f.write(">test query\n")
            #f.write("ACGTCCGAGACGCGAGCAGCGAGCAGCAGAGCGACGAGCAGCGACGA")
            #f.close()

            #run blastp and make sure db is good
            #env = {"BLASTDB": envs["OSG_DATA"]+"/"+result["username"]+"/blastdb"}
            #result["data"]["blastdbcheck-nr"] = {}
            #p = subprocess.Popen(result["apps"]["ncbi-blast-2.2.28+"]+"/blastp -db nr -query test.fasta", shell=True, 
            #    env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
            #retval = p.wait()
            #if retval == 0:
            #    result["data"]["blastp-nr-ret"] = retval
            #else:
            #    result["data"]["blastp-nr-ret"] = retval

        else:
            result["data"]["blastdb-nr"] = "nr.pal is empty"
    else:
        result["data"]["blastdb-nr"] = None
else:
    result["data"]["missing"] = True


import pickle
print pickle.dumps(result)
#print result
