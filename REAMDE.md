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

#run daily
15 0 * * * crawler node /usr/local/osg-crawler/myosg.js
15 1 * * * crawler node /usr/local/osg-crawler/bdii.js
15 2 * * * crawler (todo - script to remove old directories)

#commit to git weekly
20 0 * * 0 crawler /usr/local/osg-crawler/commit.sh

Step 4. Install gitweb

gitweb allows you to browse your git repository

$ yum intall gitweb



