// utils/dateUtils.js
export const formatDate = (date) =>
  date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};


// Format date function with day of week and short month names
export const formatDatetime = (dateString) => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }

    // Array nama hari dalam bahasa Indonesia
    const hariArray = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    // Array singkatan bulan dalam bahasa Indonesia
    const bulanSingkatArray = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const hari = hariArray[date.getDay()];
    const tanggal = date.getDate();
    const bulan = bulanSingkatArray[date.getMonth()];
    const tahun = date.getFullYear();

    const jam = String(date.getHours()).padStart(2, '0');
    const menit = String(date.getMinutes()).padStart(2, '0');

    // Format: Senin, 15 Mei 2025 13:45
    return `${hari}, ${tanggal} ${bulan} ${tahun} ${jam}:${menit}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Format date function: hanya tanggal, bulan singkat, dan tahun
export const formatDateNum = (dateString) => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return '-';

    const bulanSingkatArray = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const tanggal = date.getDate();
    const bulan = bulanSingkatArray[date.getMonth()];
    const tahun = date.getFullYear();

    // Format: 15 Mei 2025
    return `${tanggal} ${bulan} ${tahun}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};
