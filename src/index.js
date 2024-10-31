/*index.js*/
/**
 * Gefið efni fyrir verkefni 9, ekki er krafa að nota nákvæmlega þetta en nota
 * verður gefnar staðsetningar.
 */

import { el, empty } from './lib/elements.js';
import { weatherSearch } from './lib/weather.js';

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  { title: 'Reykjavík', lat: 64.1355, lng: -21.8954 },
  { title: 'Akureyri', lat: 65.6835, lng: -18.0878 },
  { title: 'New York', lat: 40.7128, lng: -74.006 },
  { title: 'Tokyo', lat: 35.6764, lng: 139.65 },
  { title: 'Sydney', lat: 33.8688, lng: 151.2093 },
];

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 */
function renderIntoResultsContent(element) {
  const outputElement = document.querySelector('.output');

  if (!outputElement) {
    console.warn('fann ekki .output');
    return;
  }

  // Passa þetta sé ekki hidden
  outputElement.classList.remove('hidden');
  empty(outputElement);
  outputElement.appendChild(element);
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */
function renderResults(location, results) {
  const header = el(
    'tr',
    {},
    el('th', {}, 'Klukkutími'),
    el('th', {}, 'Hiti (°C)'),
    el('th', {}, 'Úrkoma (mm)')
  );

  const rows = results.map((forecast) =>
    el(
      'tr',
      {},
      el('td', {}, forecast.time.split('T')[1]), // (HH:MM)
      el('td', {}, forecast.temperature.toFixed(1)),
      el('td', {}, forecast.precipitation.toFixed(1))
    )
  );

  const tbody = el('tbody', {}, ...rows);
  const resultsTable = el('table', { class: 'forecast' }, header, tbody);

  renderIntoResultsContent(
    el(
      'section',
      {},
      el('h2', { class: 'results__location' }, location.title),
      el('p', {}, `Spá fyrir daginn á breiddargráðu ${location.lat} og lengdargráðu ${location.lng}.`),
      resultsTable
    )
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  const message = error.message;
  renderIntoResultsContent(el('p', { class: 'error' }, `Villa: ${message}`));
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el('p', { class: 'loading' }, 'Leita...'));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 */
async function onSearch(location) {
  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
  } catch (error) {
    renderError(error);
    return;
  }

  // TODO útfæra
  // Hér ætti að birta og taka tillit til mismunandi staða meðan leitað er.
  //Ef engin gögn finnast/koma til baka
  if (!results || results.length === 0) {
    renderError(new Error('Engin gögn fundust.'));
    return;
  }

  //Sýnir niðurstöður ef allt gekk upp
  renderResults(location, results);
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  // TODO útfæra
  renderLoading();

  if (!navigator.geolocation) {
    renderError(new Error('Geolocation is not supported by your browser.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await onSearch({ title: 'Mín staðsetning', lat: latitude, lng: longitude });
    },
    () => renderError(new Error('Gatt ekki sótt staðsetningu.'))
  );
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
// Notum `el` fallið til að búa til element og spara okkur nokkur skref.
  const locationElement = el(
    'li',
    { class: 'locations__location' },
    el('button', { class: 'locations__button', click: onSearch }, locationTitle)
  );
   /* Til smanburðar við el fallið ef við myndum nota DOM aðgerðir
  const locationElement = document.createElement('li');
  locationElement.classList.add('locations__location');
  const locationButton = document.createElement('button');
  locationButton.appendChild(document.createTextNode(locationTitle));
  locationButton.addEventListener('click', onSearch);
  locationElement.appendChild(locationButton);*/
  

  return locationElement;
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  // Búum til <main> og setjum `weather` class
  const mainElement = document.createElement('main');
  mainElement.classList.add('weather');

  // Búum til <header> með beinum DOM aðgerðum
  const headerElement = document.createElement('header');
  const heading = document.createElement('h1');
  heading.textContent = '🌞 Veðrið 🌧️';
  headerElement.appendChild(heading);
  mainElement.appendChild(headerElement);

  // TODO útfæra inngangstexta
  // Búa til <div class="loctions">
  const introText = document.createElement('p');
  introText.textContent = 'Veldu stað til að sjá hita- og úrkomuspá.';
  mainElement.appendChild(introText);
  const locationHeader = document.createElement('h3');
  locationHeader.textContent = 'Staðsetningar';
  mainElement.appendChild(locationHeader);
  const locationsContainer = document.createElement('div');
  locationsContainer.classList.add('locations');

  // Búa til <ul class="locations__list">
  const locationsListElement = document.createElement('ul');
  locationsListElement.classList.add('locations__list');
  
  // <div class="loctions"><ul class="locations__list"></ul></div>
  //bæta við mín staðsetning
  const userLocationButton = renderLocationButton('Mín staðsetning (þarf leyfi)', onSearchMyLocation);
  locationsListElement.appendChild(userLocationButton);

  // <div class="loctions"><ul class="locations__list"><li><li><li></ul></div>
  locations.forEach((location) => {
  const locationButton = renderLocationButton(location.title, () => onSearch(location));
  locationsListElement.appendChild(locationButton);
  });

  locationsContainer.appendChild(locationsListElement);
  mainElement.appendChild(locationsContainer);

  const resultsHeader = document.createElement('h3');
  resultsHeader.textContent = 'Niðurstöður';
  resultsHeader.classList.add('results__header');
  mainElement.appendChild(resultsHeader);
  
  // Outputtið fyrir niðurstöður, fyrst er það hidden
  const outputElement = document.createElement('div');
  outputElement.classList.add('output', 'hidden');
  mainElement.appendChild(outputElement);
  
  // Setja allt í main container
  container.appendChild(mainElement);
}
// Þetta fall býr til grunnviðmót og setur það í `document.body`
document.addEventListener('DOMContentLoaded', () => {
render(document.body, locations, onSearch, onSearchMyLocation);
});