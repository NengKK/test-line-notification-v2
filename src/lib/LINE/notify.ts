import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';
require('dotenv').config();

export async function Send(message: string) {
  const data =  {
    message
  };
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${process.env.LINE_NOTIFY_BASE_URL}/api/notify`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${process.env.LINE_NOTIFY_ACCESS_TOKEN}`
    },
    data: qs.stringify(data)
  }

  return axios(options);
}