import express from 'express';
import axios, {AxiosRequestConfig} from 'axios';
import {IAqiData} from './models/AQI/IAqiData';
import { aqiClassification } from './lib/AQI/aqi-classification';
require('dotenv').config();

const app = express();

app.get('/', (req, res) => {
  res.send('Alive!');
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

  await axios(options)
    .then(async res => {
      if (res.data.status === 'ok') {
        if (res.data.data.length > 0) {
          let aqiJSONData = res.data.data[0];
          console.log(`result: ${JSON.stringify(aqiJSONData)}`);
          aqiData = <IAqiData>aqiJSONData;
          message = `ปริมาณฝุ่น PM 2.5 ที่ ${aqiData.station.name} ณ วันที่ ${new Date(aqiData.time.stime).toLocaleString('th-TH')} คือ ${aqiData.aqi} (คุณภาพอากาศ${aqiClassification(+aqiData.aqi)})`;
        } else {
          console.info(`Data not found: ${JSON.stringify(res.data)}`);
          message = `ไม่พบข้อมูล AQI จากชื่อสถานที่ที่กำหนด. (${location})`;
        }
      } else {
        message = 'ไม่สามารถเรียกดูข้อมูล AQI จาก AQICN ได้';
      }
    })
    .catch((error) => {
      console.error(error);
      message = 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง AQICN';
    });

  res.send(message);
});

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});