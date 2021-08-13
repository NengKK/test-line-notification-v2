import express from 'express';
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

var aqiHandler = require('./routes/aqi');
var weatherHandler = require('./routes/weather');

app.get('/', (req, res) => {
  res.send('Alive!');
});
app.use('/aqi', aqiHandler);
app.use('/weather', weatherHandler);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});