ReadAlongs Web Component
=======================

Interactive story telling embeddable into any website!

<!-- TODO: put an animated GIF here, showing it off! -->

This mono repo combines four packages:

 - A [stencil web component](packages/web-component/) for visualizing read alongs,
 - An [Angular Library](packages/ngx-web-component/) that wraps the stencil web component,
 - A [demo web application](packages/angular-demo/) to show how to use the angular library in an Angular web application.
- The [Studio-Web](packages/Studio-Web/) application for creating ReadAlongs

For maintainers
---------------

This repo is managed using [Nx]. The biggest change between using Nx and
using npm is **you can no longer run `npm install` within packages**.
Instead, always run `npm install` from the root directory of the
repository. You also should only run commands from the root of the repo. See guides below for specific commands.

[Nx]: https://nx.dev/

### Cloning

First clone the repo:

    git clone git@github.com:ReadAlongs/Web-Component.git

Then clone the submodule:

    cd Web-Component && git submodule update --init 

### Installing dependencies

First, make sure Lerna is installed:

    npm install -g nx

Then,

    npm install

### Serving/Development

#### Web-Component

If you are only developing the web-component you can run the following to start serving the test-data:

    nx serve-test-data web-component

Then, in another terminal, run the following to serve the web-component:

    nx serve web-component

#### Studio-Web

To run Studio-Web, you first have to build the web-component:

    nx build web-component --watch

Then serve Studio-Web by running:

    nx serve Studio-Web

Note, that you will need to also spin-up the ReadAlong-Studio API in order to have Studio-Web work properly. To do that, first clone the Python Package/API repo:

    git clone https://github.com/ReadAlongs/Studio.git
    cd Studio
    pip install -e .

then run:

    PRODUCTION= uvicorn readalongs.web_api:web_api_app --reload     

Studio-Web will automatically [publish](.github/workflows/publish.yml) to https://readalong-studio.mothertongues.org/ everytime there is a change to `main`. Note, that you will need to have CORS enabled through an extension like [this one](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en) in order to have the requests between Studio-Web and the API work. You will not be able to test against the prodution ReadAlongs Studio API because of the CORS protections.


### Testing

#### Web-Component

    nx cy:run web-component

#### Studio-Web

    nx test:once Studio-Web

### Build & Publish

#### Web Component & Angular Wrapper

To publish the web component, first you must belong to the [@readalongs organization](https://www.npmjs.com/org/readalongs) on NPM. Then, bump the version number in both `packages/web-component/package.json` and `packages/ngx-web-component/package.json` and build both the web component and angular wrapper:

    nx build web-component
    nx build ngx-web-component

Run the prepublish step for web-component:

    nx prepublish web-component

Then, go to the directory and publish:

    cd dist/packages/web-component && npm publish --access=public
    cd dist/packages/ngx-web-component && npm publish --access=public


License
-------

2023 © National Research Council of Canada. MIT Licensed. See LICENSE for details.
