import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FiLock, FiShield, FiEye, FiEyeOff, FiKey, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  
  // Check if user signed in with OAuth (Google, GitHub, etc.)
  // Check the providers array for any OAuth provider
  const providers = user?.app_metadata?.providers || [];
  const oauthProviders = providers.filter(p => p !== 'email');
  const isOAuthUser = oauthProviders.length > 0;
  
  const getProviderName = () => {
    // Get the first non-email provider
    const provider = oauthProviders[0];
    if (provider === 'google') return 'Google';
    if (provider === 'github') return 'GitHub';
    if (provider === 'gitlab') return 'GitLab';
    if (provider === 'azure') return 'Azure';
    if (provider === 'facebook') return 'Facebook';
    return 'your OAuth provider';
  };
  
  console.log('User object:', user);
  console.log('App metadata:', user?.app_metadata);
  console.log('Providers array:', providers);
  console.log('OAuth providers:', oauthProviders);
  console.log('Is OAuth user:', isOAuthUser);
  console.log('Provider:', user?.app_metadata?.provider);
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || 'John Smith');
  const [emailAddress, setEmailAddress] = useState(user?.email || 'john.smith@company.com');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveProfile = () => {
    // TODO: Implement profile update
    console.log('Saving profile...');
  };

  const handleUpdatePassword = () => {
    // TODO: Implement password update with Supabase
    console.log('Updating password...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
          {/* Debug info */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>Debug:</strong> isOAuthUser = {isOAuthUser ? 'true' : 'false'}, 
            providers = {JSON.stringify(providers)},
            oauthProviders = {JSON.stringify(oauthProviders)}
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiUser className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Profile Information</h2>
              <p className="text-sm text-gray-600">
                Update your personal details
              </p>
            </div>
          </div>

          {/* OAuth Notice */}
          {isOAuthUser ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FiShield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Managed by {getProviderName()}
                  </p>
                  <p className="text-sm text-blue-700">
                    Your name and email are managed through your {getProviderName()} account. To update these details, please visit your {getProviderName()} account settings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Fields */}
              <div className="space-y-6 mb-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <FiUser className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="john.smith@company.com"
                  />
                </div>
              </div>

              {/* Save Changes Button */}
              <button
                onClick={handleSaveProfile}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Save Changes
              </button>
            </>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiLock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Change Password</h2>
              <p className="text-sm text-gray-600">
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          {/* OAuth Notice for Password */}
          {isOAuthUser ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FiShield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Password Managed by {getProviderName()}
                  </p>
                  <p className="text-sm text-blue-700">
                    You signed in using {getProviderName()} OAuth. Your password is managed through your {getProviderName()} account and cannot be changed here. To update your password, please visit your {getProviderName()} account security settings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Password Fields */}
          <div className="space-y-6 mb-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <FiKey className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <FiKey className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <FiKey className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FiShield className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Password Requirements</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>At least 8 characters</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Contains uppercase and lowercase letters</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Contains at least one number</span>
              </li>
            </ul>
          </div>

          {/* Update Password Button */}
          <button
            onClick={handleUpdatePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
            </>
          )}
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiShield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <span className="inline-block bg-orange-50 text-orange-600 text-xs font-medium px-3 py-1 rounded-full border border-orange-200">
              Coming Soon
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Two-factor authentication provides additional security by requiring a second form of verification when
            signing in.
          </p>

          {/* Enable 2FA Button */}
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
          >
            Enable 2FA
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
