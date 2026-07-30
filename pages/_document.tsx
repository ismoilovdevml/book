import { SkipNavLink } from '@reach/skip-nav';
import {
  Head,
  Html,
  Main,
  default as NextDocument,
  NextScript,
} from 'next/document';
import * as React from 'react';

// The `en-UZ` locale serves Uzbek content, so the document language must say
// `uz` — screen readers and search engines both read this attribute.
const HTML_LANG: Record<string, string> = {
  'en-UZ': 'uz',
  en: 'en',
  ru: 'ru',
};

class Document extends NextDocument {
  render() {
    return (
      <Html lang={HTML_LANG[this.props.locale as string] || 'uz'}>
        <Head>
          <style id="stitches" />
          {/* Global Site Tag (gtag.js) - Google Analytics */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `,
            }}
          />
        </Head>
        <body>
          <SkipNavLink />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
