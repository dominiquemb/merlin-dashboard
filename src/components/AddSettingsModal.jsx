import React, { useState, useEffect } from 'react';
import { FiX, FiLock } from 'react-icons/fi';
import { getVendors, createSetting, updateSetting, loginToSettingsAPI, signupToSettingsAPI, exchangeOAuthCode } from '../lib/settingsApi';

const AddSettingsModal = ({ isOpen, onClose, onSubmit, initialData, isEdit = false }) => {
  const [formData, setFormData] = useState({
    vendor: '',
    title: '',
    channel: '',
    hook_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loginData, setLoginData] = useState({ userName: '', password: '', title: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch vendors when modal opens
  useEffect(() => {
    if (isOpen) {
      // Check for OAuth callback code in URL first
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        handleOAuthCallback(code);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Check if we have a token - if so, don't show login form
        const token = localStorage.getItem('settings_jwt_token');
        if (token) {
          setShowLogin(false);
        }
        // Fetch vendors (this will set showLogin if token is invalid)
        fetchVendors();
      }
    } else {
      // Reset login state when modal closes
      setShowLogin(false);
      setIsSignup(false);
      setLoginError('');
      setLoginData({ userName: '', password: '', title: '' });
    }
  }, [isOpen]);

  const handleOAuthCallback = async (code) => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const response = await exchangeOAuthCode(code);
      if (!response.error) {
        setShowLogin(false);
        setIsSignup(false);
        setLoginData({ userName: '', password: '', title: '' });
        await fetchVendors();
      } else {
        setLoginError(response.message || 'OAuth authentication failed');
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      setLoginError('Failed to complete OAuth authentication. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    // Store that we're doing OAuth
    localStorage.setItem('settings_oauth_in_progress', 'true');
    localStorage.setItem('settings_oauth_provider', provider);
    
    // Based on the docs: GET /:provider with provider as query parameter
    // The curl example shows: /v1/:provider?provider=google (but that 404s)
    // merlin-core-app uses: /google (path param, no /v1/)
    // Let's use the path format like merlin-core-app: /{provider}
    const oauthUrl = `${process.env.REACT_APP_SETTINGS_API_URL || 'https://int.dev.usemerlin.io'}/${provider}`;
    
    console.log('Redirecting to OAuth endpoint:', oauthUrl);
    console.log('Provider:', provider);
    
    // Full page redirect to the OAuth endpoint
    window.location.href = oauthUrl;
  };

  // Populate form when editing or when initialData is provided
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen && !initialData) {
      // Reset form when opening without initial data
      setFormData({
        vendor: '',
        title: '',
        channel: '',
        hook_url: ''
      });
    }
  }, [isOpen, initialData, isEdit]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      // Check if we have a token first
      const token = localStorage.getItem('settings_jwt_token');
      console.log('Checking for token:', token ? 'Token exists' : 'No token');
      
      const response = await getVendors();
      console.log('getVendors response:', response);
      
      if (response.requiresLogin) {
        console.log('Requires login, showing login form');
        setShowLogin(true);
        setVendors([]);
        return;
      }
      
      if (!response.error && response.data) {
        console.log('Vendors fetched successfully, hiding login form');
        setVendors(response.data);
        setShowLogin(false);
      } else {
        console.error('Failed to fetch vendors:', response.message);
        // If we have a token but still got an error, might be expired
        if (token && response.message?.includes('JWT') || response.message?.includes('expired')) {
          console.log('Token appears invalid, showing login form');
          localStorage.removeItem('settings_jwt_token');
          localStorage.removeItem('settings_jwt_expiry');
          setShowLogin(true);
          setVendors([]);
          return;
        }
        // Fallback to default vendors if API fails
        const fallbackVendors = [
          { ven_code: 'slack', title: 'Slack' },
          { ven_code: 'discord', title: 'Discord' },
          { ven_code: 'telegram', title: 'Telegram' },
          { ven_code: 'teams', title: 'Microsoft Teams' },
          { ven_code: 'gwhook', title: 'Generic Web Hook' }
        ];
        setVendors(fallbackVendors);
        setShowLogin(false);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Fallback to default vendors on error
      const fallbackVendors = [
        { ven_code: 'slack', title: 'Slack' },
        { ven_code: 'discord', title: 'Discord' },
        { ven_code: 'telegram', title: 'Telegram' },
        { ven_code: 'teams', title: 'Microsoft Teams' },
        { ven_code: 'gwhook', title: 'Generic Web Hook' }
      ];
      setVendors(fallbackVendors);
      setShowLogin(false);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      let response;
      if (isSignup) {
        if (!loginData.title) {
          setLoginError('Full name is required for signup');
          setIsLoggingIn(false);
          return;
        }
        response = await signupToSettingsAPI(loginData.userName, loginData.password, loginData.title);
      } else {
        response = await loginToSettingsAPI(loginData.userName, loginData.password);
      }
      
      if (!response.error) {
        console.log('Login/signup successful, hiding login form and fetching vendors');
        setShowLogin(false);
        setIsSignup(false);
        setLoginData({ userName: '', password: '', title: '' });
        setLoginError('');
        // Fetch vendors after successful login/signup
        await fetchVendors();
      } else {
        setLoginError(response.message || (isSignup ? 'Signup failed' : 'Login failed'));
      }
    } catch (error) {
      console.error(`Error ${isSignup ? 'signing up' : 'logging in'}:`, error);
      setLoginError(`Failed to ${isSignup ? 'signup' : 'login'}. Please try again.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Channel is only required for non-custom webhook vendors
    const isChannelRequired = formData.vendor !== 'gwhook';
    const requiredFields = !formData.vendor || !formData.title || !formData.hook_url;
    const channelRequired = isChannelRequired && !formData.channel;
    
    if (requiredFields || channelRequired) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // If onSubmit is provided (from parent), use it, otherwise call createSetting directly
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const response = await createSetting(formData);
        if (response.requiresLogin) {
          setShowLogin(true);
          setIsSubmitting(false);
          return;
        }
        if (response.error) {
          alert(`Error: ${response.message}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Reset form and close modal on success
      setFormData({
        vendor: '',
        title: '',
        channel: '',
        hook_url: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        vendor: '',
        title: '',
        channel: '',
        hook_url: ''
      });
      setShowLogin(false);
      setIsSignup(false);
      setLoginData({ userName: '', password: '', title: '' });
      setLoginError('');
      onClose();
    }
  };

  useEffect(() => {
    console.log('AddSettingsModal isOpen changed:', isOpen);
  }, [isOpen]);

  if (!isOpen) {
    console.log('Modal not rendering because isOpen is false');
    return null;
  }

  console.log('Modal rendering with isOpen:', isOpen);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isEdit ? 'Edit Settings' : 'Add New Settings'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isEdit ? 'Update your webhook settings' : 'Configure a new webhook integration'}
        </p>

        {showLogin ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-orange-600 mb-4">
              <FiLock className="w-5 h-5" />
              <p className="text-sm font-medium">{isSignup ? 'Create Account' : 'Authentication Required'}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {isSignup 
                ? 'Create an account to access the settings API.'
                : 'Please login to the settings API to continue.'}
            </p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              {isSignup && (
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={loginData.title}
                    onChange={(e) => setLoginData(prev => ({ ...prev, title: e.target.value }))}
                    required={isSignup}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="userName"
                  type="email"
                  value={loginData.userName}
                  onChange={(e) => setLoginData(prev => ({ ...prev, userName: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Enter your password"
                />
              </div>
              
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {loginError}
                </div>
              )}

              {/* OAuth Buttons */}
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoggingIn}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('microsoft')}
                    disabled={isLoggingIn}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                      <path fill="#F25022" d="M0 0h11v11H0z"/>
                      <path fill="#00A4EF" d="M12 0h11v11H12z"/>
                      <path fill="#7FBA00" d="M0 12h11v11H0z"/>
                      <path fill="#FFB900" d="M12 12h11v11H12z"/>
                    </svg>
                    Microsoft
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setLoginError('');
                    setLoginData({ userName: '', password: '', title: '' });
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
                </button>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setIsSignup(false);
                    setLoginData({ userName: '', password: '', title: '' });
                    onClose();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition min-w-[100px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {isLoggingIn 
                    ? (isSignup ? 'Creating Account...' : 'Logging in...') 
                    : (isSignup ? 'Sign Up' : 'Login')}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vendor Selection */}
            <div className="space-y-2">
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
              Vendor
            </label>
            <select
              id="vendor"
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              disabled={isSubmitting || loadingVendors}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingVendors ? 'Loading vendors...' : 'Select vendor'}
              </option>
              {vendors.map((vendor) => (
                <option key={vendor.ven_code} value={vendor.ven_code}>
                  {vendor.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Slack Web Hook"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Channel - Only show for non-custom webhook vendors */}
          {formData.vendor && formData.vendor !== 'gwhook' && (
            <div className="space-y-2">
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
                {formData.vendor === 'slack' ? 'Slack Channel' : 'Channel'}
              </label>
              <input
                id="channel"
                type="text"
                placeholder="e.g., social"
                value={formData.channel}
                onChange={(e) => handleInputChange('channel', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Hook URL */}
          <div className="space-y-2">
            <label htmlFor="hook_url" className="block text-sm font-medium text-gray-700">
              Hook URL
            </label>
            <input
              id="hook_url"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={formData.hook_url}
              onChange={(e) => handleInputChange('hook_url', e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isSubmitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Settings' : 'Add Settings')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AddSettingsModal;

