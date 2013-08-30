#!/bin/bash

OSG_DATA=/net/nas01/Public/goc_itb_data
username=osg

export BLASTDB=$OSG_DATA/$username/blastdb

#blastdbcheck displays exception error.. and I am not sure if it's really accurate.
#blastdbcheck -no_isam -legacy -db nr

echo "testing blast nr db"
echo ">test query" > test.fasta
echo "ACGTCCGAGACGCGAGCAGCGAGCAGCAGAGCGACGAGCAGCGACGA" >> test.fasta
blastp -db nr -query test.fasta
ret=$?
if [ $ret == 0 ]; then
    echo "blast db seems to be ok"
    exit 0
else
    echo "blastp returned non-0" $ret
    exit $ret
fi
