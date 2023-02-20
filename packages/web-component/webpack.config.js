const path = require("path");
const stencil = require("@stencil/webpack");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

let distBundle = {
  entry: "../../dist/packages/web-component/dist/esm/web-component.js",
  output: {
    filename: "bundle.js",
    path: path.resolve("../../dist/packages/web-component/dist"),
    publicPath: "",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};

let assetBundle = {
  entry: "../../dist/packages/web-component/dist/esm/web-component.js",
  output: {
    filename: "bundle.js",
    path: path.resolve("../studio-web/src/assets"),
    publicPath: "",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};

module.exports = [distBundle, assetBundle];
