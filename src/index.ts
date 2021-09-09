import express from 'express';
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

var aqiHandler = require('./routes/aqi');
var weatherHandler = require('./routes/weather');
var middleware = require('./routes/middleware');
var xboxCrawlerHandler = require('./routes/xboxCrawler');

app.get('/', (req, res) => {
  res.send('Alive!');
});
app.post('*', middleware.auth);
app.use('/aqi', aqiHandler);
app.use('/weather', weatherHandler);
app.use('/xbox-crawler', xboxCrawlerHandler);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});
