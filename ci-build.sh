#!/bin/bash

set -ev

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
        echo "-----> build for  linux"
        docker run --rm \
        --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
        -v ${PWD}:/project \
        -v ~/.cache/electron:/root/.cache/electron \
        -v ~/.cache/electron-builder:/root/.cache/electron-builder \
        electronuserland/builder \
        /bin/bash -c "npm install && npm run relese-latest --win --linux"
    else
        echo "-----> build for mac"
        /bin/bash -c "npm install && npm run relese-latest --mac"

fi
