var router = require('express').Router();
var handler = require('../lib/WeatherWarning/handler');

router.get('/warning', handler.get);

module.exports = router;