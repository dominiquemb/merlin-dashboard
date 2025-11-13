import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MeetingCard from '../components/MeetingCard';
import MeetingDetails from '../components/MeetingDetails';
import CreditsBadge from '../components/CreditsBadge';
import { useAuth } from '../contexts/AuthContext';
import { syncUserCalendar, fetchCalendarEvents } from '../lib/calendarApi';
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiRefreshCw, FiCheck, FiX, FiLink } from 'react-icons/fi';

const parseDateTime = (value) => {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  let date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    date = new Date(`${normalized}Z`);
  }
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateLabel = (date) =>
  date ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown date';

const formatTimeLabel = (date) =>
  date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:--';

const calculateDurationLabel = (start, end) => {
  if (!start || !end) return 'Unknown duration';
  const diffMs = end - start;
  if (Number.isNaN(diffMs) || diffMs <= 0) return 'Unknown duration';
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours} hr${hours > 1 ? 's' : ''}${remaining ? ` ${remaining} min` : ''}`;
};

const extractAttendees = (attendeesValue) => {
  if (!attendeesValue || attendeesValue === 'No Attendees') {
    return [];
  }

  return attendeesValue
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s*\(.+?\)$/, ''));
};

const createInitials = (name = '') => {
  const cleaned = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  if (cleaned) {
    return cleaned.slice(0, 2);
  }
  return 'NA';
};

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const findMatchingEnrichedAttendee = (enrichedList, attendee) => {
  if (!Array.isArray(enrichedList) || !attendee) return null;

  const candidateLinkedIn =
    attendee?.linkedin_url || attendee?.profile?.name?.linkedin_url;
  if (candidateLinkedIn) {
    const linkedMatch = enrichedList.find((person) => {
      const personLinkedIn = person?.linkedin_url || person?.linkedInUrl;
      return (
        typeof personLinkedIn === 'string' &&
        personLinkedIn.toLowerCase() === candidateLinkedIn.toLowerCase()
      );
    });
    if (linkedMatch) {
      return linkedMatch;
    }
  }

  const firstCandidate = (attendee?.profile?.name?.first || '')
    .trim()
    .toLowerCase();
  const lastCandidate = (attendee?.profile?.name?.last || '')
    .trim()
    .toLowerCase();

  if (firstCandidate || lastCandidate) {
    const nameMatch = enrichedList.find((person) => {
      const first = (person?.linkedin_first_name || '').trim().toLowerCase();
      const last = (person?.linkedin_last_name || '').trim().toLowerCase();
      return first === firstCandidate && last === lastCandidate;
    });
    if (nameMatch) {
      return nameMatch;
    }
  }

  return enrichedList.find((person) => {
    const enrichedEmail = (person?.email_address || '').toLowerCase();
    const attendeeEmail = (attendee?.profile?.email || attendee?.email || '').toLowerCase();
    return enrichedEmail && attendeeEmail && enrichedEmail === attendeeEmail;
  });
};

const normalizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const collectInsightsFromObject = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => collectInsightsFromObject(item))
      .flat()
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    const candidate =
      value.insight ||
      value.summary ||
      value.text ||
      value.description ||
      value.details ||
      value.note;
    if (candidate && typeof candidate === 'string') {
      const normalized = normalizeText(candidate);
      if (normalized) return [normalized];
    }

    const name = normalizeText(value.name || value.title || '');
    const detail = normalizeText(value.details || value.summary || value.reason || '');
    if (name || detail) {
      return [name && detail ? `${name}: ${detail}` : name || detail];
    }
  }

  return [];
};

const augmentMeetingWithEnrichment = (event, meeting) => {
  const enrichedSource = event.enriched_source || event.enrichedSource;
  const briefingSource = event.briefing_source || event.briefingSource;

  if (!enrichedSource && !briefingSource) {
    return meeting;
  }

  const enrichedCompanies = enrichedSource?.companies || {};
  const briefingCompanies = briefingSource?.companies || {};

  const attendeeDetails = [];
  const insights = new Set(meeting.insights || []);
  const recentActivity = new Set(meeting.recentActivity || []);
  let companyInfo = meeting.companyInfo || null;

  Object.entries(briefingCompanies).forEach(([companyName, companyData]) => {
    const companyLabel = companyName || '';
    const companyInfoBlock = companyData?.company_info || {};
    const enrichedAttendees = enrichedCompanies[companyName]?.attendees || [];

    if (!companyInfo && Object.keys(companyInfoBlock).length > 0) {
      companyInfo = {
        size:
          companyInfoBlock.employee_count ||
          companyInfoBlock.company_size ||
          'Unknown',
        industry: companyInfoBlock.industry || 'Unknown',
        revenue:
          companyInfoBlock.revenue_model ||
          companyInfoBlock.financial_performance ||
          'Unknown',
        website: companyInfoBlock.website || '',
        linkedin: companyInfoBlock.linkedin_url || '',
        headquarters: companyInfoBlock.headquarters || null,
      };
    }

    collectInsightsFromObject(companyInfoBlock?.custom_insights).forEach((item) =>
      insights.add(item)
    );
    collectInsightsFromObject(companyData?.stripe_product_recommendations).forEach((item) =>
      insights.add(item)
    );

    const recentNews = companyData?.recent_news;
    if (Array.isArray(recentNews)) {
      recentNews.forEach((newsItem) => {
        if (!newsItem) return;
        if (typeof newsItem === 'string') {
          const normalized = normalizeText(newsItem);
          if (normalized) recentActivity.add(normalized);
        } else if (typeof newsItem === 'object') {
          const headline = normalizeText(newsItem.headline || newsItem.title || '');
          const summary = normalizeText(newsItem.summary || newsItem.description || '');
          const combined = [headline, summary].filter(Boolean).join(' — ');
          if (combined) recentActivity.add(combined);
        }
      });
    } else if (typeof recentNews === 'string') {
      const normalized = normalizeText(recentNews);
      if (normalized) recentActivity.add(normalized);
    }

    ensureArray(companyData?.attendees).forEach((attendee) => {
      const enrichedMatch = findMatchingEnrichedAttendee(enrichedAttendees, attendee);

      const fullName = normalizeText(
        attendee?.name ||
          [attendee?.profile?.name?.first, attendee?.profile?.name?.last]
            .filter(Boolean)
            .join(' ')
      ) || 'Unknown attendee';

      const email = normalizeText(
        enrichedMatch?.email_address || attendee?.profile?.email || attendee?.email || ''
      );

      const linkedinUrl =
        attendee?.linkedin_url ||
        attendee?.profile?.name?.linkedin_url ||
        enrichedMatch?.linkedin_url ||
        enrichedMatch?.linkedInUrl ||
        '';

      if (Array.isArray(attendee?.similarities)) {
        attendee.similarities.forEach((similarity) => {
          if (!similarity) return;
          if (typeof similarity === 'string') {
            const normalized = normalizeText(similarity);
            if (normalized) insights.add(normalized);
          } else if (typeof similarity === 'object') {
            const description = normalizeText(
              similarity.description || similarity.summary || similarity.text || ''
            );
            if (description) insights.add(description);
          }
        });
      }

      const attendeeSummary = normalizeText(attendee?.summary || '');
      if (attendeeSummary) {
        insights.add(attendeeSummary);
      }

      const post = attendee?.social_media?.linkedin_post;
      if (post?.content) {
        const datePart = normalizeText(post.date || '');
        const content = normalizeText(post.content);
        const engagementParts = [];
        if (post.engagement?.likes) {
          engagementParts.push(`${post.engagement.likes} likes`);
        }
        if (post.engagement?.comments) {
          engagementParts.push(`${post.engagement.comments} comments`);
        }
        const engagement = engagementParts.length ? ` [${engagementParts.join(', ')}]` : '';
        const activityLine = `${fullName} • LinkedIn${datePart ? ` (${datePart})` : ''}: ${content}${engagement}`;
        recentActivity.add(activityLine.trim());
      }

      // Extract location from enrichedMatch if available
      const location = enrichedMatch?.location;
      let locationString = '';
      if (location) {
        const city = location.city || '';
        const state = location.state || '';
        const country = location.country || '';
        locationString = [city, state, country].filter(Boolean).join(', ');
      }

      attendeeDetails.push({
        initials: createInitials(fullName),
        name: fullName,
        title: normalizeText(
          attendee?.job_title || 
          attendee?.profile?.job_title || 
          enrichedMatch?.headline ||  // Add headline from Scrapin
          enrichedMatch?.job_title || 
          ''
        ),
        company: companyLabel || enrichedMatch?.company || '',
        email: email || undefined,
        phone:
          normalizeText(
            enrichedMatch?.phone ||
              enrichedMatch?.phone_number ||
              enrichedMatch?.phoneNumber ||
              ''
          ) || undefined,
        linkedin: linkedinUrl,
        location: locationString || undefined,  // Add location
        summary: attendeeSummary || undefined,
        similarities: attendee?.similarities || [],
      });
    });
  });

  meeting.attendeeDetails = attendeeDetails;
  meeting.insights = Array.from(insights).filter(Boolean);
  meeting.recentActivity = Array.from(recentActivity).filter(Boolean);
  meeting.companyInfo = companyInfo;
  meeting.enrichedSource = enrichedSource;
  meeting.briefingSource = briefingSource;
  meeting.hasEnrichment =
    attendeeDetails.length > 0 ||
    meeting.insights.length > 0 ||
    meeting.recentActivity.length > 0 ||
    !!companyInfo;

  return meeting;
};

const transformEventsToMeetings = (events = []) => {
  return events
    .map((event) => {
      const startDate = parseDateTime(event.start);
      const endDate = parseDateTime(event.end);
      const attendeesList = extractAttendees(event.attendees);

      const meeting = {
        id: event.event_id,
        title: event.event || 'Untitled meeting',
        time: startDate
          ? `${formatDateLabel(startDate)} • ${formatTimeLabel(startDate)}`
          : 'Scheduled time unavailable',
        duration: calculateDurationLabel(startDate, endDate),
        platform:
          event.location && event.location !== 'No Location'
            ? event.location
            : 'No location specified',
        type: attendeesList.length > 0 ? 'external' : 'internal',
        attendees: attendeesList.length > 0 ? attendeesList : ['Just you'],
        attendeeDetails: [],
        insights: [],
        recentActivity: [],
        companyInfo: null,
        startDate,
        endDate,
        startRaw: event.start,
        endRaw: event.end,
        source: 'calendar',
        rawEvent: event,
        description:
          event.description && event.description !== 'No Description'
            ? event.description
            : '',
        enrichmentStatus: event.enrichment_status,
        readyToSend: event.enriched_ready_to_send || false,
      };

      return augmentMeetingWithEnrichment(event, meeting);
    })
    .sort((a, b) => {
      const aTime = a.startDate ? a.startDate.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.startDate ? b.startDate.getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
};

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [meetingsError, setMeetingsError] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  const loadMeetings = useCallback(async () => {
    if (!user?.email) {
      setMeetings([]);
      setMeetingsError(null);
      return;
    }

    setIsLoadingMeetings(true);
    setMeetingsError(null);

    try {
      const response = await fetchCalendarEvents({ limit: 100, daysAhead: 30 });
      if (!response.success) {
        setMeetings([]);
        setMeetingsError(response.error || 'Unable to load meetings');
        return;
      }

      const transformed = transformEventsToMeetings(response.data?.events || []);
      setMeetings(transformed);
    } catch (error) {
      console.error('❌ [Meetings] Failed to load meetings:', error);
      setMeetings([]);
      setMeetingsError('Unable to load meetings');
    } finally {
      setIsLoadingMeetings(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      loadMeetings();
    } else {
      setMeetings([]);
      setSelectedMeetingId(null);
    }
  }, [user?.email, loadMeetings]);

  useEffect(() => {
    if (meetings.length > 0) {
      setSelectedMeetingId(meetings[0].id);
    } else {
      setSelectedMeetingId(null);
    }
  }, [meetings]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleConnectCalendar = (provider) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const authUrl = `${apiUrl}/${provider}`;
    window.location.href = authUrl;
  };

  const handleSyncCalendar = async () => {
    if (!user?.email) {
      setSyncStatus('error');
      setSyncMessage('Not logged in');
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    setSyncMessage('');

    try {
      const result = await syncUserCalendar(7);

      if (result.success) {
        const eventsCount = result.data.events_synced || 0;
        setSyncStatus('success');
        setSyncMessage(`Synced ${eventsCount} meeting${eventsCount !== 1 ? 's' : ''}!`);
        await loadMeetings();

        setTimeout(() => {
          setSyncStatus(null);
          setSyncMessage('');
        }, 3000);
      } else {
        const errorMsg = result.error || result.data?.error || '';

        if (errorMsg.toLowerCase().includes('no auth token')) {
          setSyncStatus('no_auth');
          setSyncMessage('Calendar not connected');
        } else {
          setSyncStatus('error');
          setSyncMessage(result.error || 'Failed to sync calendar');

          setTimeout(() => {
            setSyncStatus(null);
            setSyncMessage('');
          }, 5000);
        }
      }
    } catch (error) {
      console.error('❌ [Meetings] Unexpected sync error:', error);
      setSyncStatus('error');
      setSyncMessage('An unexpected error occurred');

      setTimeout(() => {
        setSyncStatus(null);
        setSyncMessage('');
      }, 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const renderMeetingsList = () => {
    if (isLoadingMeetings) {
      return (
        <div className="text-center py-12 text-gray-500">
          Loading meetings...
        </div>
      );
    }

    if (meetingsError) {
      return (
        <div className="text-center py-12 text-red-500">
          {meetingsError}
        </div>
      );
    }

    if (meetings.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No meetings found for the next 30 days.</p>
          <p className="text-gray-400 text-sm">Sync your calendar to pull in upcoming meetings.</p>
        </div>
      );
    }

    return meetings.map((meeting) => (
      <MeetingCard
        key={meeting.id}
        meeting={meeting}
        isSelected={selectedMeetingId === meeting.id}
        onClick={() => setSelectedMeetingId(meeting.id)}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Meetings List */}
        <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Meetings</h2>

            {/* Credit Badge */}
            <div className="mb-4">
              <CreditsBadge
                text="1 credit/meeting"
                icon={<FiCreditCard />}
              />
            </div>

            {/* Reminder Text */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                We focus on researching new meetings only and exclude repeated meetings or attendees to help conserve your credits.
              </p>
            </div>

            {/* Sync Calendar Button */}
            <div className="mb-4">
              {syncStatus === 'no_auth' ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 text-center mb-2">
                    Connect your calendar to sync meetings
                  </div>
                  <button
                    onClick={() => handleConnectCalendar('google')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <FiLink className="w-4 h-4" />
                    <span>Connect Google Calendar</span>
                  </button>
                  <button
                    onClick={() => handleConnectCalendar('microsoft')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <FiLink className="w-4 h-4" />
                    <span>Connect Outlook Calendar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSyncCalendar}
                  disabled={isSyncing}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    syncStatus === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : syncStatus === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isSyncing ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isSyncing ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span>Syncing Calendar...</span>
                    </>
                  ) : syncStatus === 'success' ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>{syncMessage}</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <FiX className="w-4 h-4" />
                      <span>{syncMessage}</span>
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="w-4 h-4" />
                      <span>Sync Calendar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition"
              >
                Today
              </button>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Current Date */}
            <p className="text-sm text-gray-600 mt-3">{formatDate(currentDate)}</p>
          </div>

          {/* Meetings List */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderMeetingsList()}
          </div>
        </div>

        {/* Right Panel - Meeting Details */}
        <MeetingDetails meeting={selectedMeeting} />
      </div>
    </div>
  );
};

export default Meetings;
