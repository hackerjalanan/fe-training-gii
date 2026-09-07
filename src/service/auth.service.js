// src/service/auth.service.js
import API from './api.service';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const API_URL = '/auth/v1';

const AuthService = {


  // auth.service.js
async login(username, password, captchaToken) {
  try {
    const response = await API.post(`${API_URL}/login`, {
      username,
      password,
      captchaToken, // GUNAKAN KEY INI agar cocok dengan middleware
    });

    if (response.data.response?.token) {
      this.setToken(response.data.response.token);
      this.setUser(response.data.response.staff);
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
},

  /**
   * Reset semua captcha widgets
   */
  resetCaptcha() {
    try {
      // Reset Turnstile widget
      if (window.turnstile) {
        window.turnstile.reset();
        console.log('Turnstile widget reset successfully');
      }
      
      // Reset reCAPTCHA widget (jika menggunakan Google reCAPTCHA)
      if (window.grecaptcha) {
        window.grecaptcha.reset();
        console.log('reCAPTCHA widget reset successfully');
      }
      
      // Reset hCaptcha widget (jika menggunakan hCaptcha)
      if (window.hcaptcha) {
        window.hcaptcha.reset();
        console.log('hCaptcha widget reset successfully');
      }
      
      // Hapus token captcha dari storage
      localStorage.removeItem('captcha_token');
      localStorage.removeItem('turnstile_token');
      localStorage.removeItem('recaptcha_token');
      localStorage.removeItem('hcaptcha_token');
      
      sessionStorage.removeItem('captcha_token');
      sessionStorage.removeItem('turnstile_token');
      sessionStorage.removeItem('recaptcha_token');
      sessionStorage.removeItem('hcaptcha_token');
      
    } catch (error) {
      console.warn('Error resetting captcha:', error);
    }
  },

  /**
   * Logout pengguna dan hapus semua data dari storage
   */
  logout() {
    try {
      // Reset captcha sebelum logout
      this.resetCaptcha();

      // Hapus token dan user
      Cookies.remove(TOKEN_KEY, { path: '/' }); // tambahkan path
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);

      // Hapus semua token captcha
      const keys = [
        'captcha_token',
        'turnstile_token',
        'recaptcha_token',
        'hcaptcha_token',
      ];
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Hapus semua cookies (jika perlu, tapi hati-hati jangan hapus cookie penting lain)
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        Cookies.remove(name, { path: '/' });
      });

      // Paksa reload ke halaman login
      window.location.replace('/login');

    } catch (error) {
      console.error('Logout error:', error);
      // Tetap redirect meskipun ada error
      window.location.replace('/login');
    }
  },



  /**
   * Menyimpan token ke cookies
   * @param {string} token - Token autentikasi
   */
  setToken(token) {
    // Simpan token dalam cookie dengan masa berlaku 1 hari
    Cookies.set(TOKEN_KEY, token, { expires: 1 });
  },

  /**
   * Mendapatkan token dari cookies
   * @returns {string|null} - Token autentikasi atau null jika tidak ada
   */
  getToken() {
    return Cookies.get(TOKEN_KEY) || null;
  },

  /**
   * Menyimpan data pengguna ke localStorage
   * @param {Object} user - Data pengguna
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Mendapatkan data pengguna dari localStorage
   * @returns {Object|null} - Data pengguna atau null jika tidak ada
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  /**
   * Memeriksa apakah pengguna sudah terautentikasi
   * @returns {boolean} - True jika pengguna terautentikasi
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default AuthService;