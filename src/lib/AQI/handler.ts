import axios, { AxiosRequestConfig } from 'axios';
import { IAqiData } from '../../models/AQI/IAqiData';
import { aqiClassification, isUnhealthy } from './aqi-classification';
import { handleError } from '../Helper/error-handler';
import { IssueAccessToken, SendBroadcastMessage } from '../LINE/messaging-api';
import { GetJwtToken } from '../Utilities/jwt';
import { IAccessTokenData } from '../../models/LINE/IAccessTokenData';
require('dotenv').config();

const NOTIFY_ONLY_UNHEALTHY =
    (process.env.NOTIFY_ONLY_UNHEALTHY || '1') !== '0';

var get = async (req: any, res: any, next: any) => {
    let location: string;
    if (req.query.location && req.query.location !== '') {
        location = req.query.location?.toString();
    } else {
        location = process.env.DEFAULT_LOCATION_NAME ?? '';
    }

    const options: AxiosRequestConfig = {
        method: 'GET',
        url: `${process.env.AQI_CN_URL}/search/?token=${
            process.env.AQI_CN_TOKEN
        }&keyword=${encodeURI(location)}`,
    };
    let message = 'DEFAULT';
    let aqiData: IAqiData;

    try {
        const { data } = await axios(options);

        if (data.status === 'ok') {
            if (data.data.length > 0) {
                let aqiJSONData = data.data[0];
                console.log(`result: ${JSON.stringify(aqiJSONData)}`);
                aqiData = <IAqiData>aqiJSONData;
                message = `ปริมาณฝุ่น PM 2.5 ที่ ${
                    aqiData.station.name
                } ณ วันที่ ${new Date(aqiData.time.stime).toLocaleString(
                    'th-TH'
                )} คือ ${aqiData.aqi} (คุณภาพอากาศ${aqiClassification(
                    +aqiData.aqi
                )})`;
            } else {
                console.info(`Data not found: ${JSON.stringify(data)}`);
                message = `ไม่พบข้อมูล AQI จากชื่อสถานที่ที่กำหนด. (${location})`;
            }
        } else {
            message = 'ไม่สามารถเรียกดูข้อมูล AQI จาก AQICN ได้';
        }
    } catch (ex) {
        if (axios.isAxiosError(ex)) {
            console.error(`Axios error: ${ex}`);
        } else {
            console.error(`Unexpected error: ${ex}`);
        }

        message = 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง AQICN';
    }

    res.send(message);
};

var notify = async (req: any, res: any, next: any) => {
    let location: string;
    if (req.query.location && req.query.location !== '') {
        location = req.query.location?.toString();
    } else {
        location = process.env.DEFAULT_LOCATION_NAME ?? '';
    }

    const options: AxiosRequestConfig = {
        method: 'GET',
        url: `${process.env.AQI_CN_URL}/search/?token=${
            process.env.AQI_CN_TOKEN
        }&keyword=${encodeURI(location)}`,
    };
    let message = 'DEFAULT';
    let aqiData: IAqiData;

    console.log(`Location: ${location}`);
    console.log(`URL: ${options.url}`);

    try {
        const { data } = await axios(options);

        if (data.status === 'ok') {
            if (data.data.length > 0) {
                let aqiJSONData = data.data[0];
                console.log(`result: ${JSON.stringify(aqiJSONData)}`);
                aqiData = <IAqiData>aqiJSONData;

                if (
                    (isUnhealthy(+aqiData.aqi) && NOTIFY_ONLY_UNHEALTHY) ||
                    !NOTIFY_ONLY_UNHEALTHY
                ) {
                    message = `ปริมาณฝุ่น PM 2.5 ที่ ${
                        aqiData.station.name
                    } ณ วันที่ ${new Date(aqiData.time.stime).toLocaleString(
                        'th-TH'
                    )} คือ ${aqiData.aqi} (คุณภาพอากาศ${aqiClassification(
                        +aqiData.aqi
                    )})`;
                    try {
                        let jwtToken = await GetJwtToken();
                        let accessToken: IAccessTokenData | null = null;
                        const { data: accessTokenResponse } =
                            await IssueAccessToken(jwtToken);
                        accessToken = <IAccessTokenData>accessTokenResponse;

                        if (
                            typeof accessToken !== undefined &&
                            accessToken !== null
                        ) {
                            const { data: broadcastResult } =
                                await SendBroadcastMessage(
                                    message,
                                    accessToken.access_token
                                );
                        }

                        res.send('Broadcast message success');
                    } catch (error) {
                        res.send(error);
                    }
                } else {
                    res.send(
                        `AQI is OK at given location: ${location} OR App suppress sending notification if AQI is healthy.`
                    );
                }
            } else {
                console.info(`Data not found: ${JSON.stringify(data)}`);
                res.status(404).send();
            }
        } else {
            message = 'ไม่สามารถเรียกดูข้อมูล AQI จาก AQICN ได้';
            res.status(500).send();
        }
    } catch (ex) {
        handleError(ex);
        res.status(500).send('เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง AQICN');
    }
};

module.exports = {
    get,
    notify,
};
