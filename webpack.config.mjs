import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './client/index.tsx',
    mode: argv.mode || 'development',
    target: 'web',
    output: {
      path: path.resolve('./public'),
      filename: 'bundle.js',
      publicPath: '/',
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      splitChunks: false, // Disable code splitting to reduce memory usage
    },
    performance: {
      hints: false, // Disable performance warnings
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        "process": false,
        "buffer": false,
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Faster compilation, skip type checking
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    ...(isProduction ? {} : {
      devServer: {
        port: 8000,
        host: '0.0.0.0',
        hot: true,
        historyApiFallback: true,
        allowedHosts: 'all',
      },
    }),
    plugins: [
      new HtmlWebpackPlugin({
        template: './client/index.html',
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer'],
      }),
      new Dotenv(),
    ],
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
  };
};
