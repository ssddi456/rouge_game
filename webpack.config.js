var path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function ({ entry }) {
    const entrys = (entry || {}).editor
        ? {
              editor: "./src/editor.ts",
          }
        : {
              main: "./src/main.ts",
          };

    /** @type {import("webpack").Configuration} */
    return {
        mode: "development",
        entry: entrys,
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
                    test: /\.tsx?$/,
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
                template: "./src/template/index.html",
            }),
        ],
    };
};
