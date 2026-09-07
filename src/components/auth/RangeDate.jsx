// import { useState, useEffect, useRef } from 'react';
// import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

// export default function DateRangePicker() {
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [nextMonth, setNextMonth] = useState(new Date().getMonth() + 1 > 11 ? 0 : new Date().getMonth() + 1);
//   const [nextYear, setNextYear] = useState(new Date().getMonth() + 1 > 11 ? new Date().getFullYear() + 1 : new Date().getFullYear());
//   const [activeStartDate, setActiveStartDate] = useState(null);
//   const [activeEndDate, setActiveEndDate] = useState(null);
//   const [tempStartDate, setTempStartDate] = useState(null);
//   const [tempEndDate, setTempEndDate] = useState(null);
//   const [today] = useState(new Date());
//   const [isMobile, setIsMobile] = useState(false);
  
//   const calendarRef = useRef(null);
//   const pickerRef = useRef(null);

//   // Check if screen is mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 1200);
//     };
    
//     checkMobile();
//     window.addEventListener('resize', checkMobile);
    
//     return () => {
//       window.removeEventListener('resize', checkMobile);
//     };
//   }, []);

//   // Function to ensure calendar is visible when opened
//   const ensureCalendarVisibility = () => {
//     if (calendarRef.current) {
//       const calendarRect = calendarRef.current.getBoundingClientRect();
//       const viewportHeight = window.innerHeight;
      
//       // Check if calendar bottom is beyond viewport
//       if (calendarRect.bottom > viewportHeight) {
//         // Calculate how much to scroll to make the calendar fully visible
//         // Add extra padding to ensure buttons are visible
//         const scrollAmount = window.pageYOffset + (calendarRect.bottom - viewportHeight) + 40;
        
//         // Scroll to make calendar visible
//         window.scrollTo({
//           top: scrollAmount,
//           behavior: 'smooth'
//         });
//       }
//     }
//   };

//   // Close calendar when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (calendarRef.current && !calendarRef.current.contains(event.target) && 
//           pickerRef.current && !pickerRef.current.contains(event.target)) {
//         setIsCalendarOpen(false);
//       }
//     }
    
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);
  
//   // Ensure calendar is visible when opened
//   useEffect(() => {
//     if (isCalendarOpen) {
//       // Small delay to ensure the calendar is rendered
//       setTimeout(ensureCalendarVisibility, 100);

//       // Attach scroll event listener to adjust position on scroll
//       window.addEventListener('scroll', ensureCalendarVisibility);
//       window.addEventListener('resize', ensureCalendarVisibility);
      
//       return () => {
//         window.removeEventListener('scroll', ensureCalendarVisibility);
//         window.removeEventListener('resize', ensureCalendarVisibility);
//       };
//     }
//   }, [isCalendarOpen]);
  
//   // Handle month/year navigation
//   const handlePrevMonth = () => {
//     setSelectedMonth(prev => {
//       const newMonth = prev - 1;
//       if (newMonth < 0) {
//         setSelectedYear(prevYear => prevYear - 1);
//         return 11;
//       }
//       return newMonth;
//     });
    
//     setNextMonth(prev => {
//       const newMonth = prev - 1;
//       if (newMonth < 0) {
//         setNextYear(prevYear => prevYear - 1);
//         return 11;
//       }
//       return newMonth;
//     });
//   };
  
//   const handleNextMonth = () => {
//     setSelectedMonth(prev => {
//       const newMonth = prev + 1;
//       if (newMonth > 11) {
//         setSelectedYear(prevYear => prevYear + 1);
//         return 0;
//       }
//       return newMonth;
//     });
    
//     setNextMonth(prev => {
//       const newMonth = prev + 1;
//       if (newMonth > 11) {
//         setNextYear(prevYear => prevYear + 1);
//         return 0;
//       }
//       return newMonth;
//     });
//   };
  
//   // Generate dates for calendar
//   const generateDates = (month, year) => {
//     const firstDay = new Date(year, month, 1).getDay();
//     const daysInMonth = new Date(year, month + 1, 0).getDate();
//     const prevMonthDays = new Date(year, month, 0).getDate();
    
