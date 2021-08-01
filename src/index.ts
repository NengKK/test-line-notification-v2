import express from 'express';
import axios, {AxiosRequestConfig} from 'axios';
import {IAqiData} from './models/AQI/IAqiData';
import { aqiClassification, isUnhealthy } from './lib/AQI/aqi-classification';
import { Send } from './lib/LINE/notify';
import { handleError, stripHtmlText } from './lib/Helper/error-handler';
import { IWeatherWarningData } from './models/weather-warning/IWeatherWarningData';
require('dotenv').config();

const Firestore = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 8080;
const NOTIFY_ONLY_UNHEALTHY = (process.env.NOTIFY_ONLY_UNHEALTHY || '1') !== '0';

app.get('/', (req, res) => {
  res.send('Alive!');
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

app.get('/aqi/trigger', async (req, res) => {
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

        if ((isUnhealthy(+aqiData.aqi) && NOTIFY_ONLY_UNHEALTHY) || !NOTIFY_ONLY_UNHEALTHY) {
          message = `ปริมาณฝุ่น PM 2.5 ที่ ${aqiData.station.name} ณ วันที่ ${new Date(aqiData.time.stime).toLocaleString('th-TH')} คือ ${aqiData.aqi} (คุณภาพอากาศ${aqiClassification(+aqiData.aqi)})`;
          try {
            const { data } = await Send(message);
            res.send(data);
          } catch (error) {
            res.send(error);
          }
        } else {
          res.send(`AQI is OK at given location: ${location} OR App suppress sending notification if AQI is healthy.`);
        }
      } else {
        console.info(`Data not found: ${JSON.stringify(data)}`);
        res.status(404).send()
      }
    } else {
      message = 'ไม่สามารถเรียกดูข้อมูล AQI จาก AQICN ได้';
      res.status(500).send();
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error}`);
    } else {
      console.error(`Unexpected error: ${error}`);
    }

    res.status(500).send('เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง AQICN');
  }
});

app.get('/weather-warning', async (req, res) => {
  const tmdUID = process.env.TMD_UID;
  const tmdAPIKey = process.env.TMD_API_KEY;

  if (!tmdUID || ! tmdAPIKey || tmdUID === '' || tmdAPIKey === '') {
    res.status(500).send('TMD API Key not found!!!');
  } else {
    let isNotify: boolean = false;
    if (req.query.notify && req.query.notify !== '') {
      let notifyQueryString = req.query.notify?.toString();
      isNotify = notifyQueryString.toLowerCase() === 'yes' || notifyQueryString === '1';
    }
  
    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `http://data.tmd.go.th/api/WeatherWarningNews/v1/?uid=${tmdUID}&ukey=${tmdAPIKey}&format=json`
    };
  
    try {
      const { data } = await axios(options);
      const weatherData = <IWeatherWarningData>data;
  
      if (weatherData.header.status === '200 OK') {
        console.info(`Get weather warning data: Issue = ${weatherData.WarningNews.IssueNo}, Announce date = ${weatherData.WarningNews.AnnounceDateTime}`);
        console.info(`Notify flag: ${isNotify}`);
        if (isNotify) {
          const db = new Firestore({
            projectId: 'line-notification-321208',
            keyFilename: './gcloud-credential/line-notification-321208-8897be33d0f3.json',
          });
    
          const docRef = db.collection('tmd-weather-warning-tracking').doc(weatherData.WarningNews.AnnounceDateTime);
          const doc = await docRef.get();
    
          if (!doc.exists) {
            await docRef.set(weatherData.WarningNews);
            console.info('Wrote weather warning data to database successfully');
            await Send(stripHtmlText(weatherData.WarningNews.DescriptionThai));
            await Send(`เอกสาร: ${weatherData.WarningNews.DocumentFile}`);
            console.info('Sent notify successfully');
          }
        }
        
        res.send(weatherData.WarningNews);
      } else {
        console.error(weatherData.header.status);
        res.sendStatus(500).send('TMD API error');
      }
    } catch (ex) {
      handleError(ex);
      res.sendStatus(500).send('Something went wrong!');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});