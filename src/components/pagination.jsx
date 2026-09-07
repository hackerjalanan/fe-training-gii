import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentBatch, 
  maxPage, 
  totalRecords, 
  onPageChange, 
  pageSize, 
  loading 
}) => {
  // Calculate page numbers to display
  const getPageNumbers = () => {
    // Always show current page and at most 2 pages on each side
    const pageRange = 2;
    let startPage = Math.max(1, currentBatch - pageRange);
    let endPage = Math.min(maxPage, currentBatch + pageRange);
    
    // Adjust if we're at the beginning or end
    if (currentBatch <= pageRange) {
      endPage = Math.min(maxPage, startPage + pageRange * 2);
    }
    
    if (currentBatch + pageRange >= maxPage) {
      startPage = Math.max(1, endPage - pageRange * 2);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page === currentBatch || page < 1 || page > maxPage || loading) return;
    onPageChange(page);
  };
  
  const pages = getPageNumbers();
  
  return (
    <div className="flex flex-col items-center  ">
      {/* Page info */}
      <div className="text-sm text-gray-600">
        Menampilkan {Math.min(pageSize, totalRecords - (currentBatch - 1) * pageSize)} dari {totalRecords} data
      </div>
      
      {/* Pagination controls */}
      <div className="flex space-x-1">
        {/* Previous button */}
        <button 
          onClick={() => handlePageChange(currentBatch - 1)}
          disabled={currentBatch === 1 || loading}
          className={`flex items-center justify-center  py-1 rounded-md ${
            currentBatch === 1 || loading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        
        {/* First page button if not in view */}
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded-md text-blue-600 hover:bg-blue-50"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="px-2 py-1 text-gray-500">...</span>
            )}
          </>
        )}
        
        {/* Page numbers */}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-md ${
              page === currentBatch
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        {/* Last page button if not in view */}
        {pages[pages.length - 1] < maxPage && (
          <>
            {pages[pages.length - 1] < maxPage - 1 && (
              <span className="px-2 py-1 text-gray-500">...</span>
            )}
            <button
              onClick={() => handlePageChange(maxPage)}
              className="px-3 py-1 rounded-md text-blue-600 hover:bg-blue-50"
            >
              {maxPage}
            </button>
          </>
        )}
        
        {/* Next button */}
        <button 
          onClick={() => handlePageChange(currentBatch + 1)}
          disabled={currentBatch === maxPage || loading}
          className={`flex items-center justify-center px-3 py-1 rounded-md ${
            currentBatch === maxPage || loading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
    </div>
  );
};

export default Pagination;