//     const dates = [];
    
//     // Previous month days
//     for (let i = firstDay - 1; i >= 0; i--) {
//       dates.push({
//         date: new Date(year, month - 1, prevMonthDays - i),
//         isPrevMonth: true
//       });
//     }
    
//     // Current month days
//     for (let i = 1; i <= daysInMonth; i++) {
//       dates.push({
//         date: new Date(year, month, i),
//         isCurrentMonth: true
//       });
//     }
    
//     // Calculate remaining cells to fill (to make sure we have 6 rows)
//     const remainingDays = 42 - dates.length;
    
//     // Next month days
//     for (let i = 1; i <= remainingDays; i++) {
//       dates.push({
//         date: new Date(year, month + 1, i),
//         isNextMonth: true
//       });
//     }
    
//     return dates;
//   };
  
//   // Format date for display
//   const formatDate = (date) => {
//     if (!date) return '';
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   };
  
//   // Check if a date is selected
//   const isDateSelected = (date) => {
//     if (!tempStartDate || !tempEndDate) return false;
//     return date >= tempStartDate && date <= tempEndDate;
//   };
  
//   // Check if a date is the selected start date
//   const isStartDate = (date) => {
//     if (!tempStartDate) return false;
//     return date.getDate() === tempStartDate.getDate() && 
//            date.getMonth() === tempStartDate.getMonth() && 
//            date.getFullYear() === tempStartDate.getFullYear();
//   };
  
//   // Check if a date is the selected end date
//   const isEndDate = (date) => {
//     if (!tempEndDate) return false;
//     return date.getDate() === tempEndDate.getDate() && 
//            date.getMonth() === tempEndDate.getMonth() && 
//            date.getFullYear() === tempEndDate.getFullYear();
//   };
  
//   // Check if a date is today
//   const isToday = (date) => {
//     return date.getDate() === today.getDate() && 
//            date.getMonth() === today.getMonth() && 
//            date.getFullYear() === today.getFullYear();
//   };
  
//   // Handle date selection
//   const handleDateClick = (date) => {
//     if (!tempStartDate || (tempStartDate && tempEndDate)) {
//       // Start new selection
//       setTempStartDate(date);
//       setTempEndDate(null);
//     } else {
//       // Complete the selection
//       if (date < tempStartDate) {
//         setTempEndDate(tempStartDate);
//         setTempStartDate(date);
//       } else {
//         setTempEndDate(date);
//       }
//     }
//   };
  
//   // Apply selected date range
//   const applyDateRange = () => {
//     if (tempStartDate && tempEndDate) {
//       setActiveStartDate(tempStartDate);
//       setActiveEndDate(tempEndDate);
//       setStartDate(formatDate(tempStartDate));
//       setEndDate(formatDate(tempEndDate));
//       setIsCalendarOpen(false);
//     }
//   };
  
//   // Clear date selection
//   const clearDateRange = () => {
//     setTempStartDate(null);
//     setTempEndDate(null);
//     setActiveStartDate(null);
//     setActiveEndDate(null);
//     setStartDate('');
//     setEndDate('');
//   };
  
//   // Open calendar
//   const openCalendar = () => {
//     setIsCalendarOpen(true);
//     // Ensure visibility after a small delay to allow rendering
//     setTimeout(ensureCalendarVisibility, 100);
//   };
  
//   // Quick selection options
//   const quickSelections = [
//     { label: 'Today', handler: () => {
//       const today = new Date();
//       setTempStartDate(today);
//       setTempEndDate(today);
//     }},
//     { label: '7 Day', handler: () => {
//       const today = new Date();
//       const sevenDaysAgo = new Date();
//       sevenDaysAgo.setDate(today.getDate() - 6);
//       setTempStartDate(sevenDaysAgo);
//       setTempEndDate(today);
//     }},
//     { label: 'This month', handler: () => {
//       const today = new Date();
//       const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       setTempStartDate(firstDayOfMonth);
//       setTempEndDate(today);
//     }},
//     { label: 'Last month', handler: () => {
//       const today = new Date();
//       const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
//       setTempStartDate(firstDayOfLastMonth);
//       setTempEndDate(lastDayOfLastMonth);
//     }},
//     { label: 'This year', handler: () => {
//       const today = new Date();
//       const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
//       setTempStartDate(firstDayOfYear);
//       setTempEndDate(today);
//     }}
//   ];
  
