var path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function ({ entry }) {
    /** @type {import("webpack").Configuration} */
    return {
        mode: "development",
        entry: {
            main: "./src/main.ts",
            editor: "./src/editor.tsx",
        },
        output: {
            // publicPath: './dist'
            path: path.join(__dirname, "/dist"),
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
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
                    },
                },
                {
                    test: /\.tsx$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: "swc-loader",
                    },
                },
                {
                    test: /\.(png|jpg|jpeg)$/i,
                    use: [
                        // compiles Less to CSS
                        "file-loader",
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
                {
                    test: /\.css$/i,
                    use: [
                        // compiles Less to CSS
                        "style-loader",
                        "css-loader",
                    ],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                chunks: [entry || "main"],
                template: "./src/template/index.html",
            }),
        ],
    };
};
