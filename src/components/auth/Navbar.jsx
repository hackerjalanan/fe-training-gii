import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  Mail, 
  User, 
  BarChart2, 
  Users, 
  FileText, 
  CalendarCheck,
  Home, 
  BookOpen, 
  ClipboardList, 
  PieChart, 
  UserCog 
} from 'lucide-react';

// Menu access based on role (case insensitive comparison)
const menuAccess = {
  'Dashboard': ['Supervisor', 'Direktur', 'Manager', 'trainer','Admin'],
  'ReportInbox': ['Supervisor', 'Direktur', 'Manager', 'Admin'],
  'Report': [ 'Trainer'],
  'Participant':  ['Supervisor', 'Direktur', 'Manager', 'Trainer','Admin'],
  'Staff': ['Supervisor', 'Direktur', 'Manager'],
  'Training': ['Supervisor','Manager', 'Trainer', 'Direktur','Admin'],
  'Presensi': ['Supervisor','Manager', 'Trainer', 'Direktur','Admin'],
  'ReportType': ['Supervisor'],
  'Statistic': ['Supervisor', 'Direktur', 'Manager', 'Admin']
};

const Navbar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [userProfile, setUserProfile] = useState({
    name: 'Loading...',
    role_name: '...',
    email: '...'
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update profile information when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserProfile({
        name: currentUser.name || 'User',
        role_name: currentUser.role_name || 'Role',
        email: currentUser.email || 'email@example.com'
      });
    }
  }, [currentUser]);

  // Add window resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 1115);
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check if user has access to specific menu
  const hasAccess = (menuName) => {
    if (!currentUser || !currentUser.role_name) return false;
    return menuAccess[menuName]?.includes(currentUser.role_name.toLowerCase()) || false;
  };

  // Menu items with improved icons that better match their function
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'ReportInbox', path: '/reports/inbox', icon: <ClipboardList size={18} /> },
    { name: 'Report', path: '/reports', icon: <ClipboardList size={18} /> },
    { name: 'Participant', path: '/participants', icon: <Users size={18} /> },
    { name: 'Staff', path: '/staff', icon: <UserCog size={18} /> },
    { name: 'Training', path: '/training', icon: <BookOpen size={18} /> },
    { name: 'Presensi', path: '/presensi', icon: <CalendarCheck size={18} /> },
    { name: 'ReportType', path: '/report-type', icon: <BookOpen size={18} /> },
    { name: 'Statistic', path: '/dashboard/training', icon: <PieChart size={18} /> },  
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-56'} bg-black-100 border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-2' : 'p-5'} border-b border-gray-200 flex flex-col items-center`}>
        <div className={`${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'} rounded-full bg-gray-200 mb-3 flex items-center justify-center overflow-hidden`}>
          <User size={isCollapsed ? 20 : 32} className="text-gray-600" />
        </div>
        {!isCollapsed && (
          <div className="text-center">
            <div className="font-medium text-gray-800 mb-1">{userProfile.name}</div>
            <div className="text-sm text-gray-600 mb-1">{userProfile.role_name}</div>
            <div className="text-xs text-gray-500 break-words">{userProfile.email}</div>
          </div>
        )}
      </div>
      
      <nav className="flex flex-col py-3 flex-grow">
        {menuItems.map((item) => 
          hasAccess(item.name) ? (
            <Link 
              key={item.path} 
              to={item.path} 
              title={isCollapsed ? item.name : ''}
              className={`flex ${isCollapsed ? 'justify-center' : 'items-center px-5'} py-3 text-gray-700 hover:bg-gray-200 transition-colors duration-200 border-l-4 ${
                currentPath === item.path
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-transparent'
              }`}
            >
              <span className={isCollapsed ? '' : 'mr-3'} >
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          ) : null
        )}
      </nav>
    </div>
  );
};

export default Navbar;