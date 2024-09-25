#!/bin/bash

# This script is used to bundle the web component for including in Offline HTML files
# created by studio-web

set -o errexit
set -o verbose

node b64Fonts.js
npx webpack --config webpack.config.js
packageVersion=$(npm view ../../node_modules/@readalongs/web-component version)
timestamp=$(date "+%Y-%m-%d+%H-%M-%S")
cd ../studio-web
npm pkg set singleFileBundleVersion="${packageVersion}"
npm pkg set singleFileBundleTimestamp="${timestamp}"
