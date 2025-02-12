import axios, { AxiosRequestConfig } from 'axios';
import { JWS } from 'node-jose';
import qs from 'qs';

export async function IssueAccessToken(jwtToken: JWS.CreateSignResult) {
    const data = {
        grant_type: 'client_credentials',
        client_assertion_type:
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: `${jwtToken}`,
    };
    const options: AxiosRequestConfig = {
        method: 'POST',
        url: 'https://api.line.me/oauth2/v2.1/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify(data),
    };

    return axios(options);
}

export async function SendBroadcastMessage(
    message: string,
    accessToken: string
) {
    const data = {
        messages: [
            {
                type: 'text',
                text: message,
            },
        ],
    };
    const options: AxiosRequestConfig = {
        method: 'POST',
        url: 'https://api.line.me/v2/bot/message/broadcast',
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        data: data,
    };

    return axios(options);
}
