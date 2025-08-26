import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, clearError } = useAuthStore();
  const { isLoading, error, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Invalid email format';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      return;
    }

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      setRegistrationSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const isFormValid = formData.firstName.trim() && 
                     formData.lastName.trim() && 
                     formData.email.trim() && 
                     formData.password &&
                     formData.confirmPassword;

  if (registrationSuccess) {
    return (
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-h1 text-lotus-green mb-2">Registration Successful!</h2>
        <p className="text-h2 font-arabic arabic-text text-lotus-green mb-4">تم التسجيل بنجاح!</p>
        
        <div className="bg-plant-healthy/10 border border-plant-healthy/20 rounded-sm p-4 mb-6">
          <p className="text-plant-healthy font-medium mb-2">
            Welcome to Lotus, {formData.firstName}! 🌱
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Please check your email to verify your account before logging in.
          </p>
          <p className="text-sm font-arabic arabic-text text-gray-600">
            يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك قبل تسجيل الدخول.
          </p>
        </div>

        <p className="text-body text-gray-600 mb-4">
          Redirecting to login page...
        </p>
        
        <Link to="/auth/login" className="btn-primary">
          Continue to Login
          <span className="block text-sm font-arabic arabic-text mt-1">متابعة لتسجيل الدخول</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-h1 text-lotus-green mb-2">
          Create Account
        </h2>
        <p className="text-h2 font-arabic arabic-text text-lotus-green mb-3">
          إنشاء حساب جديد
        </p>
        <p className="text-body text-gray-600">
          Join the plant care community
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm animate-slide-up">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-label text-gray-700 mb-2">
              First Name
              <span className="block text-caption font-arabic arabic-text text-gray-500 mt-1">
                الاسم الأول
              </span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="input-field"
              placeholder="Ahmed"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-label text-gray-700 mb-2">
              Last Name
              <span className="block text-caption font-arabic arabic-text text-gray-500 mt-1">
                الاسم الأخير
              </span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="input-field"
              placeholder="Mohamed"
              required
              disabled={isLoading}
            />
          </div>
        </div>

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
            placeholder="ahmed@example.com"
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
              placeholder="Minimum 8 characters"
              required
              minLength={8}
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

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-label text-gray-700 mb-2">
            Confirm Password
            <span className="block text-caption font-arabic arabic-text text-gray-500 mt-1">
              تأكيد كلمة المرور
            </span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field pr-12"
              placeholder="Re-enter password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-target"
              disabled={isLoading}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
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
              <span>Creating Account... جاري إنشاء الحساب</span>
            </div>
          ) : (
            <span>
              Create Account
              <span className="block text-sm font-arabic arabic-text">إنشاء حساب</span>
            </span>
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-6 text-center">
        <div className="border-t border-gray-200 pt-4">
          <p className="text-body text-gray-600 mb-2">
            Already have an account?
          </p>
          <p className="text-body font-arabic arabic-text text-gray-600 mb-3">
            لديك حساب بالفعل؟
          </p>
          <Link
            to="/auth/login"
            className="btn-secondary w-full inline-block text-center"
          >
            Sign In
            <span className="block text-sm font-arabic arabic-text">تسجيل الدخول</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;