//   // Day names
//   const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  
//   // Month names
//   const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
//   return (
//     <div className="relative w-full max-w-xl" ref={pickerRef}>
//       <div className="ml-2 text-sm font-medium text-gray-700"></div>
      
//       {/* Date input field */}
//       <div className="relative w-full">
//         <div 
//           className="flex items-center  w-full p-2 border border-gray-300 rounded-md cursor-pointer bg-white shadow-sm hover:border-blue-500 transition-colors duration-200"
//           onClick={openCalendar}
//         >
//           <Calendar size={16} className="mr-2 text-gray-600" />
//           <input 
//             type="text" 
//             value={startDate && endDate ? `${startDate} - ${endDate}` : ""}
//             readOnly
//             placeholder="DD/MM/YYYY - DD/MM/YYYY"
//             className="w-full text-gray-800 outline-none cursor-pointer placeholder-gray-600 text-sm"
//           />
//           {(startDate || endDate) && (
//             <button 
//               onClick={(e) => {
//                 e.stopPropagation();
//                 clearDateRange();
//               }}
//               className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
//             >
//               <X size={16} className="text-gray-500" />
//             </button>
//           )}
//         </div>
        
//         {/* Date picker popup - Positioned to ensure full visibility */}
//         {isCalendarOpen && (
//           <div 
//             ref={calendarRef}
//             className="fixed z-50 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
//             style={{ 
//               maxHeight: '90vh',
//               overflowY: 'auto',
//               width: isMobile ? 'calc(100% - 32px)' : 'auto',
//               minWidth: isMobile ? 'auto' : '600px',
//               left: '50%',
//               top: '50%',
//               transform: 'translate(-50%, -50%)'
//             }}
//           >
//             <div className="flex flex-col">
//               {/* Quick selection options - Horizontal scrolling for mobile */}
//               <div className="w-full mb-4 border-b border-gray-200 pb-4">
//                 <div className="flex overflow-x-auto pb-2">
//                   {quickSelections.map((option, idx) => (
//                     <button
//                       key={idx}
//                       onClick={option.handler}
//                       className={`flex-shrink-0 text-left py-2 px-3 mb-1 mr-2 rounded text-sm transition-colors duration-150 ${
//                         idx === 0 
//                           ? 'bg-blue-500 text-white hover:bg-blue-600' 
//                           : 'hover:bg-gray-100 text-gray-700 border border-gray-200'
//                       }`}
//                     >
//                       {option.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
              
//               {/* Calendar view */}
//               <div className="w-full">
//                 <div className="flex items-center justify-between mb-4">
//                   <button 
//                     onClick={handlePrevMonth}
//                     className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-150"
//                   >
//                     <ChevronLeft size={20} />
//                   </button>
                  
//                   {isMobile ? (
//                     <div className="text-center font-medium text-gray-800">
//                       {monthNames[selectedMonth]} {selectedYear}
//                     </div>
//                   ) : (
//                     <div className="flex space-x-8 md:space-x-16 lg:space-x-24">
//                       <div className="text-center font-medium text-gray-800">
//                         {monthNames[selectedMonth]} {selectedYear}
//                       </div>
//                       <div className="text-center font-medium text-gray-800">
//                         {monthNames[nextMonth]} {nextYear}
//                       </div>
//                     </div>
//                   )}
                  
//                   <button 
//                     onClick={handleNextMonth}
//                     className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-150"
//                   >
//                     <ChevronRight size={20} />
//                   </button>
//                 </div>
                
