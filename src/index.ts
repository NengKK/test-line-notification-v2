import express from 'express';
import axios, {AxiosRequestConfig} from 'axios';
import {IAqiData} from './models/AQI/IAqiData';
import { aqiClassification, isUnhealthy } from './lib/AQI/aqi-classification';
import { Send } from './lib/LINE/notify';
require('dotenv').config();

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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});