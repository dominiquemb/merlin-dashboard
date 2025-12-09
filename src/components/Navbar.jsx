import React, { useState, useEffect, useRef } from "react";
import {
  FiChevronDown,
  FiLogOut,
  FiSettings,
  FiCreditCard,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import CreditsBadge from "./CreditsBadge";
import { getCreditBalance } from "../lib/billingApi";

const Navbar = () => {
  const [isPreMeetingOpen, setIsPreMeetingOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const preMeetingRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (preMeetingRef.current && !preMeetingRef.current.contains(event.target)) {
        setIsPreMeetingOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch credit balance on mount and when user changes
  useEffect(() => {
    if (!user) {
      setCreditBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const data = await getCreditBalance();
        setCreditBalance(data.credits_balance);
      } catch (error) {
        console.error("Error fetching credit balance in Navbar:", error);
        // Keep previous balance on error
      }
    };

    fetchBalance();
  }, [user]);

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      console.log('Calling signOut...');
      const result = await signOut();
      console.log('signOut result:', result);
      
      // Even if signOut fails, clear local storage and navigate
      // This handles cases where the session is already expired or missing
      if (result?.error) {
        console.warn('SignOut returned error, but clearing local storage anyway:', result.error);
      }
      
      // Clear any Supabase-related storage manually
      try {
        // Clear all Supabase auth tokens from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        console.log('Cleared Supabase storage');
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      
      // Close the user menu
      setIsUserMenuOpen(false);
      // Navigate to login
      console.log('Navigating to login...');
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      // Clear storage even on error
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      // Still navigate to login even if there's an error
      setIsUserMenuOpen(false);
      navigate("/login");
    }
  };

  const getUserInitials = () => {
    // Try Microsoft's given_name + family_name
    if (user?.user_metadata?.given_name && user?.user_metadata?.family_name) {
      return `${user.user_metadata.given_name[0]}${user.user_metadata.family_name[0]}`.toUpperCase();
    }
    // Try to get initials from full name (Google)
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    // Try generic name field
    if (user?.user_metadata?.name) {
      const names = user.user_metadata.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    // Fallback to email
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "JS";
  };

  const getUserName = () => {
    // Try first name from OAuth providers (Google, Microsoft, etc.)
    if (user?.user_metadata?.given_name) {
      // Microsoft stores first name as given_name
      return user.user_metadata.given_name;
    }
    if (user?.user_metadata?.full_name) {
      // Google stores full name, extract first name
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.user_metadata?.name) {
      // Some providers use 'name'
      return user.user_metadata.name.split(' ')[0];
    }
    // Fallback to email username
    return user?.email?.split("@")[0] || "User";
  };

  const getUserAvatar = () => {
    // Get avatar from Google OAuth
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  return (
    <nav className="bg-white px-6 py-5 border-b border-neutral-300 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side */}
        <div className="flex items-center space-x-10">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center group">
              <img src="/logo.png" alt="Merlin" className="h-12 transition-transform duration-300 ease-out group-hover:-translate-y-1" />
            </Link>
          </div>

          {/* Nav links */}
          <div className="flex items-center space-x-8">
            <div className="relative" ref={preMeetingRef}>
              <button
                onClick={() => setIsPreMeetingOpen(!isPreMeetingOpen)}
                className="flex items-center space-x-1 text-neutral-800 hover:text-neutral-800 transition font-medium"
              >
                <span>Pre meeting Insights</span>
                <FiChevronDown className="w-4 h-4" />
              </button>
              {isPreMeetingOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-neutral-300 rounded-lg shadow-md py-2 z-10">
                  <Link
                    to="/meetings"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-accent-light"
                    onClick={() => setIsPreMeetingOpen(false)}
                  >
                    Your meetings
                  </Link>
                  <Link
                    to="/icp-analysis"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-accent-light"
                    onClick={() => setIsPreMeetingOpen(false)}
                  >
                    ICP Focus
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/data-enrichment"
              className="text-neutral-800 hover:text-neutral-800 transition font-medium"
            >
              Data enrichment
            </Link>
            <Link
              to="/icp-settings"
              className="text-neutral-800 hover:text-neutral-800 transition font-medium"
            >
              Settings
            </Link>
            <Link to="/services" className="text-neutral-800 hover:text-neutral-800 transition font-medium">
              Services
            </Link>
          </div>
        </div>

        {/* Right side */}

        <div className="flex items-center space-x-5">
          {/* Credits badge */}
          {creditBalance !== null && (
            <Link to="/billing" className="hover:opacity-80 transition">
              <CreditsBadge 
                amount={creditBalance.toLocaleString()}
                text="credits"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </Link>
          )}

          {/* User profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-200 rounded-lg px-3 py-2 transition"
            >
              {getUserAvatar() ? (
                <img 
                  src={getUserAvatar()} 
                  alt={getUserName()}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center text-black font-semibold text-sm">
                  {getUserInitials()}
                </div>
              )}
              <span className="text-neutral-800 font-medium">
                {getUserName()}
              </span>
              <FiChevronDown className="w-4 h-4 text-neutral-800" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-neutral-300 rounded-lg shadow-md py-2 z-10">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-neutral-800">
                    My Account
                  </p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-neutral-700 hover:bg-accent-light transition"
                >
                  <FiSettings className="w-4 h-4 text-neutral-600" />
                  <span>User settings</span>
                </Link>
                <Link
                  to="/billing"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-neutral-700 hover:bg-accent-light transition"
                >
                  <FiCreditCard className="w-4 h-4 text-neutral-600" />
                  <span>Billing</span>
                </Link>
                <div className="border-t border-neutral-300 my-1"></div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Log out</span>
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
