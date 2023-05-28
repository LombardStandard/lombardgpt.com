var d = new Date();
var n = d.getFullYear();
document.getElementById('date').innerHTML = n;

// i18n integration
function updateContent() {
  const i18nElements = document.getElementsByClassName('i18nelement');

  for (const i18nElement of i18nElements) {
    const key = i18nElement.getAttribute('data-i18n');
    i18nElement.innerHTML = i18next.t(key) || i18nElement.innerHTML;
  }
}

function updateIframes() {
  const iFrameSub = document.getElementById('iframe-sub');
  const iFrameLead = document.getElementById('iframe-lead');
  const lang = i18next.language.includes('en') ? 'en' : i18next.language;

  if (iFrameSub && iFrameLead) {
    iFrameSub.src = `https://alpha.lombardstandard.com/subscribeForm/?lang=${lang}`;
    iFrameLead.src = `https://alpha.lombardstandard.com/search_leads_widget/?lang=${lang}`;
  }
}

async function i18Loader() {
  const langs = ['en', 'ja', 'de'];
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
  });

  updateContent();
  updateIframes();

  i18next.on('languageChanged', () => {
    updateContent();
    updateIframes();
  });

  const langSelector = document.getElementById('langSelector');
  langSelector.removeAttribute('disabled');
  langSelector.addEventListener('change', (e) => {
    i18next.changeLanguage(e.target.value);
  });
  langSelector.value = i18next.language.includes('en')
    ? 'en'
    : i18next.language;

  let closeText = 'OK';
  let message = 'By viewing this website you agree to our';
  let link = 'Privacy Policy';

  switch (i18next.language) {
    case 'ja':
      closeText = 'OK';
      message = 'このウェブサイトを閲覧することにより、あなたは私たちの';
      link = 'プライバシーポリシー。';
      break;
    case 'de':
      closeText = 'OK';
      message = 'Durch das Betrachten dieser Website stimmen Sie unseren zu';
      link = 'Datenschutz-Bestimmungen';
      break;
  }

  const cookieScript = document.createElement('script');
  cookieScript.src = 'https://cookieinfoscript.com/js/cookieinfo.min.js';
  cookieScript.id = 'cookieinfo';
  cookieScript.setAttribute('data-close-text', closeText);
  cookieScript.setAttribute('data-font-size', '14px');
  cookieScript.setAttribute('data-message', message);
  cookieScript.setAttribute('data-link', '#111827');
  cookieScript.setAttribute('data-linkmsg', `<b>${link}</b>`);
  cookieScript.setAttribute(
    'data-moreinfo',
    'https://lombardstandard.com/privacy-policy'
  );
  cookieScript.setAttribute('data-text-align', 'left');
  cookieScript.setAttribute('data-bg', '#FDE68A');
  cookieScript.setAttribute('data-cookie', 'Lombard Standard Analytics');

  document.body.appendChild(cookieScript);
}

i18Loader();

