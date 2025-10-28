import React, { useState, useEffect, useRef } from "react";
import {
  FiChevronDown,
  FiLogOut,
  FiSettings,
  FiCreditCard,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const [isPreMeetingOpen, setIsPreMeetingOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "JS";
  };

  return (
    <nav className="bg-white px-6 py-5 border-b border-neutral-300 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side */}
        <div className="flex items-center space-x-10">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo.png" alt="Merlin" className="h-8" />
            </Link>
          </div>

          {/* Nav links */}
          <div className="flex items-center space-x-8">
            <div className="relative" ref={preMeetingRef}>
              <button
                onClick={() => setIsPreMeetingOpen(!isPreMeetingOpen)}
                className="flex items-center space-x-1 text-neutral-800 hover:text-neutral-800 transition font-medium"
              >
                <span>Pre meeting intelligence</span>
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
                    ICP analysis
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
            <Link to="/services" className="text-neutral-800 hover:text-neutral-800 transition font-medium">
              Services
            </Link>
          </div>
        </div>

        {/* Right side */}

        <div className="flex items-center space-x-5">
          {/* Credits badge */}
          <Link to="/billing" className="hover:opacity-80 transition">
            <div className="flex items-center space-x-2 bg-accent-light border border-accent rounded-full px-4 py-2">
              <svg
                className="w-5 h-5 text-accent"
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
              <span className="text-sm font-semibold text-neutral-800">
                100 credits
              </span>
            </div>
          </Link>

          {/* User profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-200 rounded-lg px-3 py-2 transition"
            >
              <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center text-black font-semibold text-sm">
                {getUserInitials()}
              </div>
              <span className="text-neutral-800 font-medium">
                {user?.email?.split("@")[0] || "User"}
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
                  <span>Settings</span>
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
                  onClick={handleLogout}
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
