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
      title: 'Output Management',
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
        test: /\.scss$/,
        use: ['style-loader','css-loader','sass-loader'],
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
      }
    ]
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, 'src')
    }
  }
};

