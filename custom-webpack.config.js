const webpack = require("webpack");

module.exports = {
  // Eliminate emscripten's node junk when using webpack
  resolve: {
    fallback: {
      crypto: false,
      fs: false,
      path: false,
    },
  },
  // ARGH! More node junk! WTF!
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
};
