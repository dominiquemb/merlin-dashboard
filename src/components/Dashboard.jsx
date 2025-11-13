import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { FiCheckCircle, FiEye, FiClock, FiCalendar, FiUsers, FiMapPin, FiX, FiSend } from 'react-icons/fi';
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

  useEffect(() => {
    loadTodaysMeetings();
  }, []);

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
            if (Array.isArray(event.attendees)) {
              attendees = event.attendees;
            } else if (typeof event.attendees === 'string') {
              // If it's a string, split by comma or newline
              attendees = event.attendees.split(/[,\n]/).filter(a => a.trim());
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
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
              Your Intelligence HQ
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
              <p className="text-sm text-gray-600">Mapping stakeholder relationships...</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View activity log →
            </button>
          </div>
        </div>

        {/* Today's Meetings */}
        <div className="mb-8">
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
              {todaysMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        {meeting.enrichmentStatus === 'processed' && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            Ready
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>{formatDate(meeting.start)} • {formatTime(meeting.start)} • {getDuration(meeting.start, meeting.end)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{getPlatform(meeting.location)}</span>
                        </div>
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FiUsers className="w-4 h-4" />
                            <span>{meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewBrief(meeting.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-medium transition"
                  >
                    View Full Brief
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unlock Premium Insights */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Unlock Premium Insights</h3>
          
          <div className="space-y-3">
            {/* Stakeholder Map */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
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
                <span className="text-sm">🔒</span>
                <span className="text-sm">Unlock</span>
              </button>
            </div>

            {/* Reputation Intelligence */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎯</span>
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
                <span className="text-sm">🔒</span>
                <span className="text-sm">Unlock</span>
              </button>
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
