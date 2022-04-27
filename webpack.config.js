const path = require('path');
const stencil = require('@stencil/webpack')
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    entry: './dist/esm/read-along.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve('./dist'),
        publicPath: ''
    },
    mode: "production",
    module: {
        rules: [{
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
        }, ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({ extractComments: false })]
    },
    plugins: [new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
    })]
};