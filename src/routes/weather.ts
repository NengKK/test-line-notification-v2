var router = require('express').Router();
var handler = require('../lib/WeatherWarning/handler');
var auth = require('./middleware');

router.get('/warning', handler.get);
router.post('/warning/notify', handler.notify);

module.exports = router;
