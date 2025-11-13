import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ICPMeetingCard from '../components/ICPMeetingCard';
import CreditsBadge from '../components/CreditsBadge';
import { FiAlertCircle, FiCalendar, FiCreditCard, FiRefreshCw, FiArrowRight } from 'react-icons/fi';

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

const ICPAnalysis = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [hasEnrichedMeetings, setHasEnrichedMeetings] = useState(true);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [icpFitMeetings, setIcpFitMeetings] = useState([]);
  const [nonIcpMeetings, setNonIcpMeetings] = useState([]);

  // Get current week range
  const getWeekRange = () => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(today)} - ${formatDate(endDate)}, ${today.getFullYear()}`;
  };

  const weekRange = getWeekRange();

  // Fetch enriched meetings with ICP analysis
  const fetchMeetingsWithICP = async () => {
    setIsLoadingMeetings(true);
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      console.log('Fetching meetings with ICP from:', `${apiUrl}/calendar/events?days_ahead=7`);
      
      const response = await fetch(`${apiUrl}/calendar/events?days_ahead=7&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.events && result.events.length > 0) {
        // Process meetings to separate ICP fit vs non-fit
        const icpFit = [];
        const nonIcp = [];
        
        result.events.forEach(event => {
          const briefingSource = event.briefing_source;
          if (!briefingSource || !briefingSource.companies) {
            console.log(`Event ${event.event_id} has no briefing_source or companies`);
            return;
          }
          
          // Check if any company in the meeting fits ICP
          let fitsIcp = false;
          let icpReasons = [];
          let nonIcpReasons = [];
          
          Object.entries(briefingSource.companies).forEach(([companyName, companyData]) => {
            console.log(`Checking ICP for company: ${companyName}`);
            const icpAnalysis = companyData.icp_analysis;
            console.log('ICP Analysis:', icpAnalysis);
            if (icpAnalysis) {
              if (icpAnalysis.fits_icp) {
                console.log(`✅ ${companyName} FITS ICP`);
                fitsIcp = true;
                icpReasons = icpAnalysis.icp_fit_reasons || [];
              } else {
                console.log(`❌ ${companyName} does NOT fit ICP`);
                nonIcpReasons = icpAnalysis.icp_non_fit_reasons || [];
              }
            } else {
              console.log(`No ICP analysis found for ${companyName}`);
            }
          });
          
          // Transform to UI format
          const meeting = transformEventToICPMeeting(event, fitsIcp, icpReasons, nonIcpReasons);
          
          console.log(`Event ${event.event}: fitsIcp=${fitsIcp}, icpReasons=${icpReasons}, nonIcpReasons=${nonIcpReasons}`);
          
          if (fitsIcp) {
            icpFit.push(meeting);
          } else if (nonIcpReasons.length > 0) {
            nonIcp.push(meeting);
          }
        });
        
        setIcpFitMeetings(icpFit);
        setNonIcpMeetings(nonIcp);
        setHasEnrichedMeetings(true);
      } else {
        setHasEnrichedMeetings(false);
      }
    } catch (error) {
      console.error('Error fetching meetings with ICP:', error);
      console.error('Error details:', error.message);
      setErrorMessage(`Failed to load meetings: ${error.message}`);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const transformEventToICPMeeting = (event, fitsIcp, icpReasons, nonIcpReasons) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const duration = Math.round((endDate - startDate) / (1000 * 60)); // minutes
    
    // Extract attendees
    const attendees = [];
    if (event.attendees && Array.isArray(event.attendees)) {
      event.attendees.forEach(attendee => {
        const name = attendee.name || attendee.email || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        attendees.push({ name, initials });
      });
    }
    
    // Extract company from briefing_source
    let company = 'Unknown';
    if (event.briefing_source && event.briefing_source.companies) {
      const companies = Object.keys(event.briefing_source.companies);
      if (companies.length > 0) {
        company = companies[0];
      }
    }
    
    // Extract platform from location
    let platform = 'Meeting';
    if (event.location) {
      if (event.location.includes('zoom')) platform = 'Zoom';
      else if (event.location.includes('meet.google')) platform = 'Google Meet';
      else if (event.location.includes('teams')) platform = 'Microsoft Teams';
    }
    
    return {
      id: event.event_id,
      title: event.event || event.summary || 'Untitled Meeting',
      date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: `${duration} min`,
      company,
      platform,
      attendees,
      icpScore: {
        score: fitsIcp ? 12 : 4,
        maxScore: 15,
      },
      reasons: fitsIcp ? icpReasons : nonIcpReasons,
    };
  };

  useEffect(() => {
    fetchMeetingsWithICP();
  }, []);

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/icp/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResults(result);
        setHasEnrichedMeetings(true);
        // Reload meetings to get updated ICP analysis
        await fetchMeetingsWithICP();
      } else {
        if (!result.has_enriched_meetings) {
          setHasEnrichedMeetings(false);
        } else {
          setErrorMessage(result.message || 'Analysis failed');
        }
      }
    } catch (error) {
      console.error('Error generating ICP analysis:', error);
      setErrorMessage('Failed to generate ICP analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoToMeetings = () => {
    navigate('/meetings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">ICP Analysis</h1>
              <CreditsBadge 
                text="1 credit/analysis"
                icon={<FiCreditCard />}
              />
            </div>
            <button
              onClick={handleGenerateAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Generate ICP Analysis'}
            </button>
          </div>
          <p className="text-gray-600">
            Review upcoming meetings with low alignment to your Ideal Customer Profile
          </p>
        </div>

        {/* No Enriched Meetings Message */}
        {!hasEnrichedMeetings && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  No Enriched Meetings Found
                </h2>
                <p className="text-gray-700 mb-3">
                  You need to sync your calendar and wait for enrichment to complete before running ICP analysis.
                </p>
                <button
                  onClick={handleGoToMeetings}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Go to Your Meetings
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Success Message */}
        {analysisResults && analysisResults.success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
            <p className="text-green-800 font-medium">{analysisResults.message}</p>
            <p className="text-green-700 text-sm mt-1">
              Total meetings analyzed: {analysisResults.total_meetings} | 
              ICP Fit: {analysisResults.icp_fit_count} | 
              Non-ICP: {analysisResults.non_icp_count}
            </p>
          </div>
        )}


        {/* Loading State */}
        {isLoadingMeetings && (
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FiRefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading meetings...
            </h3>
          </div>
        )}

        {/* ICP Fit Meetings Summary (if any) */}
        {!isLoadingMeetings && icpFitMeetings.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Meetings That Fit Your ICP
                </h2>
                <p className="text-lg text-gray-700 mb-2">
                  <span className="font-bold">{icpFitMeetings.length} meetings</span>{' '}
                  <span className="text-gray-600">this week match your ideal customer profile</span>
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCalendar className="w-4 h-4" />
                  <span>{weekRange}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Non-ICP Meetings Alert Summary */}
        {!isLoadingMeetings && nonIcpMeetings.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiAlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Meetings That Don't Fit Your ICP
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                  <span className="font-bold">{nonIcpMeetings.length} meetings</span>{' '}
                <span className="text-gray-600">this week</span>
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="w-4 h-4" />
                <span>{weekRange}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Non-ICP Meeting Cards */}
        {!isLoadingMeetings && nonIcpMeetings.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Non-ICP Meetings</h3>
            {nonIcpMeetings.map((meeting) => (
              <ICPMeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}

        {/* ICP Fit Meeting Cards */}
        {!isLoadingMeetings && icpFitMeetings.length > 0 && (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ICP Fit Meetings</h3>
            {icpFitMeetings.map((meeting) => (
            <ICPMeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
        )}

        {/* Empty State (shown when no meetings with ICP analysis) */}
        {!isLoadingMeetings && nonIcpMeetings.length === 0 && icpFitMeetings.length === 0 && hasEnrichedMeetings && (
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No ICP Analysis Available
            </h3>
            <p className="text-gray-600 mb-4">
              Click "Generate ICP Analysis" to analyze your upcoming meetings against your Ideal Customer Profile.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ICPAnalysis;
