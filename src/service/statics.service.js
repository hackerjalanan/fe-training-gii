// statistic.service.js

import API from './api.service'; // axios instance yang sudah siap
const API_URL = '/statc/v1';


export const fetchStatctTotalReport = async ({ startDate, endDate }) => {
  try {
    const response = await API.post(`${API_URL}/total-report`, {
      startDate,
      endDate
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

