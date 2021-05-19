module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-custom-media': {
      importFrom: [
        () => {
          const { screens } = require('./globals.json')
          const customMedia = {}
          for (let size in screens) {
            customMedia[`--${size}`] = `(min-width: ${screens[size]}px)`
          }
          customMedia[`--portrait`] = `(max-width: ${screens.lg - 1}px)`
          customMedia[`--hover`] = `(hover:hover)`
          return { customMedia }
        }
      ]
    }
  }
}