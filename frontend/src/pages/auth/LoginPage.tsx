import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, clearError } = useAuthStore();
  const { isLoading, error, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError(); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password) {
      return;
    }

    try {
      await login(formData.email.trim(), formData.password);
      // Navigation is handled by the useEffect above
    } catch (err) {
      // Error is handled by the store
      console.error('Login failed:', err);
    }
  };

  const isFormValid = formData.email.trim() && formData.password;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-h1 text-lotus-green mb-2">
          Welcome Back
        </h2>
        <p className="text-h2 font-arabic arabic-text text-lotus-green mb-3">
          أهلاً بعودتك
        </p>
        <p className="text-body text-gray-600">
          Sign in to your garden
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm animate-slide-up">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-label text-gray-700 mb-2">
            Email Address
            <span className="block text-caption font-arabic arabic-text text-gray-500 mt-1">
              البريد الإلكتروني
            </span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            placeholder="your@email.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-label text-gray-700 mb-2">
            Password
            <span className="block text-caption font-arabic arabic-text text-gray-500 mt-1">
              كلمة المرور
            </span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field pr-12"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-target"
              disabled={isLoading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="btn-primary w-full mt-6"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Signing in... جاري تسجيل الدخول</span>
            </div>
          ) : (
            <span>
              Sign In
              <span className="block text-sm font-arabic arabic-text">دخول</span>
            </span>
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-6 text-center space-y-3">
        <div>
          <Link
            to="#"
            className="text-sm text-nile-blue hover:underline"
          >
            Forgot Password?
            <span className="block text-caption font-arabic arabic-text">
              نسيت كلمة المرور؟
            </span>
          </Link>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-body text-gray-600 mb-2">
            Don't have an account?
          </p>
          <p className="text-body font-arabic arabic-text text-gray-600 mb-3">
            ليس لديك حساب؟
          </p>
          <Link
            to="/auth/register"
            className="btn-secondary w-full inline-block text-center"
          >
            Create Account
            <span className="block text-sm font-arabic arabic-text">إنشاء حساب جديد</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;