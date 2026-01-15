import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SettingsContent from '../components/SettingsContent';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCalendarSyncStatus } from '../lib/calendarApi';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saveMessage, setSaveMessage] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(true);

  // Check if calendar is already connected
  useEffect(() => {
    const checkCalendarConnection = async () => {
      try {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const calendarConnectedParam = urlParams.get('calendar_connected');

        if (calendarConnectedParam === 'true') {
          console.log('Calendar connected via URL parameter');
          setCalendarConnected(true);
          setSaveMessage('✅ Calendar connected successfully! Please complete your onboarding below.');
          setTimeout(() => setSaveMessage(''), 5000);
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsCheckingCalendar(false);
          return;
        }

        // Check calendar sync status from API
        console.log('Checking calendar sync status...');
        const status = await getCalendarSyncStatus();

        // If calendar has events or status check succeeded, calendar is connected
        if (status.success && status.data) {
          const hasEvents = status.data.total_events > 0;
          console.log('Calendar status:', status.data, 'Has events:', hasEvents);
          setCalendarConnected(hasEvents);
        } else {
          console.log('Calendar not connected or status check failed');
          setCalendarConnected(false);
        }
      } catch (error) {
        console.error('Error checking calendar connection:', error);
        setCalendarConnected(false);
      } finally {
        setIsCheckingCalendar(false);
      }
    };

    if (user?.email) {
      checkCalendarConnection();
    } else {
      setIsCheckingCalendar(false);
    }
  }, [user?.email]);

  // Handle calendar connection
  const handleConnectCalendar = async (provider) => {
    try {
      // Get Supabase session token
      const token = await getAuthToken();
      const userEmail = user?.email;

      if (!token || !userEmail) {
        console.error('No auth token or email found');
        alert('Please log in again to connect your calendar');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

      // Pass Supabase user email and token as state parameter in OAuth flow
      const stateData = btoa(JSON.stringify({
        supabase_email: userEmail,
        supabase_token: token
      }));

      const authUrl = `${apiUrl}/${provider}?state=${encodeURIComponent(stateData)}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating calendar connection:', error);
      alert('Failed to connect calendar. Please try again.');
    }
  };

  // Handle save completion - redirect to dashboard with completion param
  const handleSaveComplete = () => {
    setSaveMessage('✅ Onboarding completed! Redirecting to dashboard...');
    setTimeout(() => {
      navigate('/dashboard?onboarding_completed=true');
    }, 1500);
  };

  // Show loading state while checking calendar
  if (isCheckingCalendar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show calendar connection step if not connected
  if (!calendarConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
        <Navbar />

        <main className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Merlin!</h1>
            <p className="text-gray-600">
              Let's start by connecting your calendar
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Connect Your Calendar
              </h2>
              <p className="text-gray-600 mb-4">
                Grant Merlin access to your Calendar so we can automatically gather key insights on your meeting attendees and prepare you with tailored research before each meeting.
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Calendar Button */}
              <button
                onClick={() => handleConnectCalendar('google')}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Connect Google Calendar</span>
              </button>

              {/* Outlook Calendar Button */}
              <button
                onClick={() => handleConnectCalendar('microsoft')}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 23 23" fill="none">
                  <path fill="#F25022" d="M0 0h11v11H0z"/>
                  <path fill="#00A4EF" d="M12 0h11v11H12z"/>
                  <path fill="#7FBA00" d="M0 12h11v11H0z"/>
                  <path fill="#FFB900" d="M12 12h11v11H12z"/>
                </svg>
                <span>Connect Outlook Calendar</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Why connect your calendar?</strong> Merlin analyzes your upcoming meetings to provide you with personalized insights about attendees, companies, and relevant context to help you prepare effectively.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show onboarding questions if calendar is connected
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Almost there!</h1>
          <p className="text-gray-600">
            Let's set up your preferences for your meetings
          </p>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-3 rounded-lg ${saveMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {saveMessage}
          </div>
        )}

        <SettingsContent
          saveButtonText="Continue to Dashboard"
          onSaveComplete={handleSaveComplete}
        />
      </main>
    </div>
  );
};

export default Onboarding;
