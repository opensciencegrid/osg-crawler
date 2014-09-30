#!/bin/bash

#run CVE-2014-6271 test
env x='() { :;}; echo bash vulnerable' bash -c "" 2> /dev/null
