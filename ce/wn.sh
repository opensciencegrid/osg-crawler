#!/bin/bash

echo "hostname"
hostname

echo "whoami"
whoami

echo "/proc/cpuinfo"
cat /proc/cpuinfo

echo "/proc/meminfo"
cat /proc/meminfo

echo "ls /cvmfs"
ls /cvmfs
echo "ls /cvmfs/oasis.opensciencegrid.org"
ls /cvmfs/oasis.opensciencegrid.org

echo "df"
df
