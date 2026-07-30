/**
 * @type {import('nextra-theme-docs').DocsThemeConfig}
 */
import { useRouter } from 'next/router';
import { GithubSponsors } from '@components/github-sponsors';
import dynamic from 'next/dynamic';
const Zoom = dynamic(() => import('react-medium-image-zoom'), {
  ssr: false,
})

const github = 'https://github.com/ismoilovdevml/devops-journey';

const SITE_URL = 'https://devops-journey.uz';
const DEFAULT_LOCALE = 'en-UZ';

// `en-UZ` is a Next.js locale id, not a language: the content behind it is
// Uzbek. Search engines must be told `uz`, otherwise every article is filed as
// English written in Uzbekistan.
const LOCALE_HREFLANG: Record<string, string> = {
  'en-UZ': 'uz',
  en: 'en',
  ru: 'ru',
};

const localePrefix = (locale?: string) =>
  !locale || locale === DEFAULT_LOCALE ? '' : `/${locale}`;

// Mirrors scripts/generate-sitemap.mjs so canonical URLs and sitemap entries
// are byte-identical — a mismatch makes Google pick its own canonical.
const absoluteUrl = (locale: string | undefined, path: string) => {
  const prefix = localePrefix(locale);
  return path ? `${SITE_URL}${prefix}${path}` : `${SITE_URL}${prefix || '/'}`;
};

