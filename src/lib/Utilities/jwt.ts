import * as jose from 'node-jose';
import { ILineConfig } from '../../models/LINE/ILineConfig';
import { GetLineConfig } from './env';
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

export async function GetJwtToken() {
    let lineConfig: ILineConfig = GetLineConfig();

    let privateKey = PRIVATE_KEY;

    let header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: lineConfig.kid,
    };

    let payload = {
        iss: lineConfig.channelId,
        sub: lineConfig.channelId,
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
