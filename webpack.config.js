var path = require("path");
var VisibleEditorTransformer = require('./build_tools/visible_editor').VisibleEditorTransformer;
var bodyParser = require('body-parser');

const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';
const ports = {
    main: 7000,
    editor: 7001,
    demos: 7002,
};
const entryName = {
    main: 'main.ts',
    editor: 'editor.tsx',
    demos: 'demos.ts',
};
module.exports = function ({ entry }) {
    entry = entry || 'main';
    const entrys = {
        [entry]: `./src/${entryName[entry]}`,
    };
    const server = {
            port: ports[entry]
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
        /** @type {import("webpack-dev-server").Configuration} */
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
            setupMiddlewares(middlewares, devServer) {
                devServer.app.post('/__update_file', 
                    bodyParser.json(),
                    require('./build_tools/replace_content_middleware'));
                return middlewares;
            }
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
                            sync: true,
                            jsc: {
                                "parser": {
                                    "syntax": "typescript",
                                    "tsx": true,
                                    "decorators": false,
                                    "dynamicImport": false
                                },
                                transform: {
                                    react: {
                                        development: shouldRefreshReact,
                                        refresh: shouldRefreshReact,
                                    },
                                },
                            },
                            plugin: (m, loader) => new VisibleEditorTransformer({
                                fileName: loader.resourcePath
                            }).visitProgram(m),
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
