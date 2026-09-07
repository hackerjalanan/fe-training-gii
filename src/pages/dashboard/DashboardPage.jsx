import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { fetchTrainingSesiList } from '../../service/training-sesi.service';
import { formatDatetime , formatDate, addMonths } from "../../utils/date.utils" ; 
import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchDachboardActivity, fetchDachboardtotaldata } from '../../service/dashboard.service';

// Tambahkan import ini di bagian atas file component Anda
import { 
  BookOpen, 
  Users, 
  Calendar, 
  CheckCircle, 
  Activity, 
  Clock,
  TrendingUp,
  Star,
  ArrowRight,
  Zap,
  UserPlus,
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalTrainings: 0,
    activeTrainings: 0,
    totalParticipants: 0,
    completedTrainings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // data training sesi
  const observer = useRef();

  const today = new Date();
  const defaultStartDate = formatDate(today);
  const defaultEndDate = formatDate(addMonths(today, 3));

  const lastElementRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setBatch((prev) => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch dashboard total data
  useEffect(() => {
    const loadTotalData = async () => {
      try {
        setStatsLoading(true);
        const res = await fetchDachboardtotaldata();
        
        if (res.response) {
          setStats({
            totalTrainings: res.response.totalTrainingSesi || 0,
            activeTrainings: res.response.totalTrainingActive || 0,
            totalReports: res.response.totalReport || 0,
            totalParticipants: res.response.totalParticipant || 0,
            completedTrainings: res.response.totalTrainingFinish || 0
          });
        }
      } catch (err) {
        console.error('Gagal mengambil total data dashboard:', err);
        // Keep default values if API fails
      } finally {
        setStatsLoading(false);
      }
    };

    loadTotalData();
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await fetchDachboardActivity();
        setActivities(res.response || []); // sesuaikan dengan struktur `successResponse`
      } catch (err) {
        console.error('Gagal mengambil aktivitas:', err);
      }
    };

    loadActivity();
  }, []);

  // Function to determine report route based on user role
  const getReportRoute = () => {
    if (user?.role_name === 'Trainer') {
      return '/reports';
    }
    return '/reports/inbox';
  };

  useEffect(() => {
    const loadTrainings = async () => {
      setLoading(true);
      try {
        const result = await fetchTrainingSesiList({
          training_sesi_id: "",
          search: "",
          start_date: defaultStartDate,
          end_date: defaultEndDate,
          batch,
          size: 5,
        });

        const newRecords = result.response.records || [];
        setTrainings((prev) => {
          const existingIds = new Set(prev.map(item => item.training_sesi_id));
          const filtered = newRecords.filter(item => !existingIds.has(item.training_sesi_id));
          return [...prev, ...filtered];
        });
        const totalRecords = result.response.page.total_record_count;
        if (trainings.length + newRecords.length >= totalRecords) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Failed to load training sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch]);

  // Welcome message based on role
  const getWelcomeMessage = () => {
    const userRole = user?.role_name || 'staff';

    switch (userRole) {
      case 'Direktur':
        return 'Selamat datang, Direktur! Anda memiliki akses penuh ke sistem.';
      case 'Manager':
        return 'Selamat datang, Manager! Lihat statistik terbaru dan laporan.';
      case 'Supervisor':
        return 'Selamat datang, Supervisor! Pantau progress pelatihan dan peserta.';
      case 'Trainer':
        return 'Selamat datang, Trainer! Kelola peserta pelatihan di sini.';
      case 'Admin':
        return 'Selamat datang, Admin! Kelola peserta pelatihan di sini.';
      default:
        return 'Selamat datang di Training Report System!';
    }
  };

  // Loading placeholder component for stats
  const StatCardSkeleton = () => (
    <div className="bg-white p-4 rounded-xl shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-12"></div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -30px, 0);
          }
          70% {
            transform: translate3d(0, -15px, 0);
          }
          90% {
            transform: translate3d(0, -4px, 0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out both;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out both;
        }

        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }

        .stat-card {
          animation: fadeInUp 0.6s ease-out both;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .activity-item {
          transition: all 0.3s ease;
          animation: slideInLeft 0.5s ease-out both;
        }

        .activity-item:hover {
          transform: translateX(8px);
          background-color: #f8fafc;
        }

        .table-row {
          animation: fadeInUp 0.5s ease-out both;
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background-color: #f1f5f9;
          transform: scale(1.01);
        }

        .training-header {
          animation: slideInRight 0.6s ease-out both;
        }

        .training-container {
          animation: fadeInUp 0.7s ease-out both;
        }

        .mobile-card {
          animation: slideInLeft 0.5s ease-out both;
        }
      `}</style>

      {/* Welcome Message - Reduced spacing */}
      <div className=" animate-fadeInUp mb-4">
        <div className="flex items-center">
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              Beranda
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">{getWelcomeMessage()}</p>
          </div>
        </div>
      </div>

      {/* Stats Container - Reduced gap and height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {statsLoading ? (
          // Loading state
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Stat Card - Pelatihan - Reduced height */}
            <Link to="/training">
              <div 
                className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg text-white h-32"
                style={{ animationDelay: '0s' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <BookOpen className="w-6 h-6 opacity-80" />
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-white text-xs font-medium mb-1 opacity-90">Pelatihan</h3>
                    <p className="text-3xl font-bold text-white">{stats.totalTrainings}</p>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Stat Card - Peserta - Reduced height */}
            <Link to="/participants">
              <div 
                className="stat-card bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg text-white h-32 flex flex-col"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-6 h-6 opacity-80" />
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-white text-xs font-medium mb-1 opacity-90">Peserta</h3>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-3xl font-bold text-white">{stats.totalParticipants}</p>
                </div>
              </div>
            </Link>
            
            {/* Stat Card - Report - Fixed routing based on role */}
            <Link to={getReportRoute()}>
              <div 
                className="stat-card bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white h-32 flex flex-col"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Activity className="w-6 h-6 opacity-80" />
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-white text-xs font-medium mb-1 opacity-90">Report</h3>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-3xl font-bold text-white">{stats.totalReports}</p>
                </div>
              </div>
            </Link>
            
            {/* Stat Card - Staff - Reduced height */}
            <Link to="/presensi">
              <div 
                className="stat-card bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg text-white h-32 flex flex-col"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-6 h-6 opacity-80" />
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-white text-xs font-medium mb-1 opacity-90">Presensi</h3>
                <div className="flex-1 flex flex-col justify-center">
                   <p className="text-3xl font-bold text-white">{stats.activeTrainings}</p>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Dashboard Content - Reduced gap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities - Reduced padding */}
        <div 
          className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeInUp"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Aktivitas Terbaru</h2>
          </div>
          
          <div className="space-y-2">
            {activities.length > 0 ? (
              activities.map((log, idx) => (
                <div 
                  key={idx}
                  className="activity-item flex items-start space-x-3 p-2 rounded-lg border-l-4 border-blue-500"
                  style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                       {formatDatetime(log.created_at)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Tidak ada aktivitas terbaru.</p>
              </div>
            )}
          </div>
        </div>

        {/* Training Sessions Table - Reduced padding */}
        <div className="training-container overflow-hidden bg-white rounded-xl shadow-lg border"
          style={{ animationDelay: '0.5s' }}
        >
          {/* Header - Reduced margin */}
          <div className="training-header flex items-center m-4 space-x-3"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Pelatihan yang Akan Datang</h2>
          </div>

          {/* Desktop Table - Reduced padding */}
          <div className="hidden md:block overflow-y-auto overflow-x-hidden max-h-[600px]">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 animate-slideInRight" 
                style={{ animationDelay: '0.7s' }}
              >
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 inline mr-2" /> Nama Pelatihan
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="w-3 h-4 inline mr-1" /> Tanggal
                  </th>
               
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trainings.length > 0 ? (
                  trainings.map((session, index) => (
                    <tr
                      key={session.training_sesi_id}
                      ref={index === trainings.length - 1 ? lastElementRef : null}
                      className="table-row group"
                      style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <BookOpen className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{session.name}</p>
                            <p className="text-xs text-gray-500">Pelatihan Online</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center text-gray-700 text-sm mb-1">
                          <Calendar className="w-3 h-3 text-green-500 mr-2" />
                          {new Date(session.start_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="w-3 h-3 text-green-600 mr-1" />
                          <span className="font-semibold text-gray-900">{session.total_participant}</span>
                          <span className="text-xs text-gray-500 ml-1">orang</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
                    <td colSpan="2" className="py-8 px-3 text-center">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Tidak ada pelatihan pada rentang waktu ini.</p>
                      <p className="text-gray-400 text-xs mt-1">Pelatihan baru akan muncul di sini</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Layout - Reduced padding */}
          <div className="block md:hidden">
            {trainings.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto p-2">
                {trainings.map((session, index) => (
                  <div
                    key={session.training_sesi_id}
                    className="mobile-card p-3 border border-gray-200 rounded-lg shadow-sm bg-white"
                    style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                  >
                    <p className="text-sm font-semibold text-gray-800 mb-1">{session.name}</p>
                    <p className="text-xs text-gray-500 mb-2">Pelatihan Online</p>
                    <div className="flex items-center text-gray-700 text-xs mb-1">
                      <Calendar className="w-3 h-3 text-green-500 mr-2" />
                      {new Date(session.start_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center text-gray-700 text-xs">
                      <Users className="w-3 h-3 text-blue-500 mr-2" />
                      {session.total_participant} <span className="ml-1 text-xs text-gray-500">orang</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm animate-fadeInUp" 
                style={{ animationDelay: '0.8s' }}
              >
                <Calendar className="w-10 h-10 mx-auto mb-3" />
                Tidak ada pelatihan pada rentang waktu ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;