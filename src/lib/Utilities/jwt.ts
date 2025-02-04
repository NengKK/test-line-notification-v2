import * as jose from 'node-jose';
require('dotenv').config();

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
const LINE_KID = process.env.LINE_KID;
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

export async function GetJwtToken() {
    let privateKey = PRIVATE_KEY;

    let header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: LINE_KID,
    };

    let payload = {
        iss: LINE_CHANNEL_ID,
        sub: LINE_CHANNEL_ID,
        aud: 'https://api.line.me/',
        exp: Math.floor(new Date().getTime() / 1000) + 60 * 30,
        token_exp: 60 * 60 * 24 * 30,
    };

    var result = await jose.JWS.createSign(
        { format: 'compact', fields: header },
        JSON.parse(privateKey)
    )
        .update(JSON.stringify(payload))
        .final();

    return result;
}
