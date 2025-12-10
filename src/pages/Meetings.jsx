import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MeetingCard from '../components/MeetingCard';
import MeetingDetails from '../components/MeetingDetails';
import CreditsBadge from '../components/CreditsBadge';
import { useAuth } from '../contexts/AuthContext';
import { syncUserCalendar, fetchCalendarEvents } from '../lib/calendarApi';
import { getCreditBalance } from '../lib/billingApi';
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiRefreshCw, FiCheck, FiX, FiLink, FiAlertCircle, FiInfo, FiClock } from 'react-icons/fi';

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

const extractAttendees = (attendeesValue, userEmail) => {
  if (!attendeesValue || attendeesValue === 'No Attendees') {
    return [];
  }

  const userEmailLower = userEmail?.toLowerCase() || '';
  
  return attendeesValue
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s*\(.+?\)$/, ''))
    .filter((item) => {
      // Extract email from string if present (format: "Name (email@domain.com)" or "email@domain.com")
      const emailMatch = item.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      const itemEmail = emailMatch ? emailMatch[0].toLowerCase() : item.toLowerCase();
      // Filter out the user's email
      return itemEmail !== userEmailLower;
    });
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

const augmentMeetingWithEnrichment = (event, meeting, userEmail) => {
  const enrichedSource = event.enriched_source || event.enrichedSource;
  const briefingSource = event.briefing_source || event.briefingSource;

  if (!enrichedSource && !briefingSource) {
    return meeting;
  }

  const enrichedCompanies = enrichedSource?.companies || {};
  const briefingCompanies = briefingSource?.companies || {};
  const userEmailLower = userEmail?.toLowerCase() || '';

  const attendeeDetails = [];
  const insights = new Set(meeting.insights || []);
  const recentLinkedInPosts = []; // Store LinkedIn posts separately
  const recentNews = []; // Store news items separately
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

    // Collect recent news items separately (matching email format)
    const companyRecentNews = companyData?.recent_news;
    if (Array.isArray(companyRecentNews)) {
      companyRecentNews.forEach((newsItem) => {
        if (!newsItem) return;
        if (typeof newsItem === 'string') {
          const normalized = normalizeText(newsItem);
          if (normalized) {
            recentNews.push({
              text: normalized,
              type: 'string'
            });
          }
        } else if (typeof newsItem === 'object') {
          // Store news item with all fields (matching email template structure)
          const title = normalizeText(newsItem.title || '');
          const snippet = normalizeText(newsItem.snippet || '');
          const source = normalizeText(newsItem.source || '');
          const date = normalizeText(newsItem.date || '');
          const link = newsItem.link || '';
          
          // Build formatted news text like email template
          let newsText = '';
          if (title) {
            newsText = title;
          }
          if (snippet) {
            newsText = newsText ? `${newsText} — ${snippet}` : snippet;
          }
          if (source || date) {
            const sourceDate = [source, date].filter(Boolean).join(', ');
            newsText = newsText ? `${newsText} (${sourceDate})` : sourceDate;
          }
          
          if (newsText) {
            recentNews.push({
              text: newsText,
              title: title || undefined,
              snippet: snippet || undefined,
              source: source || undefined,
              date: date || undefined,
              link: link || undefined,
              type: 'object'
            });
          }
        }
      });
    } else if (typeof companyRecentNews === 'string') {
      const normalized = normalizeText(companyRecentNews);
      if (normalized) {
        recentNews.push({
          text: normalized,
          type: 'string'
        });
      }
    }

    ensureArray(companyData?.attendees).forEach((attendee) => {
      const enrichedMatch = findMatchingEnrichedAttendee(enrichedAttendees, attendee);

      const fullName = normalizeText(
        attendee?.name ||
          [attendee?.profile?.name?.first, attendee?.profile?.name?.last]
            .filter(Boolean)
            .join(' ')
      ) || 'Unknown attendee';

      const linkedinUrl =
        attendee?.linkedin_url ||
        attendee?.profile?.name?.linkedin_url ||
        enrichedMatch?.linkedin_url ||
        enrichedMatch?.linkedInUrl ||
        '';

      const email = normalizeText(
        enrichedMatch?.email_address || attendee?.profile?.email || attendee?.email || ''
      );

      // Filter out the user's own email - but be careful: sometimes the user's email gets incorrectly
      // associated with attendees during enrichment. Only filter if we're very confident it's the user.
      // If the attendee has a LinkedIn URL, they're likely a real attendee even if email matches user's email
      if (email && userEmailLower) {
        const emailLower = email.toLowerCase();
        if (emailLower === userEmailLower) {
          // Only filter if there's no LinkedIn URL (which would indicate it's a real attendee profile)
          // AND if the fullName is just the email address (indicating it's the user, not a real attendee)
          const hasLinkedInUrl = linkedinUrl && linkedinUrl.trim();
          const fullNameLower = fullName.toLowerCase();
          const emailAsName = emailLower === fullNameLower || fullNameLower === emailLower.replace('@', ' ');
          
          // If it has a LinkedIn URL, keep it - it's a real attendee with possibly incorrect email
          // If there's no LinkedIn URL and the name is just the email, it's likely the user
          if (!hasLinkedInUrl && emailAsName) {
            return; // Skip this attendee - it's likely the user
          }
          // Otherwise keep it - it might be a real attendee with incorrect email association
        }
      }

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

      // Collect LinkedIn posts separately (matching email format)
      const post = attendee?.social_media?.linkedin_post;
      if (post?.content) {
        // Store the full post object (matching email template structure)
        const dateStr = post.date || '';
        const datePart = dateStr ? dateStr.substring(0, 10) : '';
        const fullContent = normalizeText(post.content);
        const content = fullContent.length > 350 
          ? fullContent.substring(0, 350) + '...' 
          : fullContent;
        
        recentLinkedInPosts.push({
          attendeeName: fullName,
          content: content,
          fullContent: fullContent,
          url: post.url || '',
          date: datePart,
          engagement: post.engagement || {}
        });
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
  meeting.recentLinkedInPost = recentLinkedInPosts.length > 0 ? recentLinkedInPosts[0] : null; // Use first post (matching email format)
  meeting.recentNews = recentNews; // Store all news items
  meeting.companyInfo = companyInfo;
  meeting.enrichedSource = enrichedSource;
  meeting.briefingSource = briefingSource;
  meeting.hasEnrichment =
    attendeeDetails.length > 0 ||
    meeting.insights.length > 0 ||
    meeting.recentLinkedInPost ||
    meeting.recentNews.length > 0 ||
    !!companyInfo;

  return meeting;
};

const transformEventsToMeetings = (events = [], userEmail) => {
  return events
    .map((event) => {
      const startDate = parseDateTime(event.start);
      const endDate = parseDateTime(event.end);
      const attendeesList = extractAttendees(event.attendees, userEmail);

      // Debug: Log location to see what we're getting
      if (event.location) {
        console.log('[Meetings] Event location:', {
          event_id: event.event_id,
          location: event.location,
          locationType: typeof event.location,
          locationTrimmed: typeof event.location === 'string' ? event.location.trim() : 'N/A',
          isNoLocation: event.location === 'No Location',
        });
      }

      const meeting = {
        id: event.event_id,
        title: event.event || 'Untitled meeting',
        time: startDate
          ? `${formatDateLabel(startDate)} • ${formatTimeLabel(startDate)}`
          : 'Scheduled time unavailable',
        duration: calculateDurationLabel(startDate, endDate),
        platform: (() => {
          // Try to get location from event, checking multiple possible locations
          const location = event.location || event.rawEvent?.location || null;
          if (location && typeof location === 'string') {
            const trimmed = location.trim();
            if (trimmed && trimmed !== 'No Location' && trimmed !== 'No location') {
              return trimmed;
            }
          }
          return 'No location specified';
        })(),
        type: attendeesList.length > 0 ? 'external' : 'internal',
        attendees: attendeesList.length > 0 ? attendeesList : ['Just you'],
        attendeeDetails: [],
        insights: [],
        recentLinkedInPost: null,
        recentNews: [],
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

      return augmentMeetingWithEnrichment(event, meeting, userEmail);
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
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [showOnboardingMessage, setShowOnboardingMessage] = useState(false);
  const navigate = useNavigate();

  // Filter meetings by selected date
  const getMeetingsForDate = useCallback((date) => {
    if (!date || meetings.length === 0) return [];
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const targetEventId = '7po140m877gb54ifk53q0tt2hf';
    const targetMeeting = meetings.find(m => m.id === targetEventId);
    
    const filtered = meetings.filter((meeting) => {
      if (!meeting.startDate) {
        if (meeting.id === targetEventId) {
          console.log('❌ [Meetings] Target meeting has no startDate:', meeting);
        }
        return false;
      }
      
      const meetingDate = new Date(meeting.startDate);
      meetingDate.setHours(0, 0, 0, 0);
      
      // Compare by date components to avoid timezone issues
      const matches = meetingDate.getFullYear() === targetDate.getFullYear() &&
                      meetingDate.getMonth() === targetDate.getMonth() &&
                      meetingDate.getDate() === targetDate.getDate();
      
      if (meeting.id === targetEventId) {
        console.log('🔍 [Meetings] Target meeting date filter check:', {
          meetingId: meeting.id,
          meetingStartDateRaw: meeting.startDate,
          meetingStartDateType: typeof meeting.startDate,
          meetingDate: meetingDate.toString(),
          meetingDateGetTime: meetingDate.getTime(),
          meetingDateUTC: meetingDate.toISOString(),
          meetingDateLocal: meetingDate.toLocaleDateString(),
          targetDate: targetDate.toString(),
          targetDateGetTime: targetDate.getTime(),
          targetDateUTC: targetDate.toISOString(),
          targetDateLocal: targetDate.toLocaleDateString(),
          matches,
          meetingYear: meetingDate.getFullYear(),
          meetingMonth: meetingDate.getMonth(),
          meetingDay: meetingDate.getDate(),
          targetYear: targetDate.getFullYear(),
          targetMonth: targetDate.getMonth(),
          targetDay: targetDate.getDate(),
          // Check if dates match by year/month/day (ignoring time)
          datesMatchByComponents: meetingDate.getFullYear() === targetDate.getFullYear() &&
                                 meetingDate.getMonth() === targetDate.getMonth() &&
                                 meetingDate.getDate() === targetDate.getDate(),
        });
      }
      
      return matches;
    });
    
    if (targetMeeting) {
      const isInFiltered = filtered.find(m => m.id === targetEventId);
      if (!isInFiltered) {
        console.log('❌ [Meetings] Target meeting filtered out by date filter', {
          totalMeetings: meetings.length,
          filteredCount: filtered.length,
          targetMeetingStartDate: targetMeeting.startDate,
          targetDate: targetDate.toString(),
        });
      } else {
        console.log('✅ [Meetings] Target meeting passed date filter');
      }
    }
    
    return filtered;
  }, [meetings]);

  const loadMeetings = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log('📥 [Meetings] ========== LOAD MEETINGS START ==========');
    console.log('📥 [Meetings] User:', { email: user?.email, id: user?.id, timestamp });
    
    if (!user?.email) {
      console.warn('📥 [Meetings] No user email, clearing meetings');
      setMeetings([]);
      setMeetingsError(null);
      return;
    }

    console.log('📥 [Meetings] Setting loading state to true');
    setIsLoadingMeetings(true);
    setMeetingsError(null);

    try {
      console.log('📥 [Meetings] Calling fetchCalendarEvents...');
      const response = await fetchCalendarEvents({ limit: 100, daysAhead: 30 });
      console.log('📥 [Meetings] fetchCalendarEvents response:', {
        success: response.success,
        hasData: !!response.data,
        hasEvents: !!response.data?.events,
        eventsCount: response.data?.events?.length || 0,
        error: response.error,
      });
      
      if (!response.success) {
        console.error('📥 [Meetings] fetchCalendarEvents failed:', response.error);
        setMeetings([]);
        setMeetingsError(response.error || 'Unable to load meetings');
        return;
      }

      const events = response.data?.events || [];
      console.log('📥 [Meetings] Received events from API:', {
        count: events.length,
        eventIds: events.slice(0, 5).map(e => e?.event_id),
        sampleEvent: events[0] ? {
          event_id: events[0].event_id,
          event: events[0].event,
          start: events[0].start,
          attendees: events[0].attendees,
        } : null,
      });
      
      // Debug: Check for the specific event
      const targetEventId = '7po140m877gb54ifk53q0tt2hf';
      const targetEvent = events.find(e => e.event_id === targetEventId);
      if (targetEvent) {
        console.log('✅ [Meetings] Target event found in API response:', {
          event_id: targetEvent.event_id,
          start: targetEvent.start,
          ready_to_send: targetEvent.enriched_ready_to_send,
          attendees: targetEvent.attendees,
        });
      } else {
        console.log('❌ [Meetings] Target event NOT found in API response');
        console.log('   Available event IDs:', events.map(e => e.event_id));
      }
      
      const transformed = transformEventsToMeetings(events, user.email);
      console.log('🔄 [Meetings] Transformed meetings:', transformed.length);
      
      // Debug: Check if target event is in transformed meetings
      const targetMeeting = transformed.find(m => m.id === targetEventId);
      if (targetMeeting) {
        console.log('✅ [Meetings] Target meeting found in transformed:', {
          id: targetMeeting.id,
          startDate: targetMeeting.startDate,
          startDateString: targetMeeting.startDate?.toString(),
          readyToSend: targetMeeting.readyToSend,
        });
      } else {
        console.log('❌ [Meetings] Target meeting NOT found in transformed meetings');
      }
      
      setMeetings(transformed);

      // Check for insufficient credits for verification
      // Look for meetings that are enriched (have briefing_source) but not verified (ready_to_send = false)
      const unverifiedMeetings = transformed.filter(meeting => 
        meeting.briefingSource && !meeting.readyToSend && meeting.type === 'external'
      );

      if (unverifiedMeetings.length > 0) {
        // Check credit balance
        try {
          const balanceData = await getCreditBalance();
          const balance = balanceData.credits_balance || 0;
          setCreditBalance(balance);
          
          const requiredCredits = 2;
          if (balance < requiredCredits) {
            // Show modal if user has unverified meetings but insufficient credits
            setShowInsufficientCreditsModal(true);
          }
        } catch (error) {
          console.error('Error fetching credit balance:', error);
        }
      }
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

  const routerLocation = useLocation();
  
  // Filter meetings for current date
  const filteredMeetings = useMemo(() => {
    console.log('📅 [Meetings] Filtering meetings for date:', {
      currentDate: currentDate.toString(),
      currentDateGetTime: new Date(currentDate).setHours(0, 0, 0, 0),
      totalMeetings: meetings.length,
    });
    return getMeetingsForDate(currentDate);
  }, [getMeetingsForDate, currentDate, meetings.length]);

  // Update selected meeting when date changes or meetings are filtered
  useEffect(() => {
    // Check if there's a selectedMeetingId in navigation state
    if (routerLocation.state?.selectedMeetingId) {
      const meetingExists = filteredMeetings.find(m => m.id === routerLocation.state.selectedMeetingId);
      if (meetingExists) {
        setSelectedMeetingId(routerLocation.state.selectedMeetingId);
        // Clear the state to avoid reselecting on re-render
        window.history.replaceState({}, document.title);
        return;
      }
    }
    
    // Default: select first meeting for the current date if available
    if (filteredMeetings.length > 0) {
      setSelectedMeetingId(filteredMeetings[0].id);
    } else {
      setSelectedMeetingId(null);
    }
  }, [filteredMeetings, routerLocation.state]);

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
    console.log('📅 [Meetings] Navigating to next day:', {
      from: currentDate.toString(),
      to: newDate.toString(),
      toDateString: newDate.toDateString(),
    });
    setCurrentDate(newDate);
  };

  const handleConnectCalendar = (provider) => {
    const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');
    const authUrl = `${apiUrl}/${provider}`;
    window.location.href = authUrl;
  };

  const handleSyncCalendar = async () => {
    console.log('🔍 [DEBUG] [Meetings] handleSyncCalendar called');
    console.log('🔍 [DEBUG] [Meetings] User object:', user);
    console.log('🔍 [DEBUG] [Meetings] User email:', user?.email);
    
    if (!user?.email) {
      console.error('❌ [DEBUG] [Meetings] No user email found');
      setSyncStatus('error');
      setSyncMessage('Not logged in');
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    console.log('🔄 [DEBUG] [Meetings] Sync button clicked, starting sync...');
    console.log('🔍 [DEBUG] [Meetings] User email for sync:', user.email);
    setIsSyncing(true);
    setSyncStatus(null);
    setSyncMessage('');

    try {
      console.log('🔄 [DEBUG] [Meetings] Calling syncUserCalendar with daysAhead=7...');
      console.log('🔍 [DEBUG] [Meetings] About to call syncUserCalendar function');
      const result = await syncUserCalendar(7);
      console.log('📡 [DEBUG] [Meetings] Sync result received:', result);
      console.log('🔍 [DEBUG] [Meetings] Result type:', typeof result);
      console.log('🔍 [DEBUG] [Meetings] Result keys:', result ? Object.keys(result) : 'null');
      console.log('🔍 [DEBUG] [Meetings] Result.success:', result?.success);
      console.log('🔍 [DEBUG] [Meetings] Result.data:', result?.data);
      console.log('🔍 [DEBUG] [Meetings] Result.error:', result?.error);

      if (result.success) {
        console.log('✅ [DEBUG] [Meetings] Sync was successful');
        const eventsCount = result.data?.events_synced || 0;
        console.log('🔍 [DEBUG] [Meetings] Events synced count:', eventsCount);
        console.log('🔍 [DEBUG] [Meetings] Result.data object:', result.data);
        setSyncStatus('success');
        setSyncMessage(`Synced ${eventsCount} meeting${eventsCount !== 1 ? 's' : ''}!`);
        
        // Show onboarding message after successful sync
        setShowOnboardingMessage(true);
        
        // Wait a moment for database to be ready, then reload
        setTimeout(async () => {
          console.log('🔍 [DEBUG] [Meetings] Reloading meetings after sync...');
          await loadMeetings();
        }, 500);

        setTimeout(() => {
          setSyncStatus(null);
          setSyncMessage('');
        }, 3000);
      } else {
        console.error('❌ [DEBUG] [Meetings] Sync failed');
        console.log('🔍 [DEBUG] [Meetings] Result object:', result);
        const errorMsg = result.error || result.data?.error || '';
        console.log('🔍 [DEBUG] [Meetings] Error message:', errorMsg);

        if (errorMsg.toLowerCase().includes('no auth token')) {
          console.log('🔍 [DEBUG] [Meetings] No auth token error detected');
          setSyncStatus('no_auth');
          setSyncMessage('Calendar not connected');
        } else {
          console.log('🔍 [DEBUG] [Meetings] Other error, setting error status');
          setSyncStatus('error');
          setSyncMessage(result.error || 'Failed to sync calendar');

          setTimeout(() => {
            setSyncStatus(null);
            setSyncMessage('');
          }, 5000);
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG] [Meetings] Unexpected sync error:', error);
      console.error('🔍 [DEBUG] [Meetings] Error type:', typeof error);
      console.error('🔍 [DEBUG] [Meetings] Error message:', error?.message);
      console.error('🔍 [DEBUG] [Meetings] Error stack:', error?.stack);
      console.error('🔍 [DEBUG] [Meetings] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setSyncStatus('error');
      setSyncMessage('An unexpected error occurred');

      setTimeout(() => {
        setSyncStatus(null);
        setSyncMessage('');
      }, 5000);
    } finally {
      console.log('🔍 [DEBUG] [Meetings] Finally block - setting isSyncing to false');
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

    if (filteredMeetings.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No meetings found for {formatDate(currentDate)}.</p>
          <p className="text-gray-400 text-sm">Sync your calendar to pull in upcoming meetings.</p>
        </div>
      );
    }

    return filteredMeetings.map((meeting) => (
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
                text="2 credit / verified meeting"
                icon={<FiCreditCard />}
              />
            </div>

            {/* Onboarding Message - shown after calendar sync */}
            {showOnboardingMessage && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <FiClock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Agent Onboarding in Progress
                    </h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      The agent is now onboarding and will be ready to generate your insights in 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOnboardingMessage(false)}
                    className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                    aria-label="Dismiss message"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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

      {/* Insufficient Credits Modal */}
      {showInsufficientCreditsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowInsufficientCreditsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-6 h-6" />
            </button>

            <div className="text-center py-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Insufficient Credits</h3>
              <p className="text-gray-600 mb-4">
                Your meeting insights cannot be verified until you add more credits.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-semibold text-gray-900">{creditBalance} credits</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Required to Verify:</span>
                  <span className="font-semibold text-gray-900">2 credits per meeting</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInsufficientCreditsModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowInsufficientCreditsModal(false);
                    navigate('/billing');
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <FiCreditCard className="w-4 h-4" />
                  Go to Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
