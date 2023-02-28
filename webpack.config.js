var path = require('path');

module.exports = function (env) {
    return [{
        target: 'node',
        experiments: {
            topLevelAwait: true
        },
        entry: {
            index: [
                path.resolve(__dirname, 'src/server.js')
            ]
        },
        module: {
            rules: [{
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                resolve: {
                    fullySpecified: false,
                },
            }]
        },
        devtool: 'source-map'
    },

    ]
}