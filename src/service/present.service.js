// services/present.service.js
import API from './api.service'; // Assuming you have an API config file

const API_URL = '/present/v1';



export const fetchPresent = async (training_sesi_id, search = '') => {
  try {
    const response = await API.post(`${API_URL}/list`, {
      training_sesi_id,
      search
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching presence data:', error);
    throw error;
  }
};


export const fetchMeetingPresent = async (training_sesi_id, meeting_id, search = '') => {
  try {
    const response = await API.post(`${API_URL}/meeting`, {
      training_sesi_id,
      meeting_id,
      search
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching presence data:', error);
    throw error;
  }
};


export const fetchSavePresent = async (meeting_id, participant_id, status_present) => {
  try {
    const response = await API.post(`${API_URL}/save`, {
      meeting_id,
      participant_id,
      status_present
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching presence data:', error);
    throw error;
  }
};

export const dropdownMeeting = async (training_sesi_id) => {
  try {
    const response = await API.post(`${API_URL}/dropdown-meeting`, {
      training_sesi_id
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching presence data:', error);
    throw error;
  }
};
