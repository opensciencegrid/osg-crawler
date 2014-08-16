Installation

Install crawler service certificate in /cert (see REAMDE there)

Create data directory to store crawl data
mkdir /usr/local/crawler_data

Initialize as git repository
cd /usr/local/crawler_data && git init

Review config.json to make sure everything looks right (location for your certificate, VO to run tests under, etc..)

Crawling Instruction

Step 1. myosg.js

You begin crawling by running myosg.js. This script will download MyOSG resource summary list and setup directory structures under datadir you specified in the config.json. The directory structure it creates is following

<datadir>/<grid type>/<resource group name>/<resource name>/<service name>

Along the way, it writes out various data returned from MyOSG under various json files like, group_info.json, resource_info.json, service_info.json.

You should run this at least once a day. Also, in order to handle resource rename / deactivation, you should setup another cron to look for old directories and remove them based on your preferred time limit (TODO - add a cron entry sample for this).

Step 2. bdii.sh

This script walk the directory structure provides in step 1 and download current bdii data for each services (CE, SRMv2) and stores various entries under directory structure determined by each DN

Step 3. Setup cron

#set this to wherever you've installed your crawler
OSG_CRAWLER_HOME=/usr/local/osg-crawler

#init proxy -- change "mis" to whichever the VO your certificate is registered
0 0 * * * voms-proxy-init -voms mis -cert $OSG_CRAWLER_HOME/cert/crawlercert.pem -key $OSG_CRAWLER_HOME/cert/crawlerkey.pem >> $OSG_CRAWLER_LOG

#run tests
15 0 * * * /usr/local/node-v0.10.24-linux-x64/bin/node $OSG_CRAWLER_HOME/myosg.js >> $OSG_CRAWLER_LOG
20 0 * * * /usr/local/node-v0.10.24-linux-x64/bin/node $OSG_CRAWLER_HOME/bdii.js >> $OSG_CRRAWLER_LOG
25 0 * * * /usr/local/node-v0.10.24-linux-x64/bin/node $OSG_CRAWLER_HOME/ce_env.js >> $OSG_CRAWLER_LOG

15 2 * * * (todo - script to remove old directories)

#commit changed to git periodically
20 5 * * 0 $OSG_CRAWLER_HOME/commit.sh >> $OSG_CRAWLER_LOG

Step 4. Install gitweb

gitweb allows you to browse your git repository via web browser. If you want this, just install gitweb

$ yum intall gitweb




