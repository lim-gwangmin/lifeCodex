const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './firebase-messaging-sw.js',
  output: {
    filename: 'firebase-messaging-sw.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new Dotenv(),
  ],
};
