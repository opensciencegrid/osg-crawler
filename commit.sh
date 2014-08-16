#!/bin/bash

#TODO - load the location from config.json somehow
DATADIR=/usr/local/crawler_data

echo $DATADIR

echo "init"
(cd $DATADIR && git init .)

echo "adding $DATADIR"
(cd $DATADIR && git add .)

echo "diffing $DATADIR"
(cd $DATADIR && git diff)

echo "commiting $DATADIR"
date=`date`
(cd $DATADIR && git commit -a -m "auto-comit $date")
