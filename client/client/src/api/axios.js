import axios from 'axios'
import toast from 'react-hot-toast'

// Helper to clear local session on unauthorized responses
const handleUnauthorized = () => {
    localStorage.removeItem('token');
    try { window.location.replace('/login') } catch (e) { /* ignore */ }
}

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

// Global response handler: show toast for server errors and handle 401
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            handleUnauthorized();
            toast.error('Session expired. Please sign in again');
            return Promise.reject(error);
        }
        if (status >= 500) {
            toast.error('Server error. Try again later');
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
)

export default api
