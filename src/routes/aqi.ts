var router = require('express').Router();
var handler = require('../lib/AQI/handler');

router.get('/', handler.get);
router.get('/trigger', handler.trigger);

module.exports = router;