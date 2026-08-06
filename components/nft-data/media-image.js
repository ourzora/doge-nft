import { useMediaContext } from '@zoralabs/nft-components/dist/context/useMediaContext'

/**
 * Renders the committed artwork, in place of the library's MediaObject pipeline.
 *
 * MediaObject picks a renderer by content type, then hands off to MediaLoader, which
 * starts at `loading: true` and only reveals the image when its `onLoad` fires —
 * `getStyles('mediaObject', …, { mediaLoaded })` sets opacity 0 until then.
 *
 * That does not survive server rendering. The <img> is in the HTML from the start, so
 * a small same-origin file served off disk finishes loading before React hydrates and
 * attaches the handler. The event is missed, `loading` stays true forever, and the
 * page shows "Loading..." over an image that is demonstrably decoded and ready
 * (img.complete === true, naturalWidth === 640, opacity: 0). The old site never hit
 * this because the image was fetched client-side from imgix, well after hydration.
 *
 * Since the archive serves one known local PNG per token, the whole renderer
 * selection and load-tracking apparatus buys nothing here. Emitting the img directly
 * with mediaLoaded: true keeps the `.zora-mediaObject` class names the stylesheets
 * target, and drops the last call to useNFTContent along with it.
 */
const MediaImage = ({ token, isFullPage = false, a11yIdPrefix }) => {
  const { getStyles } = useMediaContext()
  const { media, metadata } = token

  return (
    <img
      aria-describedby={a11yIdPrefix ? `${a11yIdPrefix}description` : undefined}
      alt={metadata.name || metadata.description}
      src={media.imageSrc}
      /**
       * Deliberately no width/height attributes. They would be a reasonable
       * anti-layout-shift measure on a normal page, but here they act as CSS
       * presentational hints and pin the image to its intrinsic 640px inside a
       * wrapper that `_doge-nft.scss` sizes with `height: 100%`. That is narrower
       * than the geometry the library's own <img> produces, and matching the
       * original layout is the whole reason for keeping these class names.
       */
      {...getStyles('mediaObject', undefined, { mediaLoaded: true, isFullPage })}
    />
  )
}

export default MediaImage
