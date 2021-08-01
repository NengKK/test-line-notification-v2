import axios from 'axios'
import { stripHtml } from 'string-strip-html';

export function handleError(ex: Error): void {
  console.error(`${axios.isAxiosError(ex) ? 'Axios error: ' : 'Unexpected error: '}${ex}`);
}

export function stripHtmlText(text: string): string {
  return stripHtml(text).result;
}