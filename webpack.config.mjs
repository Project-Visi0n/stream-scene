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
      filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      publicPath: '/',
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        maxSize: 200000, // 200KB max - very aggressive
        minSize: 0,
        maxAsyncRequests: 30, // Allow many chunks
        maxInitialRequests: 30,
        cacheGroups: {
          default: false,
          defaultVendors: false, // Disable all defaults
          react: {
            test: /[\\/]node_modules[\\/]react[\\/]/,
            name: 'react-core',
            chunks: 'all',
            maxSize: 100000, // 100KB for React core
            priority: 30,
          },
          reactDom: {
            test: /[\\/]node_modules[\\/]react-dom[\\/]/,
            name: 'react-dom',
            chunks: 'all',
            maxSize: 200000, // Split React DOM aggressively
            priority: 25,
          },
          vendor: {
            test: /[\\/]node_modules[\\/](?!(tesseract\.js|tesseract\.js-core|fluent-ffmpeg|react|react-dom)[\\/])/,
            name: 'vendor',
            chunks: 'all',
            maxSize: 200000,
            priority: 10,
          },
          app: {
            test: /[\\/]client[\\/]/,
            name: 'app',
            chunks: 'all',
            maxSize: 200000,
            priority: 5,
          },
        },
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        "process": false,
        "buffer": false,
      },
      // Temporarily exclude problematic libraries
      alias: {
        'tesseract.js': false,
        'fluent-ffmpeg': false,
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
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
      new Dotenv({
        systemvars: true,
        safe: false,
        allowEmptyValues: true,
        defaults: false,
      }),
    ],
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
    
    // Bundle analysis (uncomment when needed)
    // stats: {
    //   all: false,
    //   modules: true,
    //   chunks: true,
    //   assets: true,
    //   reasons: true,
    //   moduleTrace: true,
    // },
  };
};