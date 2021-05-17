module.exports = {
  images: {
    domains: ['media.dmbk.io'],
  },
  webpack: (config) => {
    config.node = {
      fs: 'empty'
    }
    return config
  }
};
