// Fetch ALL Terminal Africa Nigerian cities for each state and output a usable JSON
async function buildCityMap() {
  const headers = {
    'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
    'Content-Type': 'application/json'
  };

  const statesRes = await fetch('https://sandbox.terminal.africa/v1/states?country_code=NG&limit=50', { headers });
  const statesData = await statesRes.json();
  const states = statesData.data;

  const result = {};

  for (const state of states) {
    const citiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&state_id=${state.state_id}&limit=500`, { headers });
    const citiesData = await citiesRes.json();
    const cityNames = citiesData?.data?.map(c => c.name) ?? [];
    result[state.name] = cityNames;
    process.stdout.write(`${state.name}: ${cityNames.length} cities\n`);
  }

  // Save to a JSON file
  const fs = require('fs');
  fs.writeFileSync('./terminal-ng-cities.json', JSON.stringify(result, null, 2));
  console.log('\nSaved to terminal-ng-cities.json');
}

buildCityMap().catch(console.error);

