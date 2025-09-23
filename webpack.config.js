const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      popup: './ui/popup.tsx',
      options: './ui/options.tsx',
      background: './background/service-worker.ts',
      'cv-worker': './core/cv-worker/worker.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
      strictModuleExceptionHandling: false
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][ext]'
          }
        },
        {
          test: /\.wasm$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/wasm/[name][ext]'
          }
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new HtmlWebpackPlugin({
        template: './ui/popup.html',
        filename: 'popup.html',
        chunks: ['popup']
      }),
      new HtmlWebpackPlugin({
        template: './ui/options.html',
        filename: 'options.html',
        chunks: ['options']
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json'
          },
          {
            from: 'offscreen.html',
            to: 'offscreen.html'
          },
          {
            from: 'offscreen.js',
            to: 'offscreen.js'
          },
          {
            from: 'ui/assets',
            to: 'assets',
            noErrorOnMissing: true
          },
          {
            from: path.resolve(__dirname, 'assets/wasm'),
            to: 'assets/wasm',
            noErrorOnMissing: true
          },
          {
            from: path.resolve(__dirname, 'assets/mediapipe-worker-loader.js'),
            to: 'assets/mediapipe-worker-loader.js'
          },
          {
            from: path.resolve(__dirname, 'assets/vision_bundle.js'),
            to: 'assets/vision_bundle.js'
          }
        ]
      })
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@extension': path.resolve(__dirname, 'extension'),
        '@core': path.resolve(__dirname, 'core'),
        '@ui': path.resolve(__dirname, 'ui')
      }
    },
    devtool: isProduction ? false : 'cheap-module-source-map',
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\/]node_modules[\\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      },
      minimize: isProduction,
      usedExports: false
    }
  };
};