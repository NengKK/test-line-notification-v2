import { Send } from '../LINE/notify';
require('dotenv').config();
var Crawler = require('crawler');

var notify = async (req: any, res: any, next: any) => {
  try {
    var c = new Crawler({
      maxConnections: 10,
      callback: async (error: Error, res: any, done: Function) => {
        if (error) {
          console.log('Error');
          console.log(error);
        } else {
          var $ = res.$;
          let href = res.request.uri.href;
          let text: string = '';
          let message: string = '';

          console.info(`Crawling on ${href}`);

          if (href === process.env.XBOX_SERIES_S_URL) {
            text = $('#rootContainer_BuyBox').text();
            if (!text.includes('Out of stock')) {
              message = `XBox Series S is available on ${process.env.XBOX_SERIES_S_URL}`;
              console.info(message);
              await Send(message);
            }
          } else if (href === process.env.XBOX_SERIES_X_URL) {
            text = $('#rootContainer_BuyBox').text();
            if (!text.includes('Out of stock')) {
              message = `XBox Series X is available on ${process.env.XBOX_SERIES_X_URL}`;
              console.info(message);
              await Send(message);
            }
          } else {
            console.log('The given link is not match');
          }
        }
        done();
      },
    });

    await c.queue([
      // process.env.XBOX_SERIES_S_URL,
      process.env.XBOX_SERIES_X_URL,
    ]);

    res.send();
  } catch (ex) {
    res.sendStatus(500).send(ex);
  }
};

module.exports = {
  notify,
};
