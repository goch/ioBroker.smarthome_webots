#!/usr/bin/bash

npm pack
#scp iobroker.maskor_webots-0.0.2.tgz pi@iobroker-expert.local:
#ssh -t pi@iobroker-expert.local 'bash -l -c  "iobroker stop maskor_webots.0 && cd /opt/iobroker && npm i ~/iobroker.maskor_webots-0.0.2.tgz"' 


cd /opt/iobroker
sudo npm i /home/goch/bachelor_ws/ioBroker.smarthome_webots/iobroker.smarthome_webots-0.0.1.tgz
iobroker upload smarthome_webots

