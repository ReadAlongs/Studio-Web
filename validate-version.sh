#!/bin/sh

INPUT_TAG="$1"

if [ -z "$INPUT_TAG" ]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

VERSION=${INPUT_TAG#v}
BAD=

echo "Checking that version in packages/web-component/package.json == $VERSION"
if [ "$(jq -r .version packages/web-component/package.json)" != "$VERSION" ]; then
  echo "ERROR: version mismatch in packages/web-component/package.json"
  BAD=1
fi

echo "Checking that version in packages/ngx-web-component/package.json == $VERSION"
if [ "$(jq -r .version packages/ngx-web-component/package.json)" != "$VERSION" ]; then
  echo "ERROR: version mismatch in packages/ngx-web-component/package.json"
  BAD=1
fi

echo "Checking that peer dependency on @readalongs/web-component in packages/ngx-web-component/package.json == $VERSION"
if [ "$(jq -r '.peerDependencies."@readalongs/web-component"' packages/ngx-web-component/package.json)" != "$VERSION" ]; then
  echo "ERROR: peer dependency on @readalongs/web-component version mismatch in packages/ngx-web-component/package.json"
  BAD=1
fi

echo "Checking that singleFileBundleVersion in packages/studio-web/package.json == $VERSION"
if [ "$(jq -r .singleFileBundleVersion packages/studio-web/package.json)" != "$VERSION" ]; then
  echo "ERROR: singleFileBundleVersion mismatch in packages/studio-web/package.json"
  BAD=1
fi

version_less_than() {
  { echo "$1"; echo "$2"; } | sort -V -C && [ "$1" != "$2" ]
}

echo Checking versions published on npmjs.com...
NPM_VERSION_WEBC=$(npm view @readalongs/web-component version)
echo "Published NPM @readalongs/web-component version: $NPM_VERSION_WEBC"
NPM_VERSION_NGXWEBC=$(npm view @readalongs/ngx-web-component version)
echo "Published NPM @readalongs/ngx-web-component version: $NPM_VERSION_NGXWEBC"
echo "New version: $VERSION"

if [ "$NPM_VERSION_WEBC" != "$NPM_VERSION_NGXWEBC" ]; then
  echo "WARNING: published NPM @readalongs/web-component and @readalongs/ngx-web-component versions differ"
fi

if ! version_less_than "$NPM_VERSION_WEBC" "$VERSION"; then
  echo "ERROR: new version $VERSION is not greater than published NPM @readalongs/web-component version $NPM_VERSION_WEBC"
  BAD=1
fi

if ! version_less_than "$NPM_VERSION_NGXWEBC" "$VERSION"; then
  echo "ERROR: new version $VERSION is not greater than published NPM @readalongs/ngx-web-component version $NPM_VERSION_NGXWEBC"
  BAD=1
fi

if [ -n "$BAD" ]; then
  exit 1
else
  echo "All version checks passed."
fi
