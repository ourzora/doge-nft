import NextHead from 'next/head';
import { number, string } from 'prop-types';

import { DEFAULT_DESCRIPTION, SITE_URL } from '../lib/constants'

const defaultDescription = DEFAULT_DESCRIPTION;
const defaultKeywords = 'Doge';
const defaultOGURL = `${SITE_URL}/`;
const defaultOGImage = `${SITE_URL}/doge-og-image.png`;
// The site-wide card. Token pages pass their own, which is 640x480.
const defaultOGImageSize = { width: 1200, height: 630 };

const Head = (props) => (
  <NextHead>
    <meta charSet="UTF-8" />
    <title>{`${props.title} | Doge` || ''}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={props.description || defaultDescription} />
    <meta name="keywords" content={props.keywords || defaultKeywords} />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png"/>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
    <link rel="shortcut icon" href="/favicons/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
    <meta property="og:url" content={props.url || defaultOGURL} />
    <meta property="og:title" content={props.title || ''} />
    <meta property="og:description" content={props.description || defaultDescription} />
    <meta name="twitter:site" content={props.url || defaultOGURL} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={props.ogImage || defaultOGImage} />
    <meta property="og:image" content={props.ogImage || defaultOGImage} />
    {/*
      These have to describe the image actually being served. They were hardcoded to
      1200x630 while token pages advertised a 640x480 PNG, which is wrong for every
      crawler that trusts them. Twitter's summary_large_image accepts anything above
      300x157 and crops, so the real dimensions are fine.
    */}
    <meta
      property="og:image:width"
      content={String(props.ogImageWidth || defaultOGImageSize.width)}
    />
    <meta
      property="og:image:height"
      content={String(props.ogImageHeight || defaultOGImageSize.height)}
    />
  </NextHead>
);

Head.propTypes = {
  title: string,
  description: string,
  keywords: string,
  url: string,
  ogImage: string,
  ogImageWidth: number,
  ogImageHeight: number
};

export default Head;
