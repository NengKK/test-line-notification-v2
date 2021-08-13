var router = require('express').Router();
var handler = require('../lib/WeatherWarning/handler');

router.get('/warning', handler.get);
router.post('/post', (req: any, res: any) => {
  console.log('ok');
});

module.exports = router;
