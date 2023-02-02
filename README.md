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

First, make sure Nx is installed:

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

Note that you will need to also spin-up the ReadAlong-Studio API in order to have Studio-Web work properly. To do that, first clone the Python Package/API repo:

    git clone https://github.com/ReadAlongs/Studio.git
    cd Studio
    pip install -e .

then run:

    PRODUCTION= uvicorn readalongs.web_api:web_api_app --reload     

Studio-Web will automatically [publish](.github/workflows/publish.yml) to https://readalong-studio.mothertongues.org/ every time there is a change to `main`. Note that you will need to have CORS enabled through an extension like [this one](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en) in order to have the requests between Studio-Web and the API work. You will not be able to test against the prodution ReadAlongs Studio API because of the CORS protections.

#### Understanding where the components come from when you run locally

When you run `nx serve Studio-Web`, that process is actually serving all the files needed
by the Studio-Web application, and it's able to import `web-component` and `ngx-web-component`
as it needs them, making them visible to that application as needed.

However, `web-component` requires a build in order to have the .js files generated and available
to serve or import. In the instructions above, we actually show two methods you can use:

 - `nx build web-component --watch` will only build that component, in production mode, and
   rebuild it any time you change that component's source code.

 - `nx serve web-component` goes further, serving that component, which also requires building
   it. It also watches source code for changes.  However, it produces a development build, which
   may be different from the production build.

   In this case, the web-component is being served on port 3333, but the Studio-Web app
   just ignores that and uses the copy provided by `nx serve Studio-Web` instead.

### Testing

#### Web-Component

In three different terminal windows:

Make sure this command is serving the web-component on port 3333:

    nx serve web-component

Make sure this command is serving the test data on port 5000:

    nx serve-test-data web-component

Then run:

    nx cy:run web-component

#### Studio-Web

This command by itself will run the test suite once:

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
