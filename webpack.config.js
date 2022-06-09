var path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = function ({ entry }) {
    const entrys = ((entry || 'main') == 'editor')
        ? {
            editor: "./src/editor.tsx",
        }
        : {
            main: "./src/main.ts",
        };
    const server = ((entry || 'main') == 'editor')
        ? {
            port: 7001
        }
        : {
            port: 7000
        };
    const isEditor = entrys && entrys.editor;
    const shouldRefreshReact = isEditor && isDevelopment;
    console.log('entrys', entrys, 'isDevelopment', isDevelopment, 'shouldRefreshReact', shouldRefreshReact);
    /** @type {import("webpack").Configuration} */
    return {
        mode: isDevelopment ? 'development' : 'production',
        entry: entrys,
        output: {
            // publicPath: './dist'
            path: path.join(__dirname, "/dist"),
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
        },

        devServer: {
            ...server,
            host: "0.0.0.0",
            open: {
                target: 'http://localhost:7000',
                app: {
                    name: 'google chrome',
                }
            },
            hot: true,
        },

        devtool: isDevelopment ? 'source-map' : false,

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: "swc-loader",
                        options: {
                            jsc: {
                                transform: {
                                    react: {
                                        development: shouldRefreshReact,
                                        refresh: shouldRefreshReact,
                                    },
                                },
                            },
                        },
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
            shouldRefreshReact && new ReactRefreshWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: "./src/template/index.html",
            }),
        ].filter(Boolean),
    };
};
