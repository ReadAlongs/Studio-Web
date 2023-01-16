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

This repo is managed using [Lerna] and [Nx]. We use Lerna to manage multiple,
interdependent packages. The biggest change between using Lerna and
using npm is **you can no longer run `npm install` within packages**.
Instead, always run `npx lerna bootstrap` from the root directory of the
repository.

[Lerna]: https://lerna.js.org/

### Installing dependencies

First, make sure Lerna is installed:

    npm install

Then,

    npx lerna bootstrap

### Building

The TypeScript code must be compiled:

    npx lerna run build

### Testing

    npx lerna run test

### Updating dependencies

    npx lerna bootstrap

### Adding new dependencies

    npx lerna add <package> path/to/subpackage

License
-------

2022 © National Research Council of Canada. MIT Licensed. See LICENSE for details.
