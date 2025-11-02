import { getStations } from './fetchData.js';
import { initMap, addStationsToMap, updateIcons } from './map.js';

window.refreshData = () => {
  // invalidate cache
  localStorage.removeItem("stations_last_fetch");

  // reload page
  window.location.reload();
}

async function init() {
  const stations = await getStations();
  console.log("✅ Stations ready:", stations.length);

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
