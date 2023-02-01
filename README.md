ReadAlongs Web Component
=======================

Interactive story telling embeddable into any website!

<!-- TODO: put an animated GIF here, showing it off! -->

This mono repo combines ****** components:

 - A [stencil web component](packages/web-component/) for visualizing read alongs,
 - An [Angular Library](packages/ngx-web-component/) that wraps the stencil web component,
 - A [demo web application](packages/angular-demo/) to show how to use the angular library in an Angular web application.

For maintainers
---------------

This repo is managed using [Nx]. The biggest change between using Nx and
using npm is **you can no longer run `npm install` within packages**.
Instead, always run `npm install` from the root directory of the
repository.

[Nx]: https://nx.dev/

### Cloning

First clone this branch:

    git clone git@github.com:ReadAlongs/Web-Component.git -b dev.monorepo

Then clone the submodule:

    cd Web-Component && git submodule update --init 

### Installing dependencies

First, make sure Nx is installed:

    npm install -g nx

Then,

    npm install

### Building

The TypeScript code must be compiled:

    nx build web-component --watch

You need to run `nx build web-component` if you want to try out the
angular-demo because running `nx build web-component` will build the
angular wrapper into the `generated` folder in the `ngx-web-component`
wrapper library. The watch flag will auto-build the stencil component
and angular wrapper if you change web-component source.

If you want to test the web component on its own, you will need to
start the test data server with:

    nx serve-test-data web-component

Then you can start the web component's example code in a different
shell with:

    nx serve web-component
    
Note that this will probably fail, because of CORS, since
localhost:5000 and localhost:3337 are different "origins".  Currently
you'll have to download and activate an extension for your browser
(such as the "Allow CORS" extension for Chrome) to get around this
problem.

If you want to try out the angular app demo to see an example of how
to integrate readalongs into your Angular project, run `nx serve
angular-demo`. Note that you will have a broken image icon unless you
are running `nx serve-test-data web-component`.

Finally, you can run `nx serve Studio-Web` to see the full
application, which does not require any extra servers.


License
-------

2023 © National Research Council of Canada. MIT Licensed. See LICENSE for details.
