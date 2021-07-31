import axios from 'axios'

export function handleError(ex: Error) {
  console.error(`${axios.isAxiosError(ex) ? 'Axios error: ' : 'Unexpected error: '}${ex}`);
}