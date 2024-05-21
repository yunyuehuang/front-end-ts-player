const path = require('path');
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: "eval-source-map",
  plugins: [
    new HtmlWebpackPlugin({
      title: 'gg',
      filename: 'index.html', //输出文件
      template: 'public/index.html'
    }),
    new VueLoaderPlugin()
  ],
  devServer: {
    contentBase: './dist'
  },
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          'style-loader',
          'css-loader',
          'less-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader'
      },
      {
        test: /\.js$/,
        use: {
          loader:'babel-loader',
          options:{
            // "presets": [["es2015", { "modules": false }]],
            "plugins": [
              [
                "component",
                {
                  "libraryName": "element-ui",
                  "styleLibraryName": "theme-chalk"
                }
              ]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, 'src')
    }
  }
};

