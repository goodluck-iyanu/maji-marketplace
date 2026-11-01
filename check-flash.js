const fs = require('fs');
const data = require('./models-output.json');
const models = data.models.filter(m => m.name.includes('flash') && !m.name.includes('tts'));
console.log(models.map(m => m.name));
