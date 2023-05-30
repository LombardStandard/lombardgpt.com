var d = new Date();
var n = d.getFullYear();
document.getElementById('date').innerHTML = n;

const detectionOptions = {
  // order and from where user language should be detected
  order: [
    'querystring',
    'cookie',
    'localStorage',
    'navigator',
    'sessionStorage',
    'htmlTag',
    'path',
    'subdomain',
  ],

  // keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  lookupSessionStorage: 'i18nextLng',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,

  // cache user language on
  caches: ['cookie', 'localStorage'],
  excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

  // optional expire and domain for set cookie
  // cookieMinutes: 60,
  cookieDomain: 'lombardgpt.com',

  // optional htmlTag with lang attribute, the default is:
  htmlTag: document.documentElement,

  // optional set cookie options, reference:[MDN Set-Cookie docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
  cookieOptions: { path: '/', sameSite: 'strict' },
};

// i18n integration
function updateContent() {
  const i18nElements = document.getElementsByClassName('i18nelement');

  for (const i18nElement of i18nElements) {
    const key = i18nElement.getAttribute('data-i18n');
    i18nElement.innerHTML = i18next.t(key) || i18nElement.innerHTML;
  }
}

async function i18Loader() {
  const langs = ['en', 'ja'];
  const langJsons = await Promise.all(
    langs.map((lang) => fetch(`i18n/${lang}.json`).then((res) => res.json()))
  );

  const resources = langs.reduce((acc, lang, idx) => {
    acc[lang] = { translation: langJsons[idx] };
    return acc;
  }, {});

  await i18next.use(i18nextBrowserLanguageDetector).init({
    fallbackLng: 'en',
    debug: false,
    resources,
    detection: detectionOptions,
  });

  updateContent();

  i18next.on('languageChanged', () => {
    updateContent();
  });

  const langSelector = document.getElementById('langSelector');
  langSelector.removeAttribute('disabled');
  langSelector.addEventListener('change', (e) => {
    i18next.changeLanguage(e.target.value);
  });
  langSelector.value = i18next.language.includes('en')
    ? 'en'
    : i18next.language;
}

i18Loader();
