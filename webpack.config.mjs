import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './client/index.tsx',
  output: {
    path: path.resolve('./public'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      'process/browser': 'process/browser.js',
    },
    fallback: {
      "process": "process/browser.js",
      "buffer": "buffer",
      "stream": "stream-browserify",
      "util": "util",
      "crypto": "crypto-browserify",
      "vm": "vm-browserify",
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  devServer: {
    port: 8000,
    hot: true,
    open: true,
    historyApiFallback: true, 
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './client/index.html',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    // Environment variables are now injected by dotenv-webpack only
    new Dotenv(),
  ],
  mode: 'development',
};
