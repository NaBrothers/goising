module.exports = {
    devServer: {
        open: true
    }
}
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/goising/'
    : '/'
}