import axios, { AxiosRequestConfig } from 'axios';
import { IWeatherWarningData } from '../../models/weather-warning/IWeatherWarningData';
import { handleError, stripHtmlText } from '../Helper/error-handler';
import { GetJwtToken } from '../Utilities/jwt';
import { IStatelessAccessTokenData } from '../../models/LINE/IStatelessAccessTokenData';
import {
    IssueStatelessAccessTokenWithJwt,
    SendBroadcastMessage,
} from '../LINE/messaging-api';
import { GetTmdConfig } from '../Utilities/env';
import { ITmdConfig } from '../../models/weather-warning/ITmdConfig';
import { GetProjectIdFromMetadata } from '../Utilities/gcloud-secret-manager';

const Firestore = require('@google-cloud/firestore');

var get = async (req: any, res: any, next: any) => {
    try {
        const tmdConfig: ITmdConfig = await GetTmdConfig();
        const tmdUID: string = tmdConfig.uid;
        const tmdAPIKey: string = tmdConfig.apiKey;

        if (!tmdUID || !tmdAPIKey || tmdUID === '' || tmdAPIKey === '') {
            res.status(500).send('TMD API Key not found!!!');
        } else {
            const options: AxiosRequestConfig = {
                method: 'GET',
                url: `http://data.tmd.go.th/api/WeatherWarningNews/v2/?uid=${tmdUID}&ukey=${tmdAPIKey}&format=json`,
            };

            try {
                const { data } = await axios(options);
                const weatherData = <IWeatherWarningData>data;

                if (weatherData.header.status === '200 OK') {
                    if (weatherData.WarningNews) {
                        console.info(
                            `Get weather warning data: Issue = ${weatherData.WarningNews.IssueNo}, Announce date = ${weatherData.WarningNews.AnnounceDateTime}`
                        );
                        res.send(weatherData.WarningNews);
                    } else {
                        console.info(`There is no warning news from TMD.`);
                        res.send('There is no warning news from TMD.');
                    }
                } else {
                    console.error(weatherData.header.status);
                    res.sendStatus(500).send('TMD API error');
                }
            } catch (ex) {
                if (ex instanceof Error) handleError(ex);
                else console.error('UNHANDLED ERROR: Something went wrong!');
                res.sendStatus(500).send('Something went wrong!');
            }
        }
    } catch (ex: any) {
        console.error(`Unhandled exception: ${ex.message}`);
        res.status(500).send('Unhandled exception!!!');
    }
};

var notify = async (req: any, res: any, next: any) => {
    try {
        const tmdConfig: ITmdConfig = await GetTmdConfig();
        const tmdUID: string = tmdConfig.uid;
        const tmdAPIKey: string = tmdConfig.apiKey;

        if (!tmdUID || !tmdAPIKey || tmdUID === '' || tmdAPIKey === '') {
            res.status(500).send('TMD API Key not found!!!');
        } else {
            const options: AxiosRequestConfig = {
                method: 'GET',
                url: `http://data.tmd.go.th/api/WeatherWarningNews/v2/?uid=${tmdUID}&ukey=${tmdAPIKey}&format=json`,
            };

            try {
                const { data } = await axios(options);
                const weatherData = <IWeatherWarningData>data;

                if (weatherData.header.status === '200 OK') {
                    if (weatherData.WarningNews) {
                        console.info(
                            `Get weather warning data: Issue = ${weatherData.WarningNews.IssueNo}, Announce date = ${weatherData.WarningNews.AnnounceDateTime}`
                        );

                        const projectId = await GetProjectIdFromMetadata();
                        const db = new Firestore({
                            projectId: projectId,
                        });

                        const docRef = db
                            .collection('tmd-weather-warning-tracking')
                            .doc(weatherData.WarningNews.AnnounceDateTime);
                        const doc = await docRef.get();

                        if (!doc.exists) {
                            await docRef.set(weatherData.WarningNews);
                            console.info(
                                'Wrote weather warning data to database successfully'
                            );

                            let jwtToken = await GetJwtToken();
                            let accessToken: IStatelessAccessTokenData | null =
                                null;
                            const { data: accessTokenResponse } =
                                await IssueStatelessAccessTokenWithJwt(
                                    jwtToken
                                );
                            accessToken = <IStatelessAccessTokenData>(
                                accessTokenResponse
                            );

                            if (
                                typeof accessToken !== undefined &&
                                accessToken !== null
                            ) {
                                await SendBroadcastMessage(
                                    stripHtmlText(
                                        weatherData.WarningNews.DescriptionThai
                                    ),
                                    accessToken.access_token
                                );
                                await SendBroadcastMessage(
                                    `เอกสาร: ${weatherData.WarningNews.DocumentFile}`,
                                    accessToken.access_token
                                );
                            }

                            console.info('Sent notify successfully');
                            res.send('Sent notify successfully');
                        } else {
                            res.send(
                                'The latest warning news has already been sent!'
                            );
                        }
                    } else {
                        console.info('There is no warning news from TMD.');
                        res.send('There is no warning news from TMD.');
                    }
                } else {
                    console.error(weatherData.header.status);
                    res.sendStatus(500).send('TMD API error');
                }
            } catch (ex: any) {
                handleError(ex);
                res.sendStatus(500).send('Something went wrong!');
            }
        }
    } catch (ex: any) {
        console.error(`Unhandled exception: ${ex.message}`);
        res.status(500).send('Unhandled exception!!!');
    }
};

module.exports = {
    get,
    notify,
};
