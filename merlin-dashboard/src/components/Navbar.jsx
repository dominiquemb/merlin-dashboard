import React, { useState } from 'react';
import { FiChevronDown, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const [isPreMeetingOpen, setIsPreMeetingOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'JS';
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => setIsPreMeetingOpen(!isPreMeetingOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900"
              >
                <span>Pre meeting intelligence</span>
                <FiChevronDown className="w-4 h-4" />
              </button>
              {isPreMeetingOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
                  <Link
                    to="/meetings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsPreMeetingOpen(false)}
                  >
                    Your meetings
                  </Link>
                  <Link
                    to="/icp-analysis"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsPreMeetingOpen(false)}
                  >
                    ICP analysis
                  </Link>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Customise
                  </a>
                </div>
              )}
            </div>
            <Link to="/data-enrichment" className="text-gray-700 hover:text-gray-900">
              Data enrichment
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-gray-900">
              Services
            </Link>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Credits badge */}
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-primary">1,250</span>
            <span className="text-sm text-blue-600">Credits</span>
          </div>

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {getUserInitials()}
              </div>
              <span className="text-gray-700">{user?.email?.split('@')[0] || 'User'}</span>
              <FiChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiUser className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiSettings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
