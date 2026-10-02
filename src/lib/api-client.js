import axios from 'axios';

// Public requests
export const api = axios.create({ baseURL: '/api' });

// Admin requests — the session lives in an httpOnly cookie, sent automatically
export const apiSecure = axios.create({ baseURL: '/api', withCredentials: true });
