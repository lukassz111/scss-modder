const path = require('path');

module.exports = {
  target: 'node',
  entry: {
    main: './src/main.ts',
    test: './src/runtests.ts'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [ 'style-loader','css-loader'],
        
      }, 
      {
        test: /\.scss$/i,
        use: [ 'style-loader','css-loader','sass-loader'],
      }, 
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};