ReadAlong Web Component
=======================

Interactive story telling embeddable into any website!

<!-- TODO: put an animated GIF here, showing it off! -->

This mono repo combines two components:

 - A [stencil web component](packages/stencil-component/) for visualizing read alongs,
 - An [angular web component](packages/angular-workspace/) currently in development for editing them.

For maintainers
---------------

This repo is managed using [Lerna]. We use Lerna to manage multiple,
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
