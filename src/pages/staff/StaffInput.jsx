import React, { useState, useEffect } from 'react';
import { createStaff } from '../../service/staff.service';
import { getRoleList } from '../../service/master-data.service';

const CreateStaffForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role_id: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load roles data on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const response = await getRoleList(); // Tidak perlu size
        if (Array.isArray(response.response)) {
          setRoles(response.response); // langsung isi array ke state
        } else {
          setError('Data role tidak valid.');
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
        setError('Gagal mengambil data role. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

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
      // Call the createStaff service function
      const response = await createStaff({
        username: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_id: formData.role_id
      });
      
      // Show success message
      alert('Staf berhasil ditambahkan!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error creating staff:', error);
      setError('Failed to create staff. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      // onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
        // onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Tambah Staf</h2>
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
            <label htmlFor="password" className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="role_id" className="block text-sm text-gray-600 mb-1">Role</label>
            {loading && roles.length === 0 ? (
              <div className="flex items-center text-sm text-gray-500">
                <div className="mr-2 h-4 w-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                Loading roles...
              </div>
            ) : (
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
            )}
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

export default CreateStaffForm;