// Turns the internal route back into the URL a visitor actually sees.
// Nextra's middleware rewrites /guides/x to /guides/x.en-UZ, so asPath carries
// the locale suffix at prerender time — publishing that as canonical would
// point search engines at a URL that only exists internally.
const canonicalPath = (asPath: string) => {
  const path = (asPath.split(/[?#]/)[0] ?? '/')
    .replace(/\.(en-UZ|en|ru)$/, '')
    .replace(/\/index$/, '')
    .replace(/\/$/, '');
  return path === '/' ? '' : path;
};

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  'en-UZ':
    "DevOps bo'yicha bepul ta'lim platformasi bo'lgan DevOps Journey-ga xush kelibsiz",
  en: 'Welcome to DevOps Journey - a free educational platform for DevOps',
  ru: 'Добро пожаловать в DevOps Journey - бесплатная образовательная платформа по DevOps',
};

const TITLE_WITH_TRANSLATIONS = {
  'en-UZ': 'DevOps Journey',
  'en': 'DevOps Journey',
  'ru': 'DevOps Journey',
} as const;

const EDIT_LINK_WITH_TRANSLATIONS = {
  'en-UZ': "GitHub-da o'zgartirish ->",
  'en': 'Edit this page on GitHub ->',
  'ru': 'Редактировать на GitHub ->',
} as const;

import { DocsThemeConfig, useConfig, useTheme } from 'nextra-theme-docs';

const Logo = ({ height, width }: { height: number; width: number }) => {
  const { theme } = useTheme();
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
      <svg
        width={height || 18}
        height={width || 18}
        viewBox="0 0 64 68"
        fill="none"
      >
        <use href="public/logos/logo-dark.svg" />
      </svg>
      <img className='logo-img' src="/hero.png" alt="Hero" height="50" width="50" />
      <span className='logo-text' style={{ fontWeight: 'bold', fontSize: 18 }}>DevOps Journey</span>
    </div>
  );
};

const ArticleFooter = dynamic(() => import("@components/article-footer"), { ssr: false })

const config: DocsThemeConfig = {
  docsRepositoryBase: `${github}/blob/main`,
  chat: {
    link: 'https://discord.gg/rq9rUdnKpm',
  },
  toc: {
    float: true,
  },
  project: {
    link: github,
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'dark',
  },
  primaryHue: {
    dark: 162,
    light: 212,
  },
  footer: {
    text() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { locale } = useRouter();
      const footerTexts: Record<string, string> = {
        'en-UZ': `GPL-3.0 Licensed | Hamma huquqlar himoyalangan ${new Date().getFullYear()} ©Uzbek Developers Consortium.`,
        'en': `GPL-3.0 Licensed | All rights reserved ${new Date().getFullYear()} ©Uzbek Developers Consortium.`,
        'ru': `GPL-3.0 Лицензия | Все права защищены ${new Date().getFullYear()} ©Uzbek Developers Consortium.`,
      };
      return <>{footerTexts[locale as string] || footerTexts['en-UZ']}</>;
    },
  },
  navbar: {
    extraContent: <GithubSponsors />,
  },
  logo() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return (
      <div className="flex items-center gap-2">
        <Logo width={18} height={18} />
      </div>
    );
  },
  useNextSeoProps() {
    // Everything that describes the page for crawlers and social cards lives
    // here. It used to be split between this hook and `head()`, which emitted a
    // second, stale copy of description/og:title on every page.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { frontMatter } = useConfig();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { locale, asPath } = useRouter();

    const description =
      frontMatter?.description ||
      DEFAULT_DESCRIPTIONS[locale as string] ||
      DEFAULT_DESCRIPTIONS[DEFAULT_LOCALE];

    const image = frontMatter?.type
      ? `${SITE_URL}/api/og?title=${frontMatter?.ogImageText}&category=Developing`
      : frontMatter?.image || `${SITE_URL}/banner.png`;

    const path = canonicalPath(asPath);
    const canonical = absoluteUrl(locale, path);

    return {
      titleTemplate: '%s - DevOps Journey',
      description,
      canonical,
      // Placeholder pages carry `untranslated: true`. Indexing 124 near
      // identical "not translated yet" pages would only dilute the real
      // Uzbek article, so they are kept out of the index but stay crawlable
      // so the link to the Uzbek version is still followed.
      ...(frontMatter?.untranslated ? { noindex: true } : {}),
      languageAlternates: Object.entries(LOCALE_HREFLANG).map(
        ([loc, hreflang]) => ({
          hrefLang: hreflang,
          href: absoluteUrl(loc, path),
        })
      ),
      openGraph: {
        type: 'website',
        locale: locale as string,
        url: canonical,
        title: frontMatter?.title
          ? `${frontMatter.title} - DevOps Journey`
          : 'DevOps Journey',
        description,
        images: [{ url: image }],
      },
      twitter: {
        cardType: 'summary_large_image',
      },
    };
  },
  head() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { theme } = useTheme();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { locale } = useRouter();
    const folder = theme === 'light' ? '/light' : '/dark';

    return (
      <>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${folder}/apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${folder}/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${folder}/favicon-16x16.png`}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#00a300" />
        <link rel="manifest" href={`${folder}/site.webmanifest`} />
        <meta
          httpEquiv="Content-Language"
          content={LOCALE_HREFLANG[locale as string] || 'uz'}
        />
        <meta
          name="apple-mobile-web-app-title"
          content="DevOps Journey"
        />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-YNF68V1ND1"
        ></script>
        <script>
          {`
             window.dataLayer = window.dataLayer || [];
             function gtag(){dataLayer.push(arguments);}
             gtag('js', new Date());
 
             gtag('config', 'G-YNF68V1ND1');
           `}
        </script>
      </>
    );
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    titleComponent: ({ title, type }) =>
      type === 'separator' ? (
        <div className="flex items-center gap-2">
          <Logo height={10} width={10} />
          {title}
        </div>
      ) : (
        <>{title}</>
      ),
  },
  editLink: {
    text() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { locale } = useRouter();
      return (
        <>
          {
            EDIT_LINK_WITH_TRANSLATIONS[
            (locale as keyof typeof EDIT_LINK_WITH_TRANSLATIONS) ?? 'en-UZ'
            ]
          }
        </>
      );
    },
  },
  i18n: [
    { locale: 'en-UZ', text: "O'zbek" },
    { locale: 'en', text: 'English' },
    { locale: 'ru', text: 'Русский' },
  ],
  gitTimestamp: ({ timestamp }) => (
    <>Last updated on {timestamp.toLocaleDateString()}</>
  ),
  components: {
    img: props => <Zoom><img {...props} /></Zoom>
  },
  main({ children }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { frontMatter: { showFooter } } = useConfig();

    return <>
      {children}
      {showFooter != false && <ArticleFooter />}
    </>
  }
};

export default config;