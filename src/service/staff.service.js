import API from './api.service'; // axios instance yang sudah siap
const API_URL = '/staff/v1';


// 1. get all
export const fetchStaffList = async ({
    staff_id = "",
    batch = "",
    size = "",
    search = "",
    status_deleted = "",
    role_id = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
        staff_id,
        batch,
        search,
        size,
        role_id,
        status_deleted
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching staff list:', error);
    throw error;
  }
};


// 2. create
export const createStaff = async ({
  username = "",
  name = "",
  email = "",
  password = "",
  role_id = ""

}) => {
  try {
    const response = await API.post(`${API_URL}/create`,{
      username ,
      name ,
      email ,
      password ,
      role_id 
    });
    return response.data;
  } catch (error) {
    console.error('Error create staff:', error);
    throw error;
  }
};


// 3. delete
export const deleteStaff = async ({ staff_id = "" }) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${staff_id}`);
    return response.data;
  } catch (error) {
    console.error('Error delete staff:', error);
    throw error;
  }
};


// 4. Update staff information
export const updateStaff = async (staffId, staffData) => {
  try {
    const response = await API.patch(`${API_URL}/update/${staffId}`, staffData);
    return response.data;
  } catch (error) {
    console.error('Error updating staff:', error);
    throw error;
  }
};


