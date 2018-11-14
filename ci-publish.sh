#!/bin/bash

set -ev

chmod 600 id_rsa
rsync -azP -e "ssh -p 44022 -i id_rsa -o StrictHostKeyChecking=no" --exclude mac --exclude linux-unpacked --exclude win-unpacked release-builds/ wphone@cloud-ams1.webitel.com:~/builds/
