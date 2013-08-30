#!/usr/bin/python

import os
import subprocess
import platform
import getpass

#glibc version
p = subprocess.Popen("ldd --version", shell=True,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
retval = p.wait()
try:
    stdout = p.stdout.read()
    lines = stdout.split("\n")
    print lines[0].split(")")[1].strip()
except:
    None


