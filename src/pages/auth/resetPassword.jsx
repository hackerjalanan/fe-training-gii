import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp, resetPw } from "../../service/reset-password.service";

const ResetPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // 'success' or 'error'
  
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    setMessage("");
    setMessageType("error");

    if (!email) { 
      setMessage("Email tidak boleh kosong");
      setLoading(false);
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Format email tidak valid");
      setLoading(false);
      return;
    }

    try {
      const res = await sendOtp({ email });
      setMessage("OTP telah dikirim ke email Anda");
      setMessageType("success");
      setStep(2);
    } catch (err) {
      console.error('Send OTP Error:', err);
      
      // Handle specific error responses
      if (err.response?.status === 404) {
        setMessage("Email tidak terdaftar dalam sistem");
      } else if (err.response?.status === 429) {
        setMessage("Terlalu banyak percobaan. Silakan tunggu beberapa menit");
      } else {
        setMessage(err.response?.data?.message || "Gagal mengirim OTP. Periksa koneksi internet Anda");
      }
      
      // TETAP di step 1, user bisa input ulang
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    setMessageType("error");

    if (!otp) {
      setMessage("Kode OTP tidak boleh kosong");
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setMessage("Kode OTP harus 6 digit");
      setLoading(false);
      return;
    }

    try {
      const res = await verifyOtp({ email, otpInput: otp });
      setMessage("OTP valid, silakan atur ulang password");
      setMessageType("success");
      setStep(3);
    } catch (err) {
      console.error('Verify OTP Error:', err);
      
      // Handle specific error responses
      if (err.response?.status === 400) {
        setMessage("Kode OTP tidak valid atau sudah kadaluarsa");
      } else if (err.response?.status === 429) {
        setMessage("Terlalu banyak percobaan. Silakan tunggu beberapa menit");
      } else {
        setMessage(err.response?.data?.message || "OTP tidak valid");
      }
      
      // TETAP di step 2, clear OTP untuk input ulang
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage("");
    setMessageType("error");

    if (!newPassword || !confirmPassword) {
      setMessage("Semua kolom harus diisi");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Password dan konfirmasi tidak cocok");
      setLoading(false);
      return;
    }

    try {
      await resetPw({ email, newPassword, confirmPassword });
      setMessage("Password berhasil direset. Silakan login kembali.");
      setMessageType("success");
      setStep(4);
    } catch (err) {
      console.error('Reset Password Error:', err);
      
      // Handle specific error responses
      if (err.response?.status === 400) {
        setMessage("Password tidak memenuhi kriteria keamanan");
      } else if (err.response?.status === 401) {
        setMessage("Sesi reset password sudah kadaluarsa. Silakan mulai ulang dari awal dengan mengirim OTP baru");
        // TIDAK AUTO REDIRECT - biarkan user memilih sendiri
        // User bisa klik tombol "Kembali ke Verifikasi OTP" atau "Kembali ke Input Email" jika perlu
      } else {
        setMessage(err.response?.data?.message || "Gagal reset password");
      }
      
      // TETAP di step 3, clear password fields untuk input ulang
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep = (targetStep) => {
    setStep(targetStep);
    setMessage("");
    setMessageType("error");
    
    // Clear data sesuai step yang dituju
    if (targetStep === 1) {
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (targetStep === 2) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleGoToLogin = () => {
    // Gunakan navigate instead of window.location untuk better routing
    navigate('/login');
  };

  // Fungsi untuk mengirim ulang OTP (tambahan)
  const handleResendOtp = async () => {
    await handleSendOtp();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 space-y-6">
      <h2 className="text-2xl font-bold text-center">Reset Password</h2>

      {/* Progress indicator */}
      <div className="flex justify-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`w-3 h-3 rounded-full ${step >= 4 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
      </div>

      {message && (
        <div className={`text-center text-sm font-medium p-3 rounded-md ${
          messageType === "success" 
            ? "text-green-700 bg-green-50 border border-green-200" 
            : "text-red-700 bg-red-50 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Masukkan Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendOtp()}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSendOtp}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? "Mengirim OTP..." : "Kirim OTP"}
          </button>
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline text-sm"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kode OTP</label>
            <input
              type="text"
              placeholder="Masukkan Kode OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only numbers
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleVerifyOtp()}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg tracking-widest"
              maxLength="6"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">OTP dikirim ke: {email}</p>
          </div>
          <button
            onClick={handleVerifyOtp}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? "Memverifikasi OTP..." : "Verifikasi OTP"}
          </button>
          
          {/* Tombol Kirim Ulang OTP */}
          <button
            onClick={handleResendOtp}
            className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? "Mengirim Ulang..." : "Kirim Ulang OTP"}
          </button>
          
          <button
            onClick={() => handleBackToStep(1)}
            className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            Kembali ke Input Email
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
            <input
              type="password"
              placeholder="Password Baru (min. 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleResetPassword()}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleResetPassword}
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
          <button
            onClick={() => handleBackToStep(2)}
            className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            Kembali ke Verifikasi OTP
          </button>
          
          {/* Tombol tambahan untuk kembali ke step 1 jika session expired */}
          <button
            onClick={() => handleBackToStep(1)}
            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors text-sm"
            disabled={loading}
          >
            Mulai Ulang dari Awal
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="text-center space-y-4">
          <div className="text-green-600 text-6xl">✓</div>
          <p className="text-green-600 font-semibold text-lg">
            Password berhasil diperbarui!
          </p>
          <p className="text-gray-600">
            Silakan login kembali dengan password baru Anda.
          </p>
          <button
            onClick={handleGoToLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ke Halaman Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;