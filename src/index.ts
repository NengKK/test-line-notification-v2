import express, { response } from 'express';
import axios, {AxiosRequestConfig} from 'axios';
import {IAqiData} from './models/AQI/IAqiData';
import { aqiClassification } from './lib/AQI/aqi-classification';
import { Send } from './lib/LINE/notify';
require('dotenv').config();
import qs from 'qs';

const app = express();

app.get('/', (req, res) => {
  res.send('Alive!');
});

app.get('/connect', (req, res) => {
  const appBaseUrl = process.env.APP_BASE_URL;
  const oauthUrl = process.env.LINE_NOTIFY_OAUTH_URL;
  const oauthState = process.env.LINE_NOTIFY_OAUTH_STATE;
  const clientId = process.env.LINE_NOTIFY_OAUTH_CLIENT_ID;

  res.redirect(`${oauthUrl}/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${appBaseUrl}/oauth&scope=notify&state=${oauthState}`);
});

app.get('/oauth', async (req, res) => {
  const appBaseUrl = process.env.APP_BASE_URL;
  const oauthUrl = process.env.LINE_NOTIFY_OAUTH_URL;
  const clientId = process.env.LINE_NOTIFY_OAUTH_CLIENT_ID;
  const clientSecret = process.env.LINE_NOTIFY_OAUTH_CLIENT_SECRET;
  const code = req.query.code;
  const state = req.query.state;

  if (state === process.env.LINE_NOTIFY_OAUTH_STATE) {
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `${oauthUrl}/oauth/token`,
      data: qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${appBaseUrl}/oauth`,
        client_id: clientId,
        client_secret: clientSecret
      }),
      headers: { 'content-type': ' application/x-www-form-urlencoded' }
    };
    
    try {
      const { data } = await axios(options);
      console.log(`Authentication success: ${JSON.stringify(data)}`);
      res.send(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Axios error: ${error}`);
      } else {
        console.error(`Unexpected error: ${error}`);
      }
      res.send('Authentication error');
    }
  } else {
    res.redirect('/');
  }
});

app.get('/test', async (req, res) => {
  let message: string;

  if (req.query.message && req.query.message !== '') {
    message = req.query.message?.toString();
  } else {
    message = 'Hello, World!';
  }

  try {
    const { data } = await Send(message);
    res.send(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error}`);
    } else {
      console.error(`Unexpected error: ${error}`);
    }

    res.send('Send notify error');
  }
});

app.get('/aqi', async (req, res) => {
  let location: string;
  if (req.query.location && req.query.location !== '') {
    location = req.query.location?.toString();
  } else {
    location = process.env.DEFAULT_LOCATION_NAME ?? '';
  }
  
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: `${process.env.AQI_CN_URL}/search/?token=${process.env.AQI_CN_TOKEN}&keyword=${encodeURI(location)}`
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
        message = `ปริมาณฝุ่น PM 2.5 ที่ ${aqiData.station.name} ณ วันที่ ${new Date(aqiData.time.stime).toLocaleString('th-TH')} คือ ${aqiData.aqi} (คุณภาพอากาศ${aqiClassification(+aqiData.aqi)})`;
      } else {
        console.info(`Data not found: ${JSON.stringify(data)}`);
        message = `ไม่พบข้อมูล AQI จากชื่อสถานที่ที่กำหนด. (${location})`;
      }
    } else {
      message = 'ไม่สามารถเรียกดูข้อมูล AQI จาก AQICN ได้';
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error}`);
    } else {
      console.error(`Unexpected error: ${error}`);
    }

    message = 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง AQICN';
  }

  res.send(message);
});

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});