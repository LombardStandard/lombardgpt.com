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
async function i18Loader() {
   const langs = ['en', 'ja'];
   const langJsons = await Promise.all(
      langs.map((lang) => fetch(`i18n/${lang}.json`).then((res) => res.json()))
   );

   await i18next.use(i18nextBrowserLanguageDetector).init({
      fallbackLng: 'en',
      debug: false,
      resources,
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
   langSelector.value = i18next.language.includes('en') ?
      'en' :
      i18next.language;
}

i18Loader();
