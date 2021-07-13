import { Config } from "@stencil/core";
import { sass } from "@stencil/sass";

export const config: Config = {
  namespace: "read-along",
  outputTargets: [
    { type: "dist" },
    { type: "docs-readme" },
    {
      type: "www",
      serviceWorker: null, // disable service workers
    },
  ],
  plugins: [sass()],
  devServer: {
    ...devServerOverrides(),
  },
};

function devServerOverrides() {
  if (Boolean(process.env.RUNNING_INTEGRATION_TESTS)) {
    return {
      // Cypress will open its own browser
      openBrowser: false,
      // Have the tests explicitly reload functionality rather than using
      // hot-module replacement.
      reloadStrategy: null,
    };
  }

  // Not running tests -- do not override anything:
  return {};
}
