import { IAqiStationData } from './IAqiStationData';
import { IAqiTimeData } from './IAqiTimeData';

export interface IAqiData {
  uid: number;
  aqi: string;
  time: IAqiTimeData;
  station: IAqiStationData;
}
