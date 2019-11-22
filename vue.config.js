module.exports = {
    devServer: {
        open: true
    },
    publicPath: process.env.NODE_ENV === 'production'
        ? '/goising/'
        : '/'
}
