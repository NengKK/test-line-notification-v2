var router = require('express').Router();
var handler = require('../lib/XboxCrawler/handler');

router.post('/notify', handler.notify);

module.exports = router;
