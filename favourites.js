import { getStations } from './fetchData.js';
import { getBrandLogo } from './map.js'

window.refreshData = () => {
  // invalidate cache
  localStorage.removeItem("stations_last_fetch");

  // reload page
  window.location.reload();
}

window.removeFavourite = (siteId) => {
  let favs = JSON.parse(localStorage.getItem('favourites')) || [];
  favs = favs.filter(id => id !== siteId);
  localStorage.setItem('favourites', JSON.stringify(favs));
  document.querySelector(`[data-site-id="${siteId}"]`)?.remove();
}

async function loadFavourites() {
  const favouritesList = document.getElementById('favourites-list');
  const favourites = JSON.parse(localStorage.getItem('favourites')) || [];

  if (favourites.length === 0) {
    favouritesList.textContent = "No favourites yet! Go back to the map, click a station to open the popup, and click the star icon to favourite it.";
    return;
  }

  const stations = await getStations();
  const favStations = stations.filter(s => favourites.includes(s.site_id));

  favouritesList.innerHTML = favStations.map(station => `
    <div class="fav-station" data-site-id="${station.site_id}">
      <button class="remove-fav" aria-label="Remove favourite"
              onclick="removeFavourite('${station.site_id}')">&times;</button>
      <img src="${getBrandLogo(station.brand)}" alt="${station.brand} Logo" />
      <div>
      <b>${station.brand}</b>
      <p>${station.address}<br>${station.postcode}</p>
      ${Object.entries(station.prices)
        .map(([fuel, price]) => `<b>${fuel}:</b> ${price} p/l<br>`)
        .join('')}
      </div>
    </div>
  `).join('');
}

loadFavourites();

