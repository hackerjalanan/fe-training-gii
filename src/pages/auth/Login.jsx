import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import authService from '../../service/auth.service';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);
  const [forceReset, setForceReset] = useState(0);
  const [loginAttempted, setLoginAttempted] = useState(false); // Track login attempts
  const { login, error, clearError } = useAuth(); // Add clearError if available
  const navigate = useNavigate();
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);
  const mountedRef = useRef(true); // Track if component is mounted

  // Enhanced reset function to completely clean state
  const resetAllStates = () => {
    setUsername('');
    setPassword('');
    setIsSubmitting(false);
    setShowPassword(false);
    setTurnstileToken('');
    setTurnstileError(false);
    setLoginAttempted(false);
    setTurnstileLoaded(false); // 🔥 Tambahkan ini
    setForceReset(prev => prev + 1); // 🔥 Tambahkan ini untuk paksa reload

    if (clearError && typeof clearError === 'function') {
      clearError();
    }

    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      } catch (e) {
        console.warn('Failed to cleanup existing turnstile widget:', e);
      }
    }

    if (turnstileRef.current) {
      turnstileRef.current.innerHTML = '';
    }
  };


  useEffect(() => {
    console.log('turnstileLoaded:', turnstileLoaded);
    console.log('forceReset:', forceReset);
  }, [turnstileLoaded, forceReset]);

  // Reset all states when component mounts (after logout)
  useEffect(() => {
    mountedRef.current = true;
    resetAllStates();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);



  // Load Turnstile script and setup
  useEffect(() => {
    if (!mountedRef.current) return;
    
    let timeoutId;
    
    const loadTurnstile = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="turnstile"]');
      
      if (!window.turnstile && !existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (mountedRef.current) {
            console.log('Turnstile script loaded successfully');
            setTurnstileLoaded(true);
            setTurnstileError(false);
          }
        };
        
        script.onerror = () => {
          if (mountedRef.current) {
            console.error('Failed to load Turnstile script');
            setTurnstileError(true);
            setTurnstileLoaded(false);
          }
        };
        
        document.head.appendChild(script);
        
        // Timeout fallback
        timeoutId = setTimeout(() => {
          if (!window.turnstile && mountedRef.current) {
            console.error('Turnstile script loading timeout');
            setTurnstileError(true);
            setTurnstileLoaded(false);
          }
        }, 10000);
        
      } else if (window.turnstile) {
        if (mountedRef.current) {
          setTurnstileLoaded(true);
          setTurnstileError(false);
        }
      } else if (existingScript) {
        // Script exists but turnstile not ready, wait for it
        const checkTurnstile = setInterval(() => {
          if (window.turnstile) {
            if (mountedRef.current) {
              setTurnstileLoaded(true);
              setTurnstileError(false);
            }
            clearInterval(checkTurnstile);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkTurnstile);
          if (!window.turnstile && mountedRef.current) {
            setTurnstileError(true);
          }
        }, 5000);
      }
    };

    loadTurnstile();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [forceReset]);

  // Render Turnstile widget when loaded
  useEffect(() => {
    if (!turnstileLoaded || !window.turnstile || !turnstileRef.current || !mountedRef.current) {
      return;
    }

    // Clear any existing widget first
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      } catch (e) {
        console.warn('Failed to remove previous turnstile widget:', e);
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!mountedRef.current) return;
      
      try {
        // Clear the container
        if (turnstileRef.current) {
          turnstileRef.current.innerHTML = '';
        }
        
        // Render new widget
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
          callback: (token) => {
            if (mountedRef.current) {
              console.log('Turnstile token received:', token ? 'Yes' : 'No');
              setTurnstileToken(token);
            }
          },
          'error-callback': (error) => {
            if (mountedRef.current) {
              console.error('Turnstile error:', error);
              setTurnstileError(true);
              setTurnstileToken('');
            }
          },
          'expired-callback': () => {
            if (mountedRef.current) {
              console.log('Turnstile token expired');
              setTurnstileToken('');
            }
          },
          'timeout-callback': () => {
            if (mountedRef.current) {
              console.log('Turnstile timeout');
              setTurnstileToken('');
            }
          },
          theme: 'light',
          size: 'normal',
          retry: 'auto'
        });
        
        console.log('Turnstile widget rendered with ID:', widgetIdRef.current);
      } catch (error) {
        if (mountedRef.current) {
            console.error('Login error:', error);

            // ✅ Tambahkan log token captcha
            console.log('Captcha Token (for debug):', turnstileToken);

            // Display more specific error messages
            let errorMessage = "Login gagal. Silakan coba lagi.";
            if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            alert(`${errorMessage}\n\n[Token Debug]\n${turnstileToken || 'No token'}`);

            // Reset turnstile on error
            resetTurnstile();

            // Reset login attempted flag
            setLoginAttempted(false);
          }
        }
      }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [turnstileLoaded, forceReset]);

  // Reset Turnstile widget
  const resetTurnstile = () => {
    if (window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken('');
        console.log('Turnstile widget reset');
      } catch (error) {
        console.error('Failed to reset Turnstile:', error);
        // Force complete re-render on reset failure
        forceReloadTurnstile();
      }
    } else {
      // If widget doesn't exist, force reload
      forceReloadTurnstile();
    }
  };

  // Force complete turnstile reload
  const forceReloadTurnstile = () => {
    if (!mountedRef.current) return;
    
    setTurnstileError(false);
    setTurnstileLoaded(false);
    setTurnstileToken('');
    
    // Clean up existing widget
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        console.warn('Failed to remove widget during force reload:', e);
      }
      widgetIdRef.current = null;
    }
    
    // Clear container
    if (turnstileRef.current) {
      turnstileRef.current.innerHTML = '';
    }
    
    // Increment force reset counter to trigger reload
    setForceReset(prev => prev + 1);
  };

  // Retry loading Turnstile
  const retryTurnstile = () => {
    if (!mountedRef.current) return;
    
    setTurnstileError(false);
    setTurnstileLoaded(false);
    setTurnstileToken('');
    
    // Clean up existing widget
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        console.warn('Failed to remove widget during retry:', e);
      }
      widgetIdRef.current = null;
    }
    
    // Remove existing script and reload
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Clear window.turnstile to force reload
    if (window.turnstile) {
      delete window.turnstile;
    }
    
    // Clear container
    if (turnstileRef.current) {
      turnstileRef.current.innerHTML = '';
    }
    
    // Trigger reload with force reset
    setTimeout(() => {
      if (mountedRef.current) {
        setForceReset(prev => prev + 1);
      }
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mountedRef.current) return;
    
    // Clear any previous errors
    if (clearError && typeof clearError === 'function') {
      clearError();
    }
    
    // Validation
    if (!username.trim() || !password.trim()) {
      alert("Username dan password harus diisi!");
      return;
    }

    if (!turnstileToken) {
      alert("Captcha belum dicentang!");
      return;
    }
    
    setIsSubmitting(true);
    setLoginAttempted(true);
    
    try {
      // Call the login method from auth service
      const result = await login(username.trim(), password, turnstileToken);

      
      if (mountedRef.current) {
        // If login successful, navigate to dashboard
        console.log('Login successful, navigating to dashboard');
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Login error:', error);
        
        // Display more specific error messages
        let errorMessage = "Login gagal. Silakan coba lagi.";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
        
        // Reset turnstile on error
        resetTurnstile();
        
        // Reset login attempted flag
        setLoginAttempted(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Reset login attempt when user starts typing
  useEffect(() => {
    if (loginAttempted && (username || password)) {
      setLoginAttempted(false);
    }
  }, [username, password, loginAttempted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.warn('Failed to cleanup turnstile widget:', e);
        }
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-indigo-200 rounded-full opacity-25"></div>
        <div className="absolute bottom-1/3 right-1/3 w-8 h-8 bg-pink-200 rounded-full opacity-20 animate-ping"></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/3 left-1/2 w-24 h-24 border-2 border-blue-200 rotate-45 opacity-10"></div>
        <div className="absolute bottom-1/4 left-20 w-16 h-16 border-2 border-purple-200 rounded-full opacity-15"></div>
        
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full relative z-10 backdrop-blur-sm">
        
        {/* Mobile: Logo at top, Desktop: Logo on left */}
        <div className="flex flex-col md:flex-row">
          
          {/* Logo section */}
          <div className="w-full md:w-1/2 md:bg-gradient-to-br md:from-blue-50 md:to-indigo-100 bg-white flex flex-col justify-center items-center p-8 relative overflow-hidden">
            {/* Background decorations for logo section */}
            <div className="absolute inset-0 hidden md:block">
              <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-20"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-blue-300 rounded-full opacity-15"></div>
              <div className="absolute top-1/2 left-4 w-8 h-8 bg-indigo-300 rounded-full opacity-20"></div>
              
              {/* Training/education related icons */}
              <svg className="absolute top-6 left-6 w-8 h-8 text-blue-300 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <svg className="absolute bottom-6 right-6 w-6 h-6 text-indigo-300 opacity-25" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <svg className="absolute top-1/3 right-1/3 w-5 h-5 text-purple-300 opacity-15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </div>
            
            <div className="text-center relative z-10">
              {/* Logo with subtle glow effect */}
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl opacity-10 blur-sm"></div>
                <img src="/239bc1c13de8a8c37e0888e1d7442ba7 (1).webp" alt="Logo" className="w-full h-full object-contain rounded-xl relative z-10 drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Login form section */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
            {/* Subtle background pattern for form section */}
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <defs>
                  <pattern id="formPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="#6366f1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#formPattern)"/>
              </svg>
            </div>
            
            <div className="w-full max-w-md relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
                <p className="text-gray-600 text-sm">Masuk ke Sistem Pelaporan Training</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {error}
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Username/Email</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username atau email"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 pr-12 transition-all duration-200 shadow-sm hover:shadow-md"
                      required
                    />

                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Turnstile CAPTCHA */}
                <div className="space-y-1">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Verifikasi CAPTCHA</label>
                  
                  {turnstileError ? (
                    <div className="flex flex-col items-center justify-center h-20 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-600 text-sm mb-2">Gagal memuat CAPTCHA</div>
                      <button
                        type="button"
                        onClick={retryTurnstile}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : !turnstileLoaded ? (
                    <div className="flex items-center justify-center h-16 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 text-sm">Memuat CAPTCHA...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div ref={turnstileRef} className="flex justify-start min-h-[65px]"></div>
                        {turnstileToken && (
                          <p className="text-sm text-green-600 mt-2">
                            {/* ✅ CAPTCHA berhasil diverifikasi. <br /> */}
                            {/* <span className="text-gray-600 break-all">
                              Token: <code>{turnstileToken}</code>
                            </span> */}
                          </p>
                        )}

                    </div>
                  )}
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                  disabled={isSubmitting || !turnstileToken || turnstileError}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Logging in...
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </button>
                
                <div className="text-center pt-2">
                  <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium">
                    Lupa password?
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;