import React, { useEffect, useState } from 'react';
import {  } from '../../../service/master-data.service';
import { updateReportSchedule, dropdownMeeting, dropdownTypeReport, fetchReportScheduleList } from '../../../service/report-schedule.service';

const ReportScheduleUpdate = ({ trainingSesiId, reportScheduleId, onClose, onSuccess }) => {
  const [meetings, setMeetings] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [formData, setFormData] = useState({
    report_type_id: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      return localDate.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const fetchExistingData = async () => {
    if (!reportScheduleId) return;

    try {
      setInitialLoading(true);
      const response = await fetchReportScheduleList({ report_schedule_id: reportScheduleId });
      const records = response?.response?.records || [];

      if (records.length > 0) {
        const existing = records[0];

        // 1. Fetch meeting terlebih dahulu sebelum set selectedMeetingId
        const meetingRes = await dropdownMeeting({ training_sesi_id: trainingSesiId });
        const meetingList = Array.isArray(meetingRes?.response) ? meetingRes.response : [];
        setMeetings(meetingList);
        setSelectedMeetingId(existing.meeting_id || '');

        // 2. Fetch report type berdasarkan meeting & report_type_id
        const reportTypeRes = await dropdownTypeReport({
          meeting_id: existing.meeting_id,
          report_type_id: existing.report_type_id
        });
        setReportTypes(Array.isArray(reportTypeRes?.response) ? reportTypeRes.response : []);

        // 3. Set data form
        setFormData({
          report_type_id: existing.report_type_id || '',
          start_date: formatDateForInput(existing.start_date),
          end_date: formatDateForInput(existing.end_date),
        });
      } else {
        alert('Data jadwal laporan tidak ditemukan.');
      }
    } catch (error) {
      console.error('Gagal mengambil data existing:', error);
      alert('Gagal mengambil data jadwal laporan.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (reportScheduleId && trainingSesiId) {
      fetchExistingData();
    }
  }, [reportScheduleId, trainingSesiId]);


  useEffect(() => {
    const fetchMeetings = async () => {
      if (!trainingSesiId) return;
      try {
        const res = await dropdownMeeting({ training_sesi_id: trainingSesiId });
        setMeetings(Array.isArray(res?.response) ? res.response : []);
      } catch (err) {
        console.error('Gagal mengambil data meeting:', err);
        alert('Gagal mengambil daftar meeting.');
      }
    };

    fetchMeetings();
  }, [trainingSesiId]);

  useEffect(() => {
    const fetchReportTypes = async () => {
      if (!selectedMeetingId) return;
      try {
        const res = await dropdownTypeReport({
          meeting_id: selectedMeetingId,
          report_type_id: formData.report_type_id,
        });
        setReportTypes(Array.isArray(res?.response) ? res.response : []);
      } catch (err) {
        console.error('Gagal mengambil report types:', err);
        alert('Gagal mengambil daftar jenis laporan.');
      }
    };

    fetchReportTypes();
  }, [selectedMeetingId, formData.report_type_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'meeting_id') {
      setSelectedMeetingId(value);
      setFormData(prev => ({ ...prev, report_type_id: '' })); // reset report_type saat meeting berubah
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!selectedMeetingId) {
      alert('Pilih meeting terlebih dahulu.');
      return false;
    }
    if (!formData.report_type_id) {
      alert('Pilih jenis laporan terlebih dahulu.');
      return false;
    }
    if (!formData.start_date || !formData.end_date) {
      alert('Tanggal mulai dan selesai harus diisi.');
      return false;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      alert('Tanggal selesai harus lebih besar dari tanggal mulai.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        training_sesi_id: trainingSesiId,
        meeting_id: selectedMeetingId,
        report_type_id: formData.report_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date
      };

      await updateReportSchedule(reportScheduleId, payload);
      alert('Jadwal laporan berhasil diperbarui.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Gagal memperbarui jadwal laporan:', err);
      alert('Terjadi kesalahan saat memperbarui jadwal.');
    } finally {
      setLoading(false);
    }
  };


  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Memuat data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Perbarui Jadwal Laporan</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meeting</label>
            <select
              name="meeting_id"
              value={selectedMeetingId}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih meeting</option>
              {meetings.map((m) => (
                <option key={m.meeting_id} value={m.meeting_id}>
                  {m.name || `Meeting pada ${new Date(m.start_date).toLocaleString('id-ID')}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jenis Laporan</label>
            <select
              name="report_type_id"
              value={formData.report_type_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih jenis laporan</option>
              {reportTypes.map((type) => (
                <option key={type.report_type_id} value={type.report_type_id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
            <input
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportScheduleUpdate;
