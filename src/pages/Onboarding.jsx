import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SettingsContent from '../components/SettingsContent';
import { useNavigate } from 'react-router-dom';

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
  const [saveMessage, setSaveMessage] = useState('');

  // Prevent navigation away from onboarding until it's complete
  useEffect(() => {
    const checkOnboardingComplete = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        
        const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');
        const response = await fetch(`${apiUrl}/icp/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // If onboarding is already complete, allow navigation to dashboard
          if (data.has_icp_criteria && data.icp_criteria) {
            console.log('Onboarding already complete, user can navigate away');
            return;
          }
        }
      } catch (error) {
        console.log('Error checking onboarding status:', error);
      }
    };
    
    checkOnboardingComplete();
  }, []);

  // Handle calendar connected message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarConnected = urlParams.get('calendar_connected');
    
    if (calendarConnected === 'true') {
      setSaveMessage('✅ Calendar connected successfully! Please complete your onboarding below.');
      setTimeout(() => setSaveMessage(''), 5000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle save completion - redirect to dashboard with completion param
  const handleSaveComplete = () => {
    setSaveMessage('✅ Onboarding completed! Redirecting to dashboard...');
    setTimeout(() => {
      navigate('/dashboard?onboarding_completed=true');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Merlin!</h1>
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