//                 {/* Calendar grids - Stack on mobile, side-by-side on desktop */}
//                 <div className="flex flex-col md:flex-row md:gap-4">
//                   {/* First month */}
//                   <div className="flex-1 mb-6 md:mb-0">
//                     <div className="grid grid-cols-7 gap-1 mb-2">
//                       {dayNames.map((day, idx) => (
//                         <div 
//                           key={idx} 
//                           className={`text-center text-xs font-medium py-1 ${
//                             idx === 6 ? 'text-red-500' : 'text-gray-500'
//                           }`}
//                         >
//                           {day}
//                         </div>
//                       ))}
//                     </div>
                    
//                     <div className="grid grid-cols-7 gap-1">
//                       {generateDates(selectedMonth, selectedYear).slice(0, 42).map((item, idx) => (
//                         <div 
//                           key={idx}
//                           onClick={() => handleDateClick(item.date)}
//                           className={`
//                             text-center p-1 text-sm cursor-pointer rounded-full transition-colors duration-150
//                             ${!item.isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-100'}
//                             ${isDateSelected(item.date) && !isStartDate(item.date) && !isEndDate(item.date) 
//                               ? 'bg-blue-100' : ''}
//                             ${isStartDate(item.date) ? 'bg-blue-500 text-white' : ''}
//                             ${isEndDate(item.date) ? 'bg-blue-500 text-white' : ''}
//                             ${isToday(item.date) && !isStartDate(item.date) && !isEndDate(item.date) 
//                               ? 'ring-1 ring-blue-400' : ''}
//                           `}
//                         >
//                           {item.date.getDate()}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
                  
//                   {/* Second month - Only shown on desktop or when navigated to on mobile */}
//                   {(!isMobile) && (
//                     <div className="flex-1">
//                       <div className="grid grid-cols-7 gap-1 mb-2">
//                         {dayNames.map((day, idx) => (
//                           <div 
//                             key={idx} 
//                             className={`text-center text-xs font-medium py-1 ${
//                               idx === 6 ? 'text-red-500' : 'text-gray-500'
//                             }`}
//                           >
//                             {day}
//                           </div>
//                         ))}
//                       </div>
                      
//                       <div className="grid grid-cols-7 gap-1">
//                         {generateDates(nextMonth, nextYear).slice(0, 42).map((item, idx) => (
//                           <div 
//                             key={idx}
//                             onClick={() => handleDateClick(item.date)}
//                             className={`
//                               text-center p-1 text-sm cursor-pointer rounded-full transition-colors duration-150
//                               ${!item.isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-100'}
//                               ${isDateSelected(item.date) && !isStartDate(item.date) && !isEndDate(item.date) 
//                                 ? 'bg-blue-100' : ''}
//                               ${isStartDate(item.date) ? 'bg-blue-500 text-white' : ''}
//                               ${isEndDate(item.date) ? 'bg-blue-500 text-white' : ''}
//                               ${isToday(item.date) && !isStartDate(item.date) && !isEndDate(item.date) 
//                                 ? 'ring-1 ring-blue-400' : ''}
//                             `}
//                           >
//                             {item.date.getDate()}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
//                 {/* Selected date display */}
//                 {(tempStartDate || tempEndDate) && (
//                   <div className="mt-4 p-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600">
//                     <span className="font-medium">Selected: </span>
//                     {tempStartDate && formatDate(tempStartDate)}
//                     {tempStartDate && tempEndDate && " - "}
//                     {tempEndDate && formatDate(tempEndDate)}
//                   </div>
//                 )}
                
//                 {/* Action buttons */}
//                 <div className="flex justify-end mt-4 space-x-2">
//                   <button 
//                     onClick={() => {
//                       setIsCalendarOpen(false);
//                       setTempStartDate(activeStartDate);
//                       setTempEndDate(activeEndDate);
//                     }}
//                     className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors duration-150"
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     onClick={applyDateRange}
//                     className={`px-4 py-2 text-sm text-white rounded-md transition-colors duration-150 ${
//                       !tempStartDate || !tempEndDate 
//                         ? 'bg-blue-300 cursor-not-allowed' 
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     }`}
//                     disabled={!tempStartDate || !tempEndDate}
//                   >
//                     Apply
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }