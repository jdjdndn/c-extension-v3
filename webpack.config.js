const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const autoprefixer = require("autoprefixer");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    options: path.join(__dirname, "src", "pages", "options", "options.js"),
    popup: path.join(__dirname, "src", "pages", "popup", "popup.js"),
    devtools: path.join(__dirname, "src", "pages", "devtools", "devtools.js"),
    newtab: path.join(__dirname, "src", "pages", "newtab", "newtab.js"),
    "service-worker": path.join(
      __dirname,
      "src",
      "background",
      "background.js"
    ),
    // Content Scripts
    contentScript: path.join(__dirname, "src", "contents", "index.js"),
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    // chunkFilename: "[name].js",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.s?css$/,
        use: [
          "style-loader",
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [autoprefixer()],
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2)(\?\S*)?$/,
        loader: "file-loader",
      },
      {
        test: /\.(png|jpe?g|gif|webm|mp4|svg)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
          outputPath: "assets/img",
          esModule: false,
        },
      },
    ],
  },
  resolve: {
    alias: {
      vue$: "vue/dist/vue.runtime.esm.js",
    },
    extensions: ["*", ".js", ".vue", ".json"],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    // Clean the Build Folder
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: true,
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
      chunkFilename: "[name].css",
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(
        __dirname,
        "src",
        "pages",
        "options",
        "options.html"
      ),
      filename: "options.html",
      chunks: ["options"],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "pages", "popup", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(
        __dirname,
        "src",
        "pages",
        "newtab",
        "newtab.html"
      ),
      filename: "newtab.html",
      chunks: ["newtab"],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(
        __dirname,
        "src",
        "pages",
        "devtools",
        "devtools.html"
      ),
      filename: "devtools.html",
      chunks: ["devtools"],
      cache: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src", "manifest.json"),
          to: path.resolve(__dirname, "dist"),
          force: true,
          transform: function(content, path) {
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
        {
          from: "src/icons",
          to: "icons",
          force: true,
        },
        {
          from: "src/rules",
          to: "rules",
          force: true,
        },
        {
          from: "src/modules/error-record.js",
          to: "js",
          force: true,
        },
        {
          from: "src/modules/ajaxHook.js",
          to: "js",
          force: true,
        },
        {
          from: "src/modules/googleTranslate.js",
          to: "js",
          force: true,
        },
        {
          from: "src/modules/setTranslate.js",
          to: "js",
          force: true,
        },
         {
          from: "src/modules/gugefanyijs.js",
          to: "js",
          force: true,
        }
      ],
    }),
  ],
  infrastructureLogging: {
    level: "info",
  },
  devServer: {
    compress: true,
    // port: 3000,
    proxy: {
      "/sockjs-node": "http://localhost:4444",
    },
  },
};

if (process.env.NODE_ENV === "development") {
  options.devtool = "cheap-module-source-map";
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
