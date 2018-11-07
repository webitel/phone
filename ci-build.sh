#!/bin/bash

set -ev

if [ ! -z "$TRAVIS_TAG" ]; then DO=latest; else DO=alpha;fi

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
        echo "-----> build for  linux"
        if [ ! -z "$TRAVIS_TAG" ]; then sed -i 's/X.X.X/'${TRAVIS_TAG}'/g' electron/package.json; else sed -i 's/X.X.X/1.'${TRAVIS_JOB_NUMBER}'/g' electron/package.json; fi
        docker run --rm \
        --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
        -v ${PWD}:/project \
        -v ~/.cache/electron:/root/.cache/electron \
        -v ~/.cache/electron-builder:/root/.cache/electron-builder \
        electronuserland/builder:wine-mono \
        /bin/bash -c "npm install && npm run relese-$DO -- --x64 -w --linux"
    else
        echo "-----> build for mac"
        if [ ! -z "$TRAVIS_TAG" ]; then sed -i '' 's/X.X.X/'${TRAVIS_TAG}'/g' electron/package.json; else sed -i '' 's/X.X.X/1.'${TRAVIS_JOB_NUMBER}'/g' electron/package.json; fi
        /bin/bash -c "npm install && npm run relese-$DO -- --mac"

fi
