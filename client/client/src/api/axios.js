import axios from 'axios'
import toast from 'react-hot-toast'

// Helper to clear local session on unauthorized responses
const handleUnauthorized = () => {
    localStorage.removeItem('token');
    try { window.location.replace('/login') } catch (e) { /* ignore */ }
}

// VITE_API_URL is the preferred name for both local and Vercel deployments.
// The older names remain supported for existing deployments.
const configuredBaseUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? import.meta.env.VITE_PRODUCTION_API_URL
        : import.meta.env.VITE_BASE_URL);

// The backend has its own Vercel deployment. This fallback prevents a
// production build with a missing Vercel environment variable from attempting
// to call localhost in the visitor's browser.
const defaultBaseUrl = import.meta.env.PROD
    ? "https://full-stack-ems-server.vercel.app"
    : "http://localhost:4000";

// Accept either a server URL or one ending in /api, and always create paths
// such as /api/auth/login exactly once.
const baseUrl = (configuredBaseUrl || defaultBaseUrl)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

const api = axios.create({
    baseURL: `${baseUrl}/api`,
    timeout: 15000,
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
        // A failed login also returns 401, but it is not an expired session.
        // Clear the session only when this request actually sent a JWT.
        if (status === 401 && error?.config?.headers?.Authorization) {
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
