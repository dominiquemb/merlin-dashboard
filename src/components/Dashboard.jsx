import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { FiCheckCircle, FiEye, FiClock, FiCalendar, FiUsers, FiMapPin, FiX, FiSend, FiZap, FiVideo, FiTrendingUp, FiArrowRight, FiAward, FiInfo, FiLock, FiTarget } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { fetchCalendarEvents } from '../lib/calendarApi';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [stats, setStats] = useState({
    meetingsPrepared: 0,
    insightsGenerated: 0,
    hoursSaved: 0,
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [liveAgentMessage, setLiveAgentMessage] = useState('Mapping stakeholder relationships...');
  const messageIndexRef = useRef(0);

  useEffect(() => {
    loadTodaysMeetings();
  }, []);

  // Live Agent Activity - Rotating contextual messages (UI theatre)
  useEffect(() => {
    const formatDateForMessage = (date) => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    const getContextualMessages = () => {
      const messages = [];

      // Context-aware messages based on actual data
      if (todaysMeetings.length > 0) {
        const meeting = todaysMeetings[0];
        messages.push(
          `Analyzing stakeholders for "${meeting.title.substring(0, 30)}${meeting.title.length > 30 ? '...' : ''}"...`,
          `Gathering intelligence for ${meeting.attendees?.length || 0} attendee${meeting.attendees?.length !== 1 ? 's' : ''}...`,
          `Preparing briefing for ${formatDateForMessage(meeting.start)} meeting...`,
          `Enriching attendee profiles for ${meeting.title.substring(0, 25)}...`
        );
      }

      if (stats.meetingsPrepared > 0) {
        messages.push(
          `Processing ${stats.meetingsPrepared} meeting brief${stats.meetingsPrepared !== 1 ? 's' : ''}...`,
          `Generating insights for ${stats.meetingsPrepared} prepared meeting${stats.meetingsPrepared !== 1 ? 's' : ''}...`
        );
      }

      if (stats.insightsGenerated > 0) {
        messages.push(
          `Compiling ${stats.insightsGenerated} intelligence insight${stats.insightsGenerated !== 1 ? 's' : ''}...`,
          `Synthesizing ${stats.insightsGenerated} data point${stats.insightsGenerated !== 1 ? 's' : ''}...`
        );
      }

      // Generic fallback messages (always available)
      const genericMessages = [
        'Mapping stakeholder relationships...',
        'Analyzing company backgrounds...',
        'Gathering LinkedIn activity data...',
        'Compiling executive movement alerts...',
        'Tracking press mentions and sentiment...',
        'Building influence maps...',
        'Identifying decision makers...',
        'Collecting competitive intelligence...',
        'Enriching attendee profiles...',
        'Generating meeting briefs...',
        'Analyzing buying committee structure...',
        'Compiling recent company news...',
        'Processing enrichment data...',
        'Synthesizing market intelligence...'
      ];

      return [...messages, ...genericMessages];
    };

    const messages = getContextualMessages();
    if (messages.length === 0) return;

    // Reset index when data changes (new messages available)
    messageIndexRef.current = 0;

    // Set initial message
    setLiveAgentMessage(messages[messageIndexRef.current]);

    // Rotate messages every 3 seconds
    const interval = setInterval(() => {
      // Regenerate messages in case data changed
      const currentMessages = getContextualMessages();
      if (currentMessages.length > 0) {
        messageIndexRef.current = (messageIndexRef.current + 1) % currentMessages.length;
        setLiveAgentMessage(currentMessages[messageIndexRef.current]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [todaysMeetings, stats.meetingsPrepared, stats.insightsGenerated]);

  const loadTodaysMeetings = async () => {
    setIsLoadingMeetings(true);
    try {
      console.log('Dashboard: Fetching calendar events...');
      const result = await fetchCalendarEvents({ limit: 10, daysAhead: 7 }); // Fetch up to 10 events for next 7 days
      console.log('Dashboard: Fetch result:', result);
      
      // Handle the wrapped response format
      const events = result.success ? result.data.events : [];
      console.log('Dashboard: Extracted events:', events);
      
      if (events && events.length > 0) {
        console.log(`Dashboard: Found ${events.length} events`);
        // Filter and transform events
        const now = new Date();
        const upcoming = events
          .filter(event => {
            const eventStart = new Date(event.start);
            return eventStart >= now;
          })
          .slice(0, 3) // Show only the 3 most recent upcoming meetings
          .map(event => {
            // Parse attendees - could be array or string
            let attendees = [];
            const userEmailLower = user?.email?.toLowerCase() || '';
            if (Array.isArray(event.attendees)) {
              attendees = event.attendees.filter(att => {
                // Extract email from attendee if present
                const emailMatch = (typeof att === 'string' ? att : att.email || '').match(/[\w\.-]+@[\w\.-]+\.\w+/);
                const attEmail = emailMatch ? emailMatch[0].toLowerCase() : (typeof att === 'string' ? att : att.email || '').toLowerCase();
                return attEmail !== userEmailLower;
              });
            } else if (typeof event.attendees === 'string') {
              // If it's a string, split by semicolon (same format as Meetings page)
              // Format: "email (status); email2 (status)" or "Name (email@domain.com) (status)"
              // Use the same logic as Meetings.jsx extractAttendees
              attendees = event.attendees
                .split(';')
                .map(a => a.trim())
                .filter(Boolean)
                .map(a => a.replace(/\s*\(.+?\)$/, '')) // Remove status part (last parentheses)
                .filter(a => {
                  // Extract email from string if present (format: "Name (email@domain.com)" or "email@domain.com")
                  const emailMatch = a.match(/[\w\.-]+@[\w\.-]+\.\w+/);
                  const itemEmail = emailMatch ? emailMatch[0].toLowerCase() : a.toLowerCase();
                  // Filter out the user's email
                  return itemEmail !== userEmailLower;
                });
            }
            
            // Debug: Log location to see what we're getting
            if (event.location) {
              console.log('[Dashboard] Event location:', {
                event_id: event.event_id,
                location: event.location,
                locationType: typeof event.location,
              });
            }

            return {
              id: event.event_id,
              title: event.event || 'Untitled Meeting',
              start: new Date(event.start),
              end: new Date(event.end),
              location: event.location || 'No location',
              attendees: attendees,
              enrichmentStatus: event.enrichment_status,
            };
          });

        console.log(`Dashboard: Upcoming meetings:`, upcoming);
        setTodaysMeetings(upcoming);

        // Calculate stats from all events
        const enrichedCount = events.filter(e => 
          e.enrichment_status === 'processed' || e.enrichment_status === 'ready'
        ).length;
        
        const totalInsights = events.filter(e => e.briefing_source).length * 3; // Estimate 3 insights per enriched meeting
        const hoursSaved = enrichedCount * 0.5; // Estimate 30 min (0.5 hours) saved per meeting

        console.log('Dashboard: Stats calculated:', { enrichedCount, totalInsights, hoursSaved });

        setStats({
          meetingsPrepared: enrichedCount,
          insightsGenerated: totalInsights,
          hoursSaved: hoursSaved.toFixed(1),
        });
      } else {
        console.log('Dashboard: No events found');
      }
    } catch (error) {
      console.error('Dashboard: Error loading meetings:', error);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Unknown time';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (dateOnly.getTime() === today.getTime()) {
      return timeStr;
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${dateStr} ${timeStr}`;
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDuration = (start, end) => {
    const durationMs = end - start;
    const minutes = Math.round(durationMs / (1000 * 60));
    return `${minutes} min`;
  };

  const getPlatform = (location) => {
    if (!location || location === 'No location') return 'Meeting';
    if (location.includes('zoom')) return 'Zoom';
    if (location.includes('meet.google')) return 'Google Meet';
    if (location.includes('teams')) return 'Microsoft Teams';
    return 'Meeting';
  };

  // Extract company name from meeting title (e.g., "Demo - TechCo" -> "TechCo")
  const extractCompanyName = (title) => {
    if (!title) return null;
    // Common patterns: "Meeting - Company", "Demo: Company", "Company - Meeting"
    const patterns = [
      /[-–—]\s*([^-–—]+)$/, // "Meeting - Company"
      /:\s*([^:]+)$/, // "Meeting: Company"
      /^([^-–—:]+)\s*[-–—]/, // "Company - Meeting"
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: try to extract capitalized words
    const words = title.split(/\s+/);
    const capitalized = words.filter(w => w[0] && w[0] === w[0].toUpperCase() && w.length > 2);
    return capitalized.length > 0 ? capitalized[0] : null;
  };

  // Calculate average prep time from meetings prepared
  // If we have hours saved and meetings prepared, calculate average
  // Otherwise use a reasonable estimate based on meetings
  const calculateAvgPrepTime = () => {
    if (stats.meetingsPrepared > 0 && stats.hoursSaved > 0) {
      // Convert hours to minutes and divide by meetings
      const avgMinutes = Math.round((stats.hoursSaved * 60) / stats.meetingsPrepared);
      return Math.max(1, Math.min(60, avgMinutes)); // Cap between 1-60 mins for display
    }
    // Estimate: assume 8-15 mins per meeting on average
    return stats.meetingsPrepared > 0 ? Math.round(45 / Math.max(1, stats.meetingsPrepared)) + 5 : 8;
  };

  // Calculate upgrade opportunities data from real meetings
  const getUpgradeOpportunitiesData = () => {
    // Find meeting with most attendees for "Map the buying committee"
    const meetingWithMostAttendees = todaysMeetings.reduce((max, meeting) => {
      const attendeeCount = meeting.attendees?.length || 0;
      const maxCount = max.attendees?.length || 0;
      return attendeeCount > maxCount ? meeting : max;
    }, todaysMeetings[0] || {});

    const topMeetingAttendees = meetingWithMostAttendees?.attendees?.length || 0;
    const companyName = extractCompanyName(meetingWithMostAttendees?.title) || 'this deal';

    // Count total unique attendees across all meetings
    // Attendees can be strings (names or emails) or objects with email property
    const allUniqueAttendees = new Set();
    todaysMeetings.forEach(meeting => {
      meeting.attendees?.forEach(att => {
        if (typeof att === 'string') {
          // Clean up attendee string (remove status, email, etc.)
          const cleaned = att.trim().split(/[(\[]/)[0].trim(); // Remove "(status)" or "[email]"
          if (cleaned) {
            allUniqueAttendees.add(cleaned.toLowerCase());
          }
        } else if (att?.email) {
          allUniqueAttendees.add(att.email.toLowerCase());
        } else if (att?.name) {
          allUniqueAttendees.add(att.name.toLowerCase());
        }
      });
    });
    const totalContacts = allUniqueAttendees.size;

    // Get company names for reputation tracking
    const companyNames = todaysMeetings
      .map(m => extractCompanyName(m.title))
      .filter(Boolean);
    const primaryCompany = companyNames[0] || null;

    return {
      topMeetingAttendees,
      companyName,
      totalContacts,
      primaryCompany,
      hasMultipleMeetings: todaysMeetings.length > 1,
      meetingCount: todaysMeetings.length,
    };
  };

  const handleViewBrief = (meetingId) => {
    navigate(`/meetings`); // Navigate to meetings page (can be enhanced to scroll to specific meeting)
  };

  const handleUnlockInsight = (insightTitle) => {
    setSelectedInsight(insightTitle);
    setEmailMessage(`Hi Merlin, I'd like to find out more about "${insightTitle}".`);
    setEmailSent(false);
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    
    setIsSendingEmail(true);
    try {
      const formData = new FormData();
      formData.append('name', user?.user_metadata?.full_name || user?.email || 'User');
      formData.append('email', user?.email || '');
      formData.append('message', emailMessage);
      formData.append('_subject', `Premium Insight Inquiry: ${selectedInsight}`);
      formData.append('_captcha', 'false');
      
      const response = await fetch('https://formsubmit.co/insights@usemerlin.io', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Email sent successfully to insights@usemerlin.io');
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
        }, 2000);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Insights HQ
            </h1>
            <p className="text-gray-600">
              You're outperforming 90% of sales professionals
            </p>
          </div>
          
          {/* Daily Streak Badge */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-sm font-medium">Daily Streak</span>
            <span className="text-2xl font-bold">7</span>
            <span className="text-xl">🔥</span>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Meetings Prepared */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.meetingsPrepared}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Meetings Prepared</p>
          </div>

          {/* Insights Generated */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiEye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.insightsGenerated}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Insights Generated</p>
          </div>

          {/* Research Time Saved */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FiClock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.hoursSaved}h</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Research Time Saved</p>
          </div>
        </div>

        {/* Live Agent Activity */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Live Agent Activity</p>
              <p className="text-sm text-gray-600 transition-opacity duration-500">{liveAgentMessage}</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View activity log →
            </button>
          </div>
        </div>

        {/* Main Content Grid - Today's Meetings (Left) and Upgrade Opportunities (Right) */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mb-8">
          {/* Left Column: Today's Meetings */}
          <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Meetings</h2>
          
          {isLoadingMeetings ? (
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FiCalendar className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-600">Loading meetings...</p>
            </div>
          ) : todaysMeetings.length === 0 ? (
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-600">No upcoming meetings</p>
            </div>
          ) : (
            <div className="space-y-4">
                {todaysMeetings.map((meeting) => {
                  // Format attendee names and emails - attendees are strings from extractAttendees
                  // Format after processing: "Name (email@domain.com)" or "email@domain.com"
                  // Just display them as-is (they already contain email)
                  const attendeeDisplay = meeting.attendees?.slice(0, 2) || [];
                  
                  // Estimate key insights - show for all meetings per screenshot
                  const keyInsightsCount = 3; // Always show 3 key insights per screenshot
                  const premiumInsightsCount = 1; // Always show 1 premium insight per screenshot
                  const isReady = meeting.enrichmentStatus === 'processed' || meeting.enrichmentStatus === 'ready';
                  // Calculate ICP Score (placeholder - could be from actual data)
                  const icpScore = 14; // Placeholder

                  return (
                    <div key={meeting.id} className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                      {/* Meeting Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{meeting.title}</h3>

                      {/* Status Tags */}
                      <div className="flex items-center gap-2 mb-4">
                        {isReady ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            Ready
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                            Preparing
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                          ICP Score: {icpScore}/15
                        </span>
                      </div>

                      {/* Meeting Details - Single Row, Evenly Spaced */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FiClock className="w-4 h-4" />
                          <span>{formatTime(meeting.start)} • {getDuration(meeting.start, meeting.end)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FiVideo className="w-4 h-4" />
                          <span>
                            {(() => {
                              const loc = meeting.location;
                              if (!loc) return 'Meeting';
                              if (typeof loc !== 'string') return 'Meeting';
                              const trimmed = loc.trim();
                              if (!trimmed || trimmed === 'No Location' || trimmed === 'No location') return 'Meeting';
                              return trimmed;
                            })()}
                          </span>
                        </div>
                        {attendeeDisplay.length > 0 ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiUsers className="w-4 h-4" />
                            <span>{attendeeDisplay.join(', ')}{meeting.attendees?.length > 2 ? `, +${meeting.attendees.length - 2} more` : ''}</span>
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>

                      {/* Insights Info - Single Row */}
                      <div className="flex items-center gap-4 flex-wrap mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <FiCheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">{keyInsightsCount} key insight{keyInsightsCount !== 1 ? 's' : ''} ready</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FiLock className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">{premiumInsightsCount} premium insight{premiumInsightsCount !== 1 ? 's' : ''} available</span>
                        </div>
                      </div>

                      {/* View Full Brief Button */}
                      <button
                        onClick={() => handleViewBrief(meeting.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-medium transition"
                      >
                        View Full Brief
                      </button>

                      {/* Unlock Premium Insights Section - Show for all meetings */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Unlock Premium Insights</h4>
                          <div className="space-y-3">
                            {/* Stakeholder Map */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FiUsers className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-1">Stakeholder Map</h4>
                                  <p className="text-sm text-gray-600">
                                    See the full buying committee and influence map
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnlockInsight('Stakeholder Map')}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition flex-shrink-0 ml-4"
                              >
                                <FiLock className="w-4 h-4" />
                                <span className="text-sm">Unlock</span>
                              </button>
                            </div>

                            {/* Reputation Intelligence */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FiTarget className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-1">Reputation Intelligence</h4>
                                  <p className="text-sm text-gray-600">
                                    Track press mentions, sentiment, and executive moves
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnlockInsight('Reputation Intelligence')}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition flex-shrink-0 ml-4"
                              >
                                <FiLock className="w-4 h-4" />
                                <span className="text-sm">Unlock</span>
                              </button>
                            </div>
                          </div>
                        </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

          {/* Right Column: Performance Dashboard and Upgrade Opportunities */}
          <div>
            {/* Performance Dashboard */}
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Dashboard</h2>
              
              {/* Overall Performance */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiAward className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Top 10% of AEs</p>
                  <p className="text-sm text-gray-600">You're outperforming 90% of sales professionals</p>
                </div>
            </div>

              {/* Key Metrics */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your avg prep time</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateAvgPrepTime()} mins</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Industry average</p>
                  <p className="text-2xl font-bold text-gray-700">45 mins</p>
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiInfo className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Pro Tip</p>
                  <p className="text-sm text-gray-600">
                      AEs using Stakeholder Intelligence close 40% faster. Try it on your next deal.
                  </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Opportunities */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiZap className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Upgrade Opportunities</h2>
              </div>

            {(() => {
              const upgradeData = getUpgradeOpportunitiesData();
              
              return (
                <div className="space-y-4">
                  {/* Map the buying committee - Show only if we have meetings with attendees */}
                  {upgradeData.topMeetingAttendees > 0 && (
                    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiUsers className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Map the buying committee</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {upgradeData.companyName !== 'this deal' ? `${upgradeData.companyName} deal` : 'This deal'} involves {upgradeData.topMeetingAttendees} decision-maker{upgradeData.topMeetingAttendees !== 1 ? 's' : ''}. See who influences who. Increase win rate by 40%
                          </p>
                          <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                            Learn more <FiArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Know who else influences the deal - Show only if we have meetings */}
                  {upgradeData.meetingCount > 0 && (
                    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiTrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Know who else influences the deal</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {upgradeData.hasMultipleMeetings 
                              ? `You have ${upgradeData.meetingCount} upcoming meeting${upgradeData.meetingCount !== 1 ? 's' : ''}. Identify hidden stakeholders and power dynamics within your target accounts.`
                              : 'Identify hidden stakeholders and power dynamics within your target accounts.'
                            }
                          </p>
                          <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                            Learn more <FiArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enrich contacts in pipeline - Show only if we have contacts */}
                  {upgradeData.totalContacts > 0 && (
                    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiZap className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Enrich {upgradeData.totalContacts} contact{upgradeData.totalContacts !== 1 ? 's' : ''} in pipeline</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Missing key data on prospects could slow your deals. Close 2-3 days faster
                          </p>
                          <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                            Learn more <FiArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Track reputation signals - Show only if we have company names */}
                  {upgradeData.primaryCompany && (
                    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiTrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Track the latest moves and stay one step ahead</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Monitor {upgradeData.primaryCompany}'s press, social sentiment, and executive moves. Stay ahead of account changes
                          </p>
                          <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                            Learn more <FiArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback messages if no data */}
                  {upgradeData.meetingCount === 0 && (
                    <>
                      {/* Map the buying committee - Generic */}
                      <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiUsers className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Map the buying committee</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              See who influences who in your target accounts. Increase win rate by 40%
                            </p>
                            <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                              Learn more <FiArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Know who else influences the deal - Generic */}
                      <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiTrendingUp className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Know who else influences the deal</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Identify hidden stakeholders and power dynamics within your target accounts
                            </p>
                            <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                              Learn more <FiArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Enrich contacts - Generic */}
                      <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiZap className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Enrich contacts in pipeline</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Missing key data on prospects could slow your deals. Close 2-3 days faster
                            </p>
                            <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                              Learn more <FiArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Track reputation signals - Generic */}
                      <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiTrendingUp className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Track the latest moves and stay one step ahead</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Monitor press, social sentiment, and executive moves. Stay ahead of account changes
                            </p>
                            <a href="/services" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                              Learn more <FiArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Explore All Services Button */}
                  <a
                    href="/services"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-medium transition text-center"
                  >
                    Explore All Services
                  </a>
                </div>
              );
            })()}
            </div>
          </div>
        </div>
      </main>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-6 h-6" />
            </button>

            {emailSent ? (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">
                  We'll get back to you shortly about {selectedInsight}.
                </p>
              </div>
            ) : (
              /* Email Form */
              <form onSubmit={handleSendEmail}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Send us a message about <span className="font-semibold">{selectedInsight}</span>
                </p>

                <div className="space-y-4">
                  {/* From (user's email) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* To (fixed) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <input
                      type="email"
                      value="insights@usemerlin.io"
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={5}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail || !emailMessage.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingEmail ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
