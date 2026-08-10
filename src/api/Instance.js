import axios from 'axios';

export const BASE_URL = 'https://api.fixetservices.com/api';
// export const BASE_URL = 'https://48cb-2401-4900-51e0-1730-29ae-bd3a-55b4-939c.ngrok-free.app/api'
// export const BASE_URL = 'https://cabdriverserver-a3cdd048fc7c.herokuapp.com/api'

export const Instance = axios.create({
  // baseURL: 'https://adiya-cabs-ierz.onrender.com/',
  baseURL: BASE_URL,
});
