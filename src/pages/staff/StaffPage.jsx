import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Search, Filter, RefreshCw, ChevronDown, ChevronUp, User, Mail, Key, X } from 'lucide-react';
import { fetchStaffList, deleteStaff } from '../../service/staff.service';
import Swal from 'sweetalert2';

// Import the child components
import DetailStaff from './StaffDetail';
import UpdateStaffForm from './StaffUpdate';
import CreateStaffForm from './StaffInput';

const Staff = () => {
  // State for staff data and pagination
  const [staffData, setStaffData] = useState({
    records: [],
    page: {
      total_record_count: 0,
      maxPage: 1,
      batch_number: 1,
      raw_length: 0,
      max_raw_size: 5
    }
  });
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  
  // State for popup modals
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showAddStaffPopup, setShowAddStaffPopup] = useState(false);
  
  // Available roles mapping
  const roles = [
    { id: 1, name: 'Direktur' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'Supervisor' },
    { id: 4, name: 'Trainer' },
    { id: 5, name: 'Admin' }
  ];

  // Load staff data - wrapped in useCallback to prevent infinite re-renders
  const loadStaffData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchStaffList({
        batch: currentBatch,
        size: 5,
        search: searchQuery,
        status_deleted: activeFilter,
        role_id: roleFilter
      });
      
      setStaffData(response.response);
    } catch (err) {
      setError('Failed to load staff data. Please try again.');
      console.error('Error loading staff data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentBatch, searchQuery, activeFilter, roleFilter]);

  // Load data on initial render and when dependencies change
  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  // Function to handle filter application
  const applyFilters = () => {
    setCurrentBatch(1); // Reset to first page when applying filters
    loadStaffData();
  };

  // Function to reset filters
  const resetFilters = () => {
    setActiveFilter('');
    setRoleFilter('');
    setSearchQuery('');
    setCurrentBatch(1);
    // Wait for state updates to finish, then load data
    setTimeout(() => loadStaffData(), 0);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (currentBatch < staffData.page.maxPage) {
      setCurrentBatch(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentBatch > 1) {
      setCurrentBatch(prev => prev - 1);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentBatch(pageNumber);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const handleUpdateSuccess = () => {
    // Reload the staff list after successful update
    loadStaffData();
  };
  
  // Update staff
  const handleUpdateClick = (staffId) => {
    setSelectedStaffId(staffId);
    setShowUpdateForm(true);
  };

  // Function to handle staff detail click
  const handleStaffClick = (staffId) => {
    setSelectedStaffId(staffId);
    setShowDetailPopup(true);
  };
  
  // Function to close detail popup
  const handleClosePopup = () => {
    setShowDetailPopup(false);
    setSelectedStaffId(null);
  };

  // Function to handle delete staff click
  const handleDeleteStaffClick = async (staff_id) => {
  try {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the staff member.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (confirmResult.isConfirmed) {
      const result = await deleteStaff({ staff_id });

      await Swal.fire({
        title: 'Deleted!',
        text: 'Staff successfully deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      resetFilters();
      return result;
    }
  } catch (error) {
    Swal.fire({
      title: 'Error',
      text: 'Failed to delete staff: ' + error.message,
      icon: 'error',
    });
  }
};


  // Function to handle add staff button click
  const handleAddStaff = () => {
    setShowAddStaffPopup(true);
  };

  // Function to handle successful staff creation
  const handleStaffCreationSuccess = () => {
    resetFilters(); // Refresh the staff list
    setShowAddStaffPopup(false);
  };

  // Function to generate pagination buttons
  const renderPaginationButtons = () => {
    const totalPages = staffData.page.maxPage;
    const currentPage = currentBatch;
    let pages = [];

    // If we have 7 or fewer pages, show all page buttons
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // We have many pages, so we need to show a subset
      pages.push(1);

      if (currentPage < 5) {
        pages.push(2, 3, 4, 5, '...', totalPages);
      }
      else if (currentPage > totalPages - 4) {
        pages.push('...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      }
      else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, index) => 
      page === '...' ? (
        <span 
          key={`ellipsis-${index}`}
          className="relative inline-flex items-center px-3 py-2 border border-gray-200 bg-white text-gray-400 text-sm"
        >
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`relative inline-flex items-center justify-center w-10 h-10 border text-sm font-medium transition-all ${
            currentPage === page 
              ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      )
    );
  };

  // Get role label styling
  const getRoleBadgeStyle = (roleName) => {
    switch(roleName) {
      case 'Direktur':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'Manager':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'Supervisor':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Trainer':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="bg-black-50 min-h-screen">
      <div className=" ">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Modern Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Staff Management</h1>
                <p className="text-blue-100 mt-1">View, add and manage your team members</p>
              </div>
              {staffData.permissions?.canCreate && (
              <button 
                onClick={handleAddStaff}
                className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-medium transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Add Staff</span>
              </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-5 border-b border-gray-100">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email or username..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Filter controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Role Filter */}
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <select 
                    className="block w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <select
                    className="block w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex ml-auto gap-2">
                <button 
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all"
                >
                  <RefreshCw size={16} />
                  <span>Reset</span>
                </button>
                <button 
                  onClick={applyFilters}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Filter size={16} />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-sm text-gray-500">Loading staff data...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
              <div className="mr-3 flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>{error}</div>
            </div>
          )}

          {/* Table Section */}
          
          {!isLoading && !error && (
  <>
        {/* Mobile Card View */}
        <div className="block md:hidden p-4 space-y-4">
          {staffData.records && staffData.records.length > 0 ? (
            staffData.records.map((staff, index) => (
              <div key={staff.staff_id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold text-gray-800">{staff.name}</h2>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    staff.status_deleted === 1 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.status_deleted === 1 ? 'active' : 'not active'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  <strong>Username:</strong> {staff.username}
                </p>
                <p className="text-sm text-gray-600 mb-1 truncate max-w-xs">
                  <strong>Email:</strong> <span className="truncate inline-block max-w-[10rem] align-bottom">{staff.email}</span>
                </p>

                <p className="text-sm text-gray-600 mb-1">
                  <strong>Role:</strong> {staff.role.name}
                </p>

                <div className="flex justify-end gap-2 mt-4">
                  {/* Tombol View jika user memiliki hak baca */}
                   {staffData.permissions?.canRead && (
                    <button 
                      onClick={() => handleStaffClick(staff.staff_id)}
                      className="text-blue-500 hover:text-gray-900 px-2 py-1 rounded text-xs"
                      title="View"
                    >
                      <Eye size={14} />
                    </button>
                  )}

                  {/* Tombol Edit jika user memiliki hak edit */}
                   {staffData.permissions?.canUpdate && (
                    <button 
                      onClick={() => handleUpdateClick(staff.staff_id)}
                      className="text-yellow-500 hover:text-blue-900 px-2 py-1 rounded text-xs"
                      title="Edit"
                    >   
                      <Edit size={14} />
                    </button>
                  )}

                  {/* Tombol Delete jika user memiliki hak hapus */}
                   {staffData.permissions?.canDelete && (
                    <button 
                      onClick={() => handleDeleteStaffClick(staff.staff_id)}
                      disabled={staff.status_deleted === 0}
                      className={`px-2 py-1 rounded text-xs ${
                        staff.status_deleted === 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-500 hover:text-red-900'
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">
              Tidak ada data staf
            </div>
          )}
        </div>


        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th scope="col" className="px-1 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-1 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th scope="col" className="px-1 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-1 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-1 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-1 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {staffData.records && staffData.records.length > 0 ? (
                        staffData.records.map((staff, index) => (
                          <tr key={staff.staff_id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              {((currentBatch - 1) * staffData.page.max_raw_size) + index + 1}
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-9 w-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                  <User size={16} />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-normal truncate inline-block max-w-[8rem] align-bottom text-gray-900">{staff.name}</div>
                                  
                                </div>
                              </div>
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span>{staff.username}</span>
                              </div>
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getRoleBadgeStyle(staff.role.name)}`}>
                                {staff.role.name}
                              </span>
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <p className="text-sm text-gray-600 mb-1 truncate max-w-xs">
                                 <span className="truncate inline-block max-w-[8rem] align-bottom">{staff.email}</span>
                                </p>
                              </div> 
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                                staff.status_deleted === 1 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {staff.status_deleted === 1 ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-center gap-2">
                                {/* View */}
                                {staffData.permissions?.canRead && (
                                  <button 
                                    onClick={() => handleStaffClick(staff.staff_id)}
                                    className="inline-flex items-center text-blue-500 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                    title="View details"
                                  >
                                    <Eye size={14} className="mr-1" />
                                  </button>
                                )}

                                {/* Edit */}
                                {staffData.permissions?.canUpdate && (
                                  <button 
                                    onClick={() => handleUpdateClick(staff.staff_id)}
                                    className="inline-flex items-center text-blue-500 hover:text-blue-900 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                    title="Update staff"
                                  >
                                    <Edit size={14} className="mr-1" />
                                  </button>
                                )}

                                {/* Delete */}
                                {staffData.permissions?.canDelete && (
                                  <button 
                                    onClick={() => handleDeleteStaffClick(staff.staff_id)}
                                    disabled={staff.status_deleted === 0}
                                    className={`inline-flex items-center px-2 py-1 rounded-lg text-xs transition-colors ${
                                      staff.status_deleted === 0 
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-red-500 hover:text-red-700'
                                    }`}
                                    title={staff.status_deleted === 0 ? "Cannot delete inactive staff" : "Delete staff"}
                                  >
                                    <Trash2 size={14} className="mr-1" />
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-3 py-10 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <div className="bg-gray-100 p-4 rounded-full mb-3">
                                <User size={24} className="text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium">No staff members found</p>
                              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or add a new staff member</p>
                              {staffData?.records?.permissions?.canCreate === true && !isLoading && (
                              <button 
                                onClick={handleAddStaff}
                                  className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all"
                                >
                                <Plus size={16} />
                                <span>Add Staff</span>
                              </button>

                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  
          </div>
        </div>
        {staffData.records && staffData.records.length > 0 && (
          <div className="bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              <p>
                Showing <span className="font-medium">{((currentBatch - 1) * staffData.page.max_raw_size) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentBatch * staffData.page.max_raw_size, staffData.page.total_record_count)}
                </span> of{' '}
                <span className="font-medium">{staffData.page.total_record_count}</span> results
              </p>
            </div>
            <div className="flex justify-center">
              <nav className="relative z-0 inline-flex rounded-lg shadow-sm" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentBatch === 1}
                  className={`relative inline-flex items-center justify-center h-10 w-10 rounded-l-lg border border-gray-200 bg-white ${
                    currentBatch === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
                
                {renderPaginationButtons()}
                
                <button
                  onClick={handleNextPage}
                  disabled={currentBatch >= staffData.page.maxPage}
                  className={`relative inline-flex items-center justify-center h-10 w-10 rounded-r-lg border border-gray-200 bg-white ${
                    currentBatch >= staffData.page.maxPage
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </>
      )}

 </div>
 </div>
           
      {/* Modals - Staff Detail Popup */}
      {showDetailPopup && selectedStaffId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        
            <div className="p-6 border-b flex justify-between items-center">
       
              <button 
                onClick={handleClosePopup} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <DetailStaff 
                staffId={selectedStaffId} 
                onClose={handleClosePopup} 
              />
            </div>
        
        </div>
      )}

      {/* Add Staff Popup Form */}
      {showAddStaffPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
         
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add New Staff</h2>
              <button 
                onClick={() => setShowAddStaffPopup(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <CreateStaffForm 
                onClose={() => setShowAddStaffPopup(false)} 
                onSuccess={handleStaffCreationSuccess} 
              />
            </div>
        </div>
      )}

      {/* Update Staff Form */}
      {showUpdateForm && selectedStaffId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
         
          <div className="p-6 border-b flex justify-between items-center">
              
            <button 
              onClick={() => setShowUpdateForm(false)} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
            </button>
          </div>
          <div className="p-6">
            <UpdateStaffForm
              staffId={selectedStaffId}
              onClose={() => setShowUpdateForm(false)}
              onSuccess={handleUpdateSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;