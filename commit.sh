#!/bin/bash

DATADIR=`./config.js datadir`

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
