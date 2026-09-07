import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL

// 1. simpan toke
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 2. Optional: Tambah Bearer token dari localStorage (jika tidak pakai cookie)
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 3. Tangani error 401 dari server
API.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;

    if (response) {
      const { metaData } = response.data || {};

      // Tangani 401 dari metaData atau status
      if (
        response.status === 401 ||
        (metaData?.code === 401 && metaData?.message?.includes('Token not found'))
      ) {
        // Hapus token/token-session dari localStorage jika ada
        localStorage.removeItem('token');

        // (Opsional) Hapus cookie jika kamu atur manual lewat JavaScript (tidak httpOnly)
        document.cookie = 'token=; Max-Age=0; path=/;';

        // (Opsional) Redirect ke login jika ingin langsung alihkan
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
