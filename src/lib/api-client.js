import axios from 'axios';

// Public requests
export const api = axios.create({ baseURL: '/api' });

// Signed-in requests — the session lives in an httpOnly cookie, sent automatically
export const apiSecure = axios.create({ baseURL: '/api', withCredentials: true });

// Message from an API error response ({ success: false, message })
export const apiError = (err, fallback = 'Something went wrong.') => err?.response?.data?.message || fallback;
