import axios, { AxiosRequestConfig } from "axios";
import { IWeatherWarningData } from '../../models/weather-warning/IWeatherWarningData';
import { handleError, stripHtmlText } from '../Helper/error-handler';
import { Send } from '../LINE/notify';
require('dotenv').config();

const Firestore = require('@google-cloud/firestore');

var get = async (req: any, res: any, next: any) => {
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
            projectId: process.env.GCLOUD_PROJECT_ID
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
}

module.exports = {
  get
}