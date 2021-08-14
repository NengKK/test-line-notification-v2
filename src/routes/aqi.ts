var router = require('express').Router();
var handler = require('../lib/AQI/handler');

router.get('/', handler.get);
router.post('/notify', handler.notify);

module.exports = router;
