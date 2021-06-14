"use strict";

const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const mode = process.env.NODE_ENV || "development";

module.exports = {
  mode,
  entry: {
    popup: "./src/popup/index",
  },
  output: {
    path: path.resolve(__dirname, "dist/"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "static", to: "." }],
    }),
  ],
  devtool: "inline-source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
