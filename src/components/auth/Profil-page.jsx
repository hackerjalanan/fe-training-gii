// Updated React Component - ProfilePopup
import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, UserCheck, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDatetime } from '../../utils/date.utils.js';
import { sendOTPupdatePW, updatePasswordUpdate } from '../../service/reset-password.service.js'; // Import API functions

const ProfilePopup = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State untuk form password
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State untuk OTP
  const [otpStep, setOtpStep] = useState(1); // 1: form password, 2: input OTP, 3: success
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordFieldsDisabled, setPasswordFieldsDisabled] = useState(false);

  const handlePasswordInputChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Uploading image:', file);
      // Implementasi upload gambar
    }
  };

  const handleSendOTP = async () => {
    setError('');
    
    // Validasi client-side
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Semua field password harus diisi');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // Call API untuk mengirim OTP
      const response = await sendOTPupdatePW({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      console.log('OTP sent successfully:', response);
      
      // Jika berhasil, disable password fields dan pindah ke step OTP
      setPasswordFieldsDisabled(true);
      setOtpStep(2);
      setError('');
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Handle error response
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.metaData?.message) {
        setError(error.response.data.metaData.message);
      } else {
        setError('Gagal mengirim OTP. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Masukkan kode OTP 6 digit');
      return;
    }

    setIsLoading(true);
    try {
      // Call API untuk verifikasi OTP dan update password
      const response = await updatePasswordUpdate({
        otpCode: otp,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      console.log('Password updated successfully:', response);
      
      setOtpStep(3);
      setError('');
      
      // Reset form setelah berhasil
      setTimeout(() => {
        resetPasswordForm();
        setActiveTab('profile');
      }, 2000);
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      // Handle error response
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.metaData?.message) {
        setError(error.response.data.metaData.message);
      } else {
        setError('Kode OTP salah atau expired. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Call API untuk mengirim ulang OTP
      const response = await sendOTPupdatePW({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      console.log('OTP resent successfully:', response);
      setError('');
      alert('Kode OTP telah dikirim ulang ke email Anda');
      
    } catch (error) {
      console.error('Error resending OTP:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Gagal mengirim ulang OTP. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setOtp('');
    setOtpStep(1);
    setError('');
    setPasswordFieldsDisabled(false);
  };

  const handleBackToPasswordForm = () => {
    setOtpStep(1);
    setOtp('');
    setError('');
    setPasswordFieldsDisabled(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <User size={20} />
            Profil
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('profile');
              resetPasswordForm();
            }}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="inline mr-2" size={16} />
            Profil
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              resetPasswordForm();
            }}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="inline mr-2" size={16} />
            Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {activeTab === 'profile' ? (
            <>
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {user?.image ? (
                      <img 
                        src={user.image} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-gray-600">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-gray-800">
                  {user?.name}
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {user?.role_name}
                </span>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                {/* Username */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="text-gray-500" size={18} />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <p className="text-gray-800">{user?.username || 'Tidak tersedia'}</p>
                  </div>
                </div>

                {/* Name */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="text-gray-500" size={18} />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap
                    </label>
                    <p className="text-gray-800">{user?.name || 'Tidak tersedia'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="text-gray-500" size={18} />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-800">{user?.email || 'Tidak tersedia'}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <UserCheck className="text-gray-500" size={18} />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peran
                    </label>
                    <p className="text-gray-800">{user?.role_name || 'Tidak tersedia'}</p>
                  </div>
                </div>

                {/* Join Date */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="text-gray-500" size={18} />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bergabung Sejak
                    </label>
                    <p className="text-gray-800">
                      {formatDatetime(user.created_at)}
                    </p>
                  </div>
                </div>               
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {otpStep === 1 && (
                <>
                  <div className="text-center mb-6">
                    <Lock className="mx-auto text-blue-600 mb-2" size={32} />
                    <h3 className="text-lg font-semibold text-gray-800">Ubah Password</h3>
                    <p className="text-sm text-gray-600">Masukkan password lama dan password baru</p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Old Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password Lama
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.oldPassword}
                        onChange={(e) => handlePasswordInputChange('oldPassword', e.target.value)}
                        disabled={passwordFieldsDisabled}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                          passwordFieldsDisabled ? 'bg-gray-100 text-gray-500' : ''
                        }`}
                        placeholder="Masukkan password lama"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={passwordFieldsDisabled}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        disabled={passwordFieldsDisabled}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                          passwordFieldsDisabled ? 'bg-gray-100 text-gray-500' : ''
                        }`}
                        placeholder="Masukkan password baru (min. 6 karakter)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={passwordFieldsDisabled}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        disabled={passwordFieldsDisabled}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                          passwordFieldsDisabled ? 'bg-gray-100 text-gray-500' : ''
                        }`}
                        placeholder="Ulangi password baru"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={passwordFieldsDisabled}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {!passwordFieldsDisabled && (
                    <button
                      onClick={handleSendOTP}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Mengirim OTP...
                        </>
                      ) : (
                        'Kirim Kode OTP'
                      )}
                    </button>
                  )}
                </>
              )}

              {otpStep === 2 && (
                <>
                  <div className="text-center mb-6">
                    <Mail className="mx-auto text-blue-600 mb-2" size={32} />
                    <h3 className="text-lg font-semibold text-gray-800">Verifikasi OTP</h3>
                    <p className="text-sm text-gray-600">
                      Kode OTP telah dikirim ke {user?.email}
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Kode OTP (6 digit)
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                          if (error) setError('');
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>

                    <button
                      onClick={handleVerifyOTP}
                      disabled={isLoading || otp.length !== 6}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Memverifikasi...
                        </>
                      ) : (
                        'Verifikasi & Ubah Password'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-700 text-sm underline disabled:text-gray-400"
                      >
                        Kirim ulang kode OTP
                      </button>
                    </div>

                    <button
                      onClick={handleBackToPasswordForm}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Kembali
                    </button>
                  </div>
                </>
              )}

              {otpStep === 3 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Password Berhasil Diubah!</h3>
                  <p className="text-sm text-gray-600">
                    Password Anda telah berhasil diperbarui.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;