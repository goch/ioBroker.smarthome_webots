#!/usr/bin/bash

npm pack
scp iobroker.maskor_webots-0.0.1.tgz pi@iobroker-expert.local:
#ssh -t pi@iobroker-expert.local 'bash -l -c  "iobroker stop maskor_webots.0 && cd /opt/iobroker && npm i ~/iobroker.maskor_webots-0.0.1.tgz"' 
