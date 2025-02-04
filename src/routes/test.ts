var router = require('express').Router();
import { GetJwtToken } from '../lib/Utilities/jwt';

router.post('/broadcastMessage', async (req: any, res: any, next: any) => {
    let jwtToken = await GetJwtToken();
    return res.send(jwtToken);
});

module.exports = router;
