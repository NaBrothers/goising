module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/goising/'
    : '/'
}

module.exports = {
    devServer: {
        open: true
    }
}
