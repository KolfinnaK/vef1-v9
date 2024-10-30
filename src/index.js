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

  // Remove the hidden class to make sure it’s visible
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
  // Create table header
  const header = el(
    'tr',
    {},
    el('th', {}, 'Klukkutími'),
    el('th', {}, 'Hiti (°C)'),
    el('th', {}, 'Úrkoma (mm)')
  );

  // Create table rows based on forecast data
  const rows = results.map((forecast) =>
    el(
      'tr',
      {},
      el('td', {}, forecast.time.split('T')[1]), // Display only the time (HH:MM)
      el('td', {}, forecast.temperature.toFixed(1)), // Temperature with one decimal place
      el('td', {}, forecast.precipitation.toFixed(1)) // Precipitation with one decimal place
    )
  );

  // Construct the table with header and rows
  const tbody = el('tbody', {}, ...rows);
  const resultsTable = el('table', { class: 'forecast' }, header, tbody);

  // Display the location title and coordinates above the table
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

  if (!results || results.length === 0) {
    renderError(new Error('No data available for this location.'));
    return;
  }

  renderResults(location, results);
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
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
  return el(
    'li',
    { class: 'locations__location' },
    el('button', { class: 'locations__button', click: onSearch }, locationTitle)
  );
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  const mainContainer = el('main', { class: 'weather' });

  // Title
  const title = el('h1', {}, '🌞 Veðrið 🌧️');
  const introText = el('p', {}, 'Veldu stað til að sjá hita- og úrkomuspá.');
  mainContainer.appendChild(title);
  mainContainer.appendChild(introText);

  // Location header
  const locationHeader = el('h3', {}, 'Staðsetningar');
  mainContainer.appendChild(locationHeader);

  // Location buttons list
  const locationsList = el('ul', { class: 'locations__list' });

  // "Mín staðsetning" button as the first item in the list
  const userLocationButton = el(
    'li',
    { class: 'locations__location' },
    el('button', { class: 'locations__button', click: onSearchMyLocation }, 'Mín staðsetning (þarf leyfi)')
  );
  locationsList.appendChild(userLocationButton);

  // Other location buttons
  locations.forEach((location) => {
    const locationButton = renderLocationButton(location.title, () => onSearch(location));
    locationsList.appendChild(locationButton);
  });

  mainContainer.appendChild(locationsList);

  // Results header
  const resultsHeader = el('h3', { class: 'results__header' }, 'Niðurstöður');
  mainContainer.appendChild(resultsHeader);

  // Output element for results
  const outputElement = el('div', { class: 'output hidden' }); // Starts hidden
  mainContainer.appendChild(outputElement);

  // Append everything to the container
  container.appendChild(mainContainer);
}

// Render the UI on document load
document.addEventListener('DOMContentLoaded', () => {
  render(document.body, locations, onSearch, onSearchMyLocation);
});
