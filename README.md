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

First, make sure Lerna is installed:

    npm install -g nx

Then,

    npm install --force

### Building

The TypeScript code must be compiled:

    nx build web-component --watch

You need to run `nx build web-component` if you want to try out the angular-demo because running nx build web-component will build the angular wrapper into the generated folder in the ngx-web-component wrapper library. The watch flag will auto-build the stencil component and angular wrapper if you change web-component source.

If you want to try out the angular app demo to see an example of how to integrate readalongs into your Angular project, run `nx serve angular-demo`. Otherwise run `nx serve Studio-Web` to see the 


License
-------

2023 © National Research Council of Canada. MIT Licensed. See LICENSE for details.
