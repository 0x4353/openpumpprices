// import * as L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

let map, geoJsonLayer;

/**
 * Initialize the Leaflet map
 */
export function initMap() {
  const L = window.L; // get L variable from global
  
  // create map initially centered on and bounded to uk
  map = L.map('map', {
    center: [54.5, -3],
    zoom: 6,
    minZoom: 5,
    maxBounds: [
      [49.5, -10.5],
      [61.5, 2.0]
    ] 
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  return map;
}

// map (semi) normalised names to logo filenames
const brandToLogo = {
  "bp": "BP.webp",
  "jet": "JET.webp",
  "shell": "SHELL.webp",
  "texaco": "TEXACO.webp",
  "esso": "ESSO.webp",
  "valero": "VALERO.webp",
  "murco": "MURCO.webp",
  "morrisons": "MORRISONS.webp",
  "asda": "ASDA.webp",
  "asdaexpress": "ASDA.webp",
  "sainsburys": "SAINSBURYS.webp",
  "tesco": "TESCO.webp",
  "coop": "COOP.webp",
  "essar": "ESSAR.webp"
};

// function to normalise brand and return logo path
export function getBrandLogo(brand) {
  const key = brand.toLowerCase().replace(/[^a-z]/g, "");
  return `./images/brands/${brandToLogo[key] || "default.webp"}`;
}


// Convert stations array to GeoJSON
function stationsToGeoJSON(stations) {
  return {
    type: "FeatureCollection",
    features: stations.map(station => ({
      type: "Feature",
      properties: {
        site_id: station.site_id,
        brand: station.brand,
        address: station.address,
        postcode: station.postcode,
        prices: station.prices,
        source: station.source,
        last_updated: station.last_updated
      },
      geometry: {
        type: "Point",
        coordinates: [
          station.location.longitude,
          station.location.latitude
        ]
      }
    }))
  };
}

function createStationIcon(feature, fuelType) {
  const { brand, prices } = feature.properties;

  // Get E10 price
  const price = prices?.[fuelType] ?? 'N/A';

  // Create a custom divIcon
  return L.divIcon({
    className: 'station-icon',
    html: `
      <img src="${getBrandLogo(brand)}" alt="${brand}"/>
      <span>${price}</span>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 68]
  });
}

window.toggleNerdInfo = function(toggleBtn) {
  const nerdDiv = toggleBtn.previousElementSibling;
  if (nerdDiv.style.display === 'none') {
    nerdDiv.style.display = 'block';
    toggleBtn.textContent = 'Hide nerd info';
  } else {
    nerdDiv.style.display = 'none';
    toggleBtn.textContent = 'Show nerd info';
  }
}

// helper functions for favourite buttons
window.getFavourites = () => {
  return JSON.parse(localStorage.getItem('favourites') || '[]');
};

window.isFavourite = (siteId) => getFavourites().includes(siteId);

window.toggleFavourite = (siteId, btn) => {
  let favs = getFavourites();
  if (favs.includes(siteId)) {
    favs = favs.filter(id => id !== siteId);
    btn.classList.remove('favourited');
  } else {
    favs.push(siteId);
    btn.classList.add('favourited');
  }
  localStorage.setItem('favourites', JSON.stringify(favs));
};

// add GeoJSON of stations to map
export function addStationsToMap(stations, fuelType) {
  if (!map) throw new Error("Map not initialized");

  const geojson = stationsToGeoJSON(stations);

  // Create a marker cluster group
  const markers = L.markerClusterGroup({
    showCoverageOnHover: false
  });

  geoJsonLayer = L.geoJSON(geojson, {
    // custom icon
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, { icon: createStationIcon(feature, fuelType) });
    },
    onEachFeature: (feature, layer) => {
      const {
        brand,
        address,
        postcode,
        prices,
        last_updated,
        source,
        site_id
      } = feature.properties;
      // Example popup content
      const priceInfo = Object.entries(prices)
        .map(([fuel, price]) => `<b>${fuel}:</b> ${price > 0 ? price.toFixed(1) + 'p/l' : 'N/A'}`)
        .join('<br>');

      const popupContent = `
        <div class="station-popup">
          <img src="${getBrandLogo(brand)}" alt="${brand}"/>
          <div>
            <span class="brand-inline">
              <b>${brand}</b>
              <button class="fav-btn" onclick="toggleFavourite('${site_id}', this)"></button>
            </span><br>
            ${address}<br>
            ${postcode}<br>
            ${priceInfo}
            <div class="nerd-mode">
              <b>Station ID:</b> ${site_id}<br>
              <b>Last updated:</b> ${last_updated}<br>
              <b>Source:</b> <a href="${source.url}" target="_blank">${source.name}</a>
            </div>
            <button class="toggle-nerd" onclick="toggleNerdInfo(this)">Show nerd info</button>
          </div>
        </div>
      `;
      layer.bindPopup(popupContent);

      layer.on('popupopen', () => {
        const popupEl = layer.getPopup().getElement();
        const favBtn = popupEl.querySelector('.fav-btn');
        if (!favBtn) return;

        const siteId = layer.feature.properties.site_id;
        if (getFavourites().includes(siteId)) {
          favBtn.classList.add('favourited');
        } else {
          favBtn.classList.remove('favourited');
        }
      });
    }
  });

  markers.addLayer(geoJsonLayer);
  map.addLayer(markers);
}

export function updateIcons(fuelType) {
  geoJsonLayer.eachLayer(layer => {
    layer.setIcon(createStationIcon(layer.feature, fuelType));
  });
}
