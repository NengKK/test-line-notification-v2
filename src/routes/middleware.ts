import { handleError } from '../lib/Helper/error-handler';
require('dotenv').config();

var auth = (req: any, res: any, next: any) => {
  try {
    if (!req.headers['x-api-key']) return res.sendStatus(401);

    if (process.env.API_KEY === req.headers['x-api-key']) {
      console.log(`Authorization pass!`);
      next();
    } else {
      return res.sendStatus(403);
    }
  } catch (ex) {
    handleError(ex);
    return res.sendStatus(500);
  }
};

module.exports = {
  auth,
};
