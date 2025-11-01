import { getStations, extractFuelTypes } from './fetchData.js';
import { initMap, addStationsToMap, updateIcons } from './map.js';

window.refreshData = () => {
  // invalidate cache
  localStorage.removeItem("stations_last_fetch");

  // reload page
  window.location.reload();
}

function populateFuelSelector(fuelTypes) {
  const fuelSelectorDiv = document.querySelector('.fuel-selector');

  fuelTypes.forEach(fuel => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'fuelType';
    input.value = fuel;
    input.id = fuel;
  
    // Default to 'E10' if it's available in the fuel list
    if (fuel === 'E10') input.checked = true;

    const text = document.createTextNode(fuel);

    label.appendChild(input);
    label.appendChild(text);
    fuelSelectorDiv.appendChild(label);
  });
}

async function init() {
  const stations = await getStations();
  console.log("✅ Stations ready:", stations.length);

  // populate fuel type selector
  const fuelTypes = extractFuelTypes(stations);
  populateFuelSelector(fuelTypes);

  let selectedFuelType = 'E10'; // Default fuel type

  // Listen for fuel type change
  document.querySelectorAll('input[name="fuelType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedFuelType = e.target.value;
      updateIcons(selectedFuelType); // Update markers when fuel type changes
    });
  });

  // initialise leaflet.js map
  const map = initMap();
  addStationsToMap(stations, selectedFuelType);
}

init();
