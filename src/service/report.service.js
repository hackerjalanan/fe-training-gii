import API from './api.service'; // axios instance yang sudah siap

const API_URL = '/report/v1';

// 1. get all send
export const fetchReportList = async ({
  batch = 1,
  report_id = "",
  size = 5,
  search = "",
  staff_id = "",
  status_delete = "1",
  report_schedule_id = "",
  report_inout = "",
  status_acc = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
      batch,
      report_id,
      search,
      size,
      staff_id,
      status_delete,
      report_schedule_id,
      report_inout,
      status_acc,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching staff list:', error);
    throw error;
  }
};

// 1.2. show all present list
export const fetchpresent = async (report_id) => {
  try {
    const response = await API.get(`${API_URL}/present/${report_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
};

// 2. create
export const createReport = async ({
  training_sesi_id = "",
  report_schedule_id = "",
  name = "",
  status_acc = "",
  details = [],
  attachment = [], 
}) => {
  try {
    const response = await API.post(`${API_URL}/create`, {
      training_sesi_id,
      report_schedule_id,
      name, 
      status_acc,
      details: details.map(detail => ({
        report_content_id: detail.report_content_id || "",
        content_text: detail.content_text || "",

      })),
  
      attachment, 
    });

    return response.data;
  } catch (error) {
    console.error('Error creating report:', error?.response?.data || error.message);
    throw error;
  }
};

// 4. update
export const updateReport = async ({
  report_id = "",
  training_sesi_id = "",
  report_schedule_id = "",
  name = "",
  approve = false ,
  details = [],
  attachment = [],
}) => {
  try {
    const payload = {
      training_sesi_id,
      report_schedule_id,
      name,
      approve,
      details: details.map(detail => ({
        report_detail_id: detail.report_detail_id || undefined,
        report_content_id: detail.report_content_id || undefined,
        content_text: detail.content_text ||  undefined,
      })),
     
      attachment,
    };

    const response = await API.patch(`${API_URL}/update/${report_id}`, payload);

    return response.data;
  } catch (error) {
    console.error("Error updating report:", error?.response?.data || error.message);
    throw error;
  }
};

// 4. update
export const updateACCReport = async ({
  report_id = "",
  status_acc = "",
  approve = true ,
  s = "",
}) => {
  try {
    const payload = {
      status_acc,
      approve,

    };
    const response = await API.patch(`${API_URL}/update/${report_id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating report:", error?.response?.data || error.message);
    throw error;
  }
};

// 5. delete
export const deleteReport = async ({ report_id = "" }) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${report_id}`);
    return response.data;
  } catch (error) {
    console.error('Error delete report:', error);
    throw error;
  }
};




