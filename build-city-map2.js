// Build a CORRECT city map - filter by stateCode
async function buildCorrectCityMap() {
  const headers = {
    'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
    'Content-Type': 'application/json'
  };

  // Get all states
  const statesRes = await fetch('https://sandbox.terminal.africa/v1/states?country_code=NG&limit=50', { headers });
  const statesData = await statesRes.json();
  const states = statesData.data;

  // Get ALL cities in one shot (limit=1000, paginate if needed)
  const citiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&limit=1000`, { headers });
  const citiesData = await citiesRes.json();
  const allCities = citiesData?.data ?? [];
  console.log(`Total cities fetched: ${allCities.length}`);

  // Check if there's pagination
  console.log('Cities pagination:', JSON.stringify(citiesData?.pagination ?? citiesData?.meta ?? {}));

  // Build a map: stateCode -> [cityNames]
  const result = {};
  for (const state of states) {
    // stateCode in states = isoCode. stateCode in cities = isoCode too
    const stateCities = allCities.filter(c => c.stateCode === state.isoCode);
    result[state.name] = stateCities.map(c => c.name).sort();
    if (state.name === 'Lagos' || state.name === 'Abuja' || state.name === 'Rivers') {
      console.log(`${state.name} (${state.isoCode}): ${stateCities.length} cities - First 5: ${result[state.name].slice(0,5).join(', ')}`);
    }
  }

  const fs = require('fs');
  fs.writeFileSync('./terminal-ng-cities-v2.json', JSON.stringify(result, null, 2));
  
  // Check total number of cities
  const totalCities = Object.values(result).reduce((sum, cities) => sum + cities.length, 0);
  console.log(`\nTotal cities mapped: ${totalCities}`);
  console.log(`States with cities: ${Object.keys(result).filter(s => result[s].length > 0).length}`);
  console.log('Saved to terminal-ng-cities-v2.json');
}

buildCorrectCityMap().catch(console.error);
