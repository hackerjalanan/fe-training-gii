import API from './api.service'; // axios instance yang sudah siap

const API_URL = '/auth/v1';

export const sendOtp = async ({ email = "" }) => {
  try {
    const response = await API.post(`${API_URL}/send-otp`,{email});
    return response.data;
  } catch (error) {
    console.error('Error delete report:', error);
    throw error;
  }
};

export const verifyOtp = async ({ email = "", otpInput = "" }) => {
  try {
    const response = await API.post(`${API_URL}/verify-otp`, { email, otpInput });
    const token = response.data?.token;

    if (token) {
      localStorage.setItem("otp_token", token);
    }

    return response.data;
  } catch (error) {
    console.error('Error verify OTP:', error);
    throw error;
  }
};



export const resetPw = async ({ newPassword, confirmPassword }) => {
  try {
    const response = await API.patch(
      `/auth/v1/reset-password`, // pastikan ini sesuai dengan routing backend kamu
      { newPassword, confirmPassword },
      {
        withCredentials: true, // ⬅️ penting! agar cookie auth_token ikut dikirim
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error reset password:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await API.get("/auth/v1/profil", {
      withCredentials: true, // ⬅️ agar cookie `auth_token` dikirim otomatis
    });
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil profil pengguna:", error);
    throw error;
  }
};

export const sendOTPupdatePW = async ({oldPassword}) => {
  try {
    const response = await API.post(`${API_URL}/send-otp-update`,{oldPassword});
    return response.data;
  } catch (error) {
    console.error('Error send  otp:', error);
    throw error;
  }
};


export const updatePasswordUpdate = async ({ otpCode, newPassword, confirmPassword }) => {
  try {
    const response = await API.patch(`${API_URL}/update-password`,{otpCode, newPassword, confirmPassword });
    return response.data;
  } catch (error) {
    console.error('Error update password:', error);
    throw error;
  }
};

