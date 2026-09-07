import React, { useState, useEffect} from 'react';
import { Link, useNavigate, useLocation  } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Menu,
  X,
  CalendarCheck ,
  ChevronDown,
  Activity,
  Inbox, LogOut , User, ChevronUp,
  Layout,
  Dashboard,
  FileText,
  Users,
  BarChart,
  Home,
  Send,
  UserCheck,
  GraduationCap,
  UserCog,
  NotebookPen
} from 'lucide-react';

import ProfilePopup from "./Profil-page";
import { useAuth } from '../../context/AuthContext';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isCompactSidebar, setIsCompactSidebar] = useState(window.innerWidth <= 1254);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  // Function to reset captcha/turnstile
  const resetCaptcha = () => {
    try {
      // Reset Turnstile widget jika ada
      if (window.turnstile) {
        window.turnstile.reset();
        console.log('Turnstile widget reset successfully');
      }
      
      // Reset reCAPTCHA jika menggunakan Google reCAPTCHA
      if (window.grecaptcha) {
        window.grecaptcha.reset();
        console.log('reCAPTCHA widget reset successfully');
      }
      
      // Hapus token captcha dari storage
      localStorage.removeItem('captcha_token');
      localStorage.removeItem('turnstile_token');
      localStorage.removeItem('recaptcha_token');
      sessionStorage.removeItem('captcha_token');
      sessionStorage.removeItem('turnstile_token');
      sessionStorage.removeItem('recaptcha_token');
      
      // Bersihkan form data yang mungkin tersimpan
      const loginForm = document.querySelector('form[name="loginForm"]');
      if (loginForm) {
        loginForm.reset();
      }
      
    } catch (error) {
      console.warn('Error resetting captcha:', error);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of your session.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log me out',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Reset captcha sebelum logout
        resetCaptcha();
        
        // Logout user
      logout().then(() => {
        // navigasi setelah logout selesai
        navigate('/login');
        resetCaptcha();
        setTimeout(() => window.location.reload(), 800);
      });

        
        // Tunggu sebentar untuk memastikan logout selesai, lalu reset captcha lagi
        setTimeout(() => {
          resetCaptcha();
        }, 100);
        
        // Navigate ke login
        navigate('/login');
        
        // Reset captcha sekali lagi setelah navigate untuk memastikan
        setTimeout(() => {
          resetCaptcha();
        }, 500);
        
        // Refresh halaman login setelah navigate
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsProfileDropdownOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect untuk memantau perubahan route dan reset captcha jika diperlukan
  useEffect(() => {
    // Jika user baru saja logout dan berada di halaman login
    if (location.pathname === '/login' && !user) {
      // Reset captcha setelah beberapa saat untuk memastikan halaman login sudah ter-render
      const timeoutId = setTimeout(() => {
        resetCaptcha();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, user]);

  // Optional: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.relative')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const userRole = user?.role_name || 'staff';

  const getNavLinks = () => {

  const links = [
    { to: '/dashboard', label: 'Beranda', icon: Home, roles: ['Supervisor', 'Direktur', 'Manager', 'Trainer','Admin'] },
    { to: '/reports/inbox', label: 'Laporan masuk', icon: Inbox, roles: ['Supervisor', 'Direktur', 'Manager' , 'Admin'] },
    { to: '/reports', label: 'Laporan Terkirim', icon: Send, roles: [ 'Trainer' ] },
    { to: '/participants', label: 'Peserta', icon: Users, roles: [ 'Direktur', 'Manager', 'Trainer' ,'Admin'] },
    { to: '/presensi', label: 'Presensi', icon: CalendarCheck , roles: ['Direktur', 'Manager', 'Trainer' ,'Admin'] },
    { to: '/staff', label: 'Staf', icon: UserCheck, roles: ['Supervisor', 'Direktur', 'Manager'] },
    { to: '/training', label: 'Pelatihan', icon: GraduationCap, roles: ['Supervisor','Trainer', 'Manager', 'Direktur', 'Admin'] },
    { to: '/report-type', label: 'Jenis Laporan', icon: Inbox, roles: ['Supervisor'] },
    { to: '/dashboard/training', label: 'Statistic', icon: Activity , roles: ['Direktur', 'Manager', 'Supervisor' ,'Admin'] },
  ];
    return links.filter(link => link.roles.includes(userRole));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsCompactSidebar(window.innerWidth <= 1254);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('#sidebar');
      const menuToggle = document.querySelector('#menu-toggle');
      const userDropdown = document.querySelector('#user-dropdown');
      const userDropdownToggle = document.querySelector('#user-dropdown-toggle');

      if (
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target) &&
        menuToggle &&
        !menuToggle.contains(event.target)
      ) {
        setSidebarOpen(false);
      }

      if (
        dropdownOpen &&
        userDropdown &&
        !userDropdown.contains(event.target) &&
        userDropdownToggle &&
        !userDropdownToggle.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, dropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen && isMobile ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [sidebarOpen, isMobile]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleDropdown = () => setDropdownOpen(prev => !prev);

  return (
    <div className="flex   flex-col min-h-screen bg-[aliceblue]">
      {/* Full-width white header */}
      <header className="w-full md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-md">
        <div className="flex items-center">
          <div className="ml-2 md:ml-0">
            <img src="/logo-GI.png" alt="Logo" className="h-8 md:h-10" />
           
          </div>
        </div>
        
        <div className="relative">
          {user && (
          <div className="flex items-center">
            <button
              id="user-dropdown-toggle"
              onClick={toggleDropdown}
              className="flex items-center text-xspx-3 py-0 rounded-md  transition-colors w-28"
            >
              {/* Foto Profil */}
              <div className="flex flex-col mb-2 justify-start">
                {/* Nama */}
                <span className="truncate text-right text-gray-700 px-2 py-0 rounded-full text-medium mt-0">
                  {user.name}</span>

                {/* Role */}
                <span className=" text-right text-gray-700 px-2 py-0rounded-full text-[10px] mt-0">
                  {userRole}
                </span>
              </div>
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center mb-1 bg-gray-300  hover:bg-slate-400">
                {user.image ? (
                  <img src={user.image} alt="Profile" className="w-full h-full object-cover " />
                ) : (
                  <span className="text-xl font-semibold text-gray-600">
                    {user.name?.[0].toUpperCase()}
                  </span>
                )}
              </div>

            </button>
      {/* Dropdown */}
      {dropdownOpen && (
        <div
          id="user-dropdown"
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-50 overflow-hidden"
        >
          {/* Mobile-only Info */}
          <div className="px-4 py-2 border-b border-gray-200 sm:hidden flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-gray-700">
                  {user.name?.[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          </div>

          {/* Logout */}
          <div className="py-1 ">

            <button
              onClick={() => {
                setIsProfileDropdownOpen(false);
                setIsProfilePopupOpen(true); // Buka popup profil
              }}
               className="w-full flex items-center gap-2 px-4 py-2 text-sm text-black-600 hover:bg-gray-100 transition-colors"
            >
              <User className="w-3 h-3" />
              Profil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <nav
          id="sidebar"
          className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-slate-800 text-white transform transition-all duration-300 ease-in-out flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCompactSidebar && !isMobile ? 'w-[72px]' : 'w-60'}
          `}
        >
          {/* Logo in sidebar for all views */}
          <div className="bg-grey flex items-center justify-center px-14  border-b border-white/20">
            {/* Logo untuk xl dan ke atas */}
          <img
            src="/landscape-logo-removebg-preview (1).png"
            alt="Logo"
            className=" w-15 h-15 object-cover object-center hidden xl:block rounded"
          />



            {/* Logo untuk ukuran < xl */}
            <img src="/239bc1c13de8a8c37e0888e1d7442ba7 (1).webp" alt="Logo" className="w-md block xl:hidden" />

            {/* {isMobile && (
              // <button
              //   className="md:hidden text-white p-1 rounded-full hover:bg-white/20"
              //   onClick={toggleSidebar}
              //   aria-label="Close menu"
              // >
              //   <X size={20} />
              // </button>
            )} */}
          </div>


          <div className="flex flex-col h-screen">
            {/* Logo in sidebar moved outside of scrollable area */}
            
            {/* Main content area with fixed height and proper scrolling */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Scrollable nav menu with flex-1 to take available space */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pt-4">
                <ul className="space-y-1">
                  {getNavLinks().map(link => {
                    const Icon = link.icon;
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                            location.pathname === link.to
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-200 hover:bg-white/10'
                          }`}
                        >
                          <Icon size={18} className="shrink-0" />
                          {!isCompactSidebar && <span>{link.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>


            {/* User info + Logout always at the bottom - not part of scrollable area */}
            {user && (
              <div className="sticky hidden sm:flex bottom-0 border-t border-white/20 bg-slate-800 px-4 py-4 mt-auto items-center justify-between">
                {!isCompactSidebar ? (
                  // Full sidebar - show profile info with dropdown
                  <div className="relative flex-1">
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center gap-3 w-full hover:bg-white/5 rounded-lg p-2 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.image ? (
                          <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold">
                            {user.name?.[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-300">{userRole}</p>
                      </div>
                      <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-700 rounded-lg shadow-lg border border-white/10 py-1 z-50">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsProfilePopupOpen(true); // Buka popup profil
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <User className="w-3 h-3" />
                          Pilih Profil
                        </button>
                        <hr className="border-white/10 my-0.5" />
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-3 h-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Compact sidebar - show only profile circle with dropdown
                  <div className="relative w-full">
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden mx-auto hover:bg-white/20 transition-colors"
                      title={user.name}
                    >
                      {user.image ? (
                        <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold">
                          {user.name?.[0].toUpperCase()}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu for Compact Mode */}
                    {isProfileDropdownOpen && (
                      <div
                        className="absolute bottom-full mb-2 bg-slate-700 rounded-lg shadow-lg border border-white/10 py-1 z-50 min-w-[140px]"
                        style={{
                          left: '100%',
                          transform: 'translateX(-30%)',
                        }}
                      >
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-xs font-medium text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-300">{userRole}</p>
                        </div>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsProfilePopupOpen(true); // Buka popup profil
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <User className="w-3 h-3" />
                          Pilih Profil
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-3 h-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom mobile navigation bar (visible outside sidebar) */}
        {isMobile && !sidebarOpen && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-800 shadow-lg z-40">
            <div className="flex justify-around px-2 py-2">
              {getNavLinks().map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                      location.pathname === link.to
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className="text-xs">{link.label.slice(0, 4)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {isProfilePopupOpen && (
          <ProfilePopup onClose={() => setIsProfilePopupOpen(false)} />
        )}

        {/* Overlay for mobile */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content - add bottom padding for mobile to account for navigation bar */}
        <main className={`flex-1 p-4 overflow-hidden ${isMobile ? 'pb-20' : ''}`}>
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;