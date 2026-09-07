// services/participant.service.js
import API from './api.service'; // Assuming you have an API config file

const API_URL = '/participant/v1';


// 1. show all list
export const fetchParticipants = async (params) => {
  try {
    const response = await API.post(`${API_URL}/list`, params);
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
};

// 2. update participant
export const deleteParticipant = async (participant_id) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${participant_id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting participant:', error);
    throw error;
  }
};

// 3. getbyid participant
export const fetchParticipantById = async (participant_id) => {
  try {
    const response = await API.post(`${API_URL}/list`, { participant_id }); 
    return response.data;
  } catch (error) {
    console.error(`Error fetching participant ${participant_id}:`, error);
    throw error;
  }
};

// 4. create participant
export const createParticipant = async ({
  name = "",
  agency = "",
  email = "",
  domicile = "",
  training_sesi_ids = []

}) => {
  try {
    const response = await API.post(`${API_URL}/create`,{
      name ,
      agency ,
      email ,
      domicile ,
      training_sesi_ids
    });
    return response.data;
  } catch (error) {
    console.error('Error create staff:', error);
    throw error;
  }
};

// 5. update participant
export const updateParticipant = async (id, participantData) => {
  try {
    const response = await API.patch(`${API_URL}/update/${id}`, participantData);
    return response.data;
  } catch (error) {
    console.error(`Error updating participant ${id}:`, error);
    throw error;
  }
};

