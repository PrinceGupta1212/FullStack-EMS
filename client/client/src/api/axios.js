import axios from 'axios'

// Keep the public API separate from VITE_BASE_URL.  The latter is used for
// local development and an old Vercel value could otherwise make production
// builds call a protected preview deployment.
const configuredBaseUrl = import.meta.env.PROD
    ? import.meta.env.VITE_PRODUCTION_API_URL
    : import.meta.env.VITE_BASE_URL;

const baseUrl = (configuredBaseUrl || "http://localhost:4000")
    .trim()
    .replace(/\/$/, "");

const api = axios.create({
    baseURL: `${baseUrl}/api`
})

//Attach Auth token to all network requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export default api
