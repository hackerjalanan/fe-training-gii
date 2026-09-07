import React, { useState, useEffect } from 'react';
import { updateStaff, fetchStaffList } from '../../service/staff.service';
import { getRoleList } from '../../service/master-data.service';
// import { Edit } from 'lucide-react'; // Assuming you're using Lucide for icons

const UpdateStaffForm = ({ staffId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role_id: '',
    status_deleted: '0' // Added status_deleted with default value '0' (not deleted)
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Load staff data and roles on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch staff data - corrected parameter format
        const staffResponse = await fetchStaffList({
          staff_id: staffId
        });

        // Access the staff data from the correct path in the response
        let staffData = null;
        if (staffResponse && 
            staffResponse.response && 
            staffResponse.response.records && 
            Array.isArray(staffResponse.response.records)) {
          staffData = staffResponse.response.records.find(staff => staff.staff_id === staffId);
        }

        if (staffData) {
          setFormData({
            username: staffData.username || '',
            name: staffData.name || '',
            email: staffData.email || '',
            role_id: staffData.role_id || '',
            status_deleted: staffData.status_deleted || '0' // Set status_deleted from server data or default to '0'
          });
        } else {
          setError('Data staff tidak ditemukan.');
        }

        // Fetch role list
        const rolesResponse = await getRoleList();
        if (rolesResponse && Array.isArray(rolesResponse.response)) {
          setRoles(rolesResponse.response);
        } else {
          console.error('Invalid roles data format:', rolesResponse);
        }

      } catch (error) {
        console.error('Gagal mengambil data:', error);
        setError('Gagal mengambil data. Silakan coba lagi.');
      } finally {
        setLoadingData(false);
      }
    };

    if (staffId) {
      loadData();
    }
  }, [staffId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Call the updateStaff service function
      const response = await updateStaff(staffId, {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        role_id: parseInt(formData.role_id, 10) || formData.role_id, // Ensure role_id is sent in the correct format
        status_deleted: formData.status_deleted // Include status_deleted in the update
      }
    );
      
      // Show success message
      alert('Staff berhasil diupdate!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error updating staff:', error);
      setError('Gagal mengupdate staff. Periksa input Anda dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700">Memuat data staff...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Edit Staf</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-gray-600 mb-1">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm text-gray-600 mb-1">Nama</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="role_id" className="block text-sm text-gray-600 mb-1">Role</label>
            <select
              id="role_id"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="">-- Pilih Role --</option>
              {roles.map(role => (
                <option key={role.role_id} value={role.role_id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status_deleted" className="block text-sm text-gray-600 mb-1">Status Deleted</label>
            <select
              id="status_deleted"
              name="status_deleted"
              value={formData.status_deleted}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStaffForm;