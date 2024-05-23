import { Config } from "@stencil/core";
import { sass } from "@stencil/sass";

const angularValueAccessorBindings: ValueAccessorConfig[] = [];

import {
  angularOutputTarget,
  ValueAccessorConfig,
} from "@stencil/angular-output-target";

export const config: Config = {
  namespace: "web-component",
  taskQueue: "async",
  sourceMap: true,

  extras: {
    experimentalImportInjection: true,
  },
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    {
      type: "dist-custom-elements",
      generateTypeDeclarations: true,
    },
    { type: "docs-readme" },
    {
      type: "www",
      serviceWorker: null, // disable service workers
      copy: [
        { src: "scss/fonts", dest: "build/assets/fonts" },
        // Hacky, I know, but we really need the readme to be in the root dist folder and I didn't figure how else to do that.
        { src: "../readme.md", dest: "../readme.md" },
      ],
    },

    angularOutputTarget({
      componentCorePackage: "@readalongs/web-component",
      directivesProxyFile:
        "../../../packages/ngx-web-component/src/generated/directives/proxies.ts",
      directivesArrayFile:
        "../../../packages/ngx-web-component/src/generated/directives/index.ts",
      valueAccessorConfigs: angularValueAccessorBindings,
    }),
  ],
  plugins: [sass()],
  devServer: {
    ...devServerOverrides(),
  },
};

function devServerOverrides() {
  if (Boolean(process.env.RUNNING_INTEGRATION_TESTS)) {
    // See https://stenciljs.com/docs/dev-server
    return {
      // Cypress will open its own browser
      openBrowser: false,
      // Have the tests explicitly reload functionality rather than using
      // hot-module replacement.
      reloadStrategy: null,
      // Handy to have this log in the test output.
      logRequests: true,
    };
  }

  // Not running tests -- do not override anything:
  return {};
}
