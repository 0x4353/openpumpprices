// List of data sources from GOV.UK Open Fuel Price Data scheme
// will need to check https://www.gov.uk/guidance/access-fuel-price-data for updates
const sources = [
  { name: "Ascona Group", url: "https://fuelprices.asconagroup.co.uk/newfuel.json" },
  { name: "Asda", url: "https://storelocator.asda.com/fuel_prices_data.json" },
  { name: "bp", url: "https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json" },
  { name: "Esso Tesco Alliance", url: "https://fuelprices.esso.co.uk/latestdata.json" },
  { name: "JET Retail UK", url: "https://jetlocal.co.uk/fuel_prices_data.json" },
  { name: "Karan Retail Ltd", url: "https://api.krl.live/integration/live_price/krl" },
  { name: "Morrisons", url: "https://www.morrisons.com/fuel-prices/fuel.json" },
  { name: "Moto", url: "https://moto-way.com/fuel-price/fuel_prices.json" },
  { name: "Motor Fuel Group", url: "https://fuel.motorfuelgroup.com/fuel_prices_data.json" },
  { name: "Rontec", url: "https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json" },
  { name: "Sainsbury’s", url: "https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json" },
  { name: "SGN", url: "https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json" },
  { name: "Shell", url: "https://www.shell.co.uk/fuel-prices-data.html" },
  { name: "Tesco", url: "https://www.tesco.com/fuel_prices/fuel_prices_data.json" }
];

// Public CORS proxy (hacky workaround. should have a backend to fetch fuel data.)
const CORS_PROXY = "https://corsproxy.io/?";
const CONCURRENCY_LIMIT = 5;
// config for storing results in localstorage
const CACHE_KEY = "stations";
const CACHE_TIME_KEY = "stations_last_fetch";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

// result container
const stations = [];

// add timestamp and source metadata to each station
const normaliseData = (apiResponse, sourceApi) =>
  (apiResponse.stations || []).map(station => ({
    ...station,
    source: sourceApi,
    last_updated: apiResponse.last_updated
  }));

// fetch single source
async function fetchWithProxy(source) {
  try {
    const proxyUrl = CORS_PROXY + encodeURIComponent(source.url);
    const response = await fetch(proxyUrl);

    if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn(`⚠️ ${source.name} returned invalid JSON — showing raw text:`);
      console.log(text);
      return;
    }
    const stationsFromSource = normaliseData(data, source);
    // append stations to list of stations
    stations.push(...stationsFromSource);
    
    console.info(`✅ Added ${stationsFromSource.length} stations from ${source.name}`);
  } catch (err) {
    console.error(`❌ Error fetching ${source.name}:`, err.message);
  }
}

// fetch all stations with concurrency
async function fetchAllFuelData() {
  const queue = [...sources];
  const active = [];

  while (queue.length > 0) {
    while (active.length < CONCURRENCY_LIMIT && queue.length > 0) {
      const source = queue.shift();
      const promise = fetchWithProxy(source).finally(() => {
        active.splice(active.indexOf(promise), 1);
      });
      active.push(promise);
    }
    await Promise.race(active); // wait for one to finish
  }

  await Promise.all(active); // finish remaining

  // Log final unified result
  console.groupCollapsed("📊 Unified Station Data");
  console.dir(stations);
  console.groupEnd();

  console.log(`Total stations collected: ${stations.length}`);
  return stations;
}

// main function
export async function getStations(forceRefresh = false) {
  const now = Date.now();
  const lastFetch = localStorage.getItem(CACHE_TIME_KEY);
  const cached = localStorage.getItem(CACHE_KEY);

  // if cache is fresh, use it
  if (!forceRefresh && cached && lastFetch && now - Number(lastFetch) < CACHE_DURATION) {
    console.log("📦 Using cached stations data");
    return JSON.parse(cached);
  }

  // otherwise, fetch new data
  console.log("🔄 Fetching fresh station data...");
  const stations = await fetchAllFuelData();

  // cache results
  localStorage.setItem(CACHE_KEY, JSON.stringify(stations));
  localStorage.setItem(CACHE_TIME_KEY, now.toString());

  return stations;
}

