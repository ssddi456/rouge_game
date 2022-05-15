var path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

/** @type {import("webpack").Configuration} */
module.exports = {
    mode: "development",
    entry: {
        main: "./src/main.ts",
    },
    output: {
        // publicPath: './dist'
        path: path.join(__dirname, "/dist"),
        
    },
    
    devServer: {
        host: "0.0.0.0",
        port: "7000",
        open: true,
        
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "swc-loader",
                    options: {
                        // This makes swc-loader invoke swc synchronously.
                        sync: true,
                        jsc: {
                            parser: {
                                syntax: "typescript",
                            },
                        },
                    },
                },
                test: /\.tsx$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "swc-loader",
                    options: {
                        // This makes swc-loader invoke swc synchronously.
                        sync: true,
                        jsx: true,
                        jsc: {
                            parser: {
                                syntax: "typescript",
                            },
                        },
                    },
                },
            },
            {
                test: /\.(png|jpg|jpeg)$/i,
                use: [
                    // compiles Less to CSS
                    "file-loader"
                ],
            },
            {
                test: /\.less$/i,
                use: [
                    // compiles Less to CSS
                    "style-loader",
                    "css-loader",
                    "less-loader",
                ],
            },
        ],
    },
    plugins: [new HtmlWebpackPlugin()],

};
