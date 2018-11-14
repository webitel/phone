#!/bin/bash

set -ev

rsync -azP -e "ssh -p 44022 -i id_rsa -o CheckHostIP=no" --exclude '*/*/' --include '*' release-builds wphone@cloud-ams1.webitel.com:~/builds/
