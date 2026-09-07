import API from './api.service'; // axios instance yang sudah siap


const API_URL = '/dashboard/v1';

// 1. dashboard
export const fetchDachboardActivity = async () => {
  try {
    const response = await API.get(`${API_URL}/activity`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sesi:', error);
    throw error;
  }
};


// 2. total data dashboard
export const fetchDachboardtotaldata = async () => {
  try {
    const response = await API.get(`${API_URL}/total-training`);
    return response.data;
  } catch (error) {
    console.error('Error fetching total data :', error);
    throw error;
  }
};

