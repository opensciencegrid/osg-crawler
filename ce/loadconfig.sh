#!/bin/bash

#list all files / directories that you'd like to pull from each CEs
tar -cz \
    /var/lib/osg \
    /etc/osg \
    /etc/grid-security/grid-mapfile \
    /etc/globus \
    /etc/gums \
    /etc/condor \
    /etc/lcmaps.db \
    /etc/syslog.conf \
    /etc/cvmfs \
    /etc/modprobe.conf \
    /etc/sysconfig \
    /etc/yum.conf \
    /etc/issue \
    /etc/edg-mkgridmap.conf 
