import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedBrief } from '../lib/sharesApi';
import {
  FiMail,
  FiPhone,
  FiLinkedin,
  FiTrendingUp,
  FiClock,
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiInfo,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';

// Helper function to convert URLs in text to clickable links
const linkifyText = (text) => {
  if (typeof text !== 'string') return text;
  
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const url = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const formatDateTime = (date) => {
  if (!date) return 'Not available';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Helper to calculate duration
const calculateDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  } catch (e) {
    return 'N/A';
  }
};

const SharedBrief = () => {
  const { token } = useParams();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBrief = async () => {
      if (!token) {
        setError('No share token provided');
        setLoading(false);
        return;
      }

      const result = await getSharedBrief(token);

      if (result.success) {
        setBrief(result.data);
        // Debug: Log location data
        console.log('📋 Shared Brief Data:', {
          location: result.data?.location,
          event: result.data?.event,
          start: result.data?.start,
          end: result.data?.end,
        });
      } else {
        setError(result.error || 'Failed to load shared brief');
      }
      setLoading(false);
    };

    loadBrief();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5] flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading shared brief...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Brief</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            This link may have expired, been revoked, or is invalid.
          </p>
        </div>
      </div>
    );
  }

  // Parse enriched data
  const enrichedSource = brief?.enriched_source || {};
  const briefingSource = brief?.briefing_source || {};
  const enrichedCompanies = enrichedSource?.companies || {};
  const briefingCompanies = briefingSource?.companies || {};

  // Extract attendee details
  const attendeeDetails = [];
  Object.entries(briefingCompanies).forEach(([companyName, companyData]) => {
    const enrichedAttendees = enrichedCompanies[companyName]?.attendees || [];
    const attendees = companyData?.attendees || [];

    attendees.forEach((attendee) => {
      const enrichedMatch = enrichedAttendees.find(
        (ea) =>
          ea?.email_address?.toLowerCase() === attendee?.profile?.email?.toLowerCase() ||
          ea?.linkedin_url === attendee?.linkedin_url
      );

      const fullName =
        attendee?.name ||
        [attendee?.profile?.name?.first, attendee?.profile?.name?.last]
          .filter(Boolean)
          .join(' ') ||
        'Unknown attendee';

      const email = enrichedMatch?.email_address || attendee?.profile?.email || attendee?.email || '';
      const linkedinUrl = attendee?.linkedin_url || attendee?.profile?.name?.linkedin_url || enrichedMatch?.linkedin_url || '';
      const location = enrichedMatch?.location
        ? [enrichedMatch.location.city, enrichedMatch.location.state, enrichedMatch.location.country]
            .filter(Boolean)
            .join(', ')
        : '';

      attendeeDetails.push({
        name: fullName,
        title: attendee?.job_title || attendee?.profile?.job_title || enrichedMatch?.headline || enrichedMatch?.job_title || '',
        company: companyName || enrichedMatch?.company || '',
        email: email || undefined,
        phone: enrichedMatch?.phone || enrichedMatch?.phone_number || undefined,
        linkedin: linkedinUrl || undefined,
        location: location || undefined,
        summary: attendee?.summary || undefined,
      });
    });
  });

  // Extract insights
  const insights = [];
  Object.values(briefingCompanies).forEach((companyData) => {
    const companyInfo = companyData?.company_info || {};
    if (companyInfo.custom_insights) {
      if (Array.isArray(companyInfo.custom_insights)) {
        companyInfo.custom_insights.forEach((insight) => {
          if (typeof insight === 'string') insights.push(insight);
          else if (insight?.insight) insights.push(insight.insight);
        });
      }
    }
    if (companyData?.stripe_product_recommendations) {
      if (Array.isArray(companyData.stripe_product_recommendations)) {
        companyData.stripe_product_recommendations.forEach((rec) => {
          if (typeof rec === 'string') insights.push(rec);
          else if (rec?.insight) insights.push(rec.insight);
        });
      }
    }
  });

  // Extract LinkedIn post (matching MeetingDetails format - use first post)
  let recentLinkedInPost = null;
  const recentLinkedInPosts = [];
  Object.values(briefingCompanies).forEach((companyData) => {
    const attendees = companyData?.attendees || [];
    attendees.forEach((attendee) => {
      const post = attendee?.social_media?.linkedin_post;
      if (post?.content) {
        const dateStr = post.date || '';
        const datePart = dateStr ? dateStr.substring(0, 10) : '';
        const fullContent = post.content;
        const content = fullContent.length > 350 
          ? fullContent.substring(0, 350) + '...' 
          : fullContent;
        
        const attendeeName = attendee?.name || 
          [attendee?.profile?.name?.first, attendee?.profile?.name?.last]
            .filter(Boolean)
            .join(' ') || 
          'User';
        
        recentLinkedInPosts.push({
          attendeeName: attendeeName,
          content: content,
          fullContent: fullContent,
          url: post.url || '',
          date: datePart,
          engagement: post.engagement || {}
        });
      }
    });
  });

  // Use first post (matching email format)
  if (recentLinkedInPosts.length > 0) {
    recentLinkedInPost = recentLinkedInPosts[0];
  }

  // Extract company info - match MeetingDetails format
  let companyInfo = null;
  let companyName = null;
  for (const [name, companyData] of Object.entries(briefingCompanies)) {
    const ci = companyData?.company_info;
    if (ci && Object.keys(ci).length > 0) {
      companyName = name;
      companyInfo = {
        name: name,
        founded: ci.founded || null,
        headquarters: ci.headquarters || null,
        employeeCount: ci.employee_count || ci.company_size || null,
        industry: ci.industry || null,
        description: ci.description || null,
        markets: ci.markets || ci.key_markets || null,
        customers: ci.customers || null,
        products: ci.products || ci.primary_products || null,
        revenueModel: ci.revenue_model || null,
        financialPerformance: ci.financial_performance || null,
        competitors: ci.competitors || null,
        decisionMakers: ci.decision_makers || null,
        customInsights: Array.isArray(ci.custom_insights) ? ci.custom_insights : [],
        website: ci.website || '',
        linkedin: ci.linkedin_url || '',
      };
      break;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <FiBriefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Shared Meeting Brief</h1>
          </div>
          <p className="text-gray-600 text-sm ml-13">
            This brief has been shared with you. View meeting insights and attendee information below.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="space-y-6">
          {/* Meeting Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{brief?.event || 'Untitled Meeting'}</h2>
          </div>

          {/* Meeting Overview - Match MeetingDetails format */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Meeting overview</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Start</p>
                <p>{formatDateTime(brief?.start)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">End</p>
                <p>{formatDateTime(brief?.end)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Duration</p>
                <p>{calculateDuration(brief?.start, brief?.end)}</p>
              </div>
                <div>
                  <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Location</p>
                  <p className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span>
                    {(() => {
                      // Check location from brief data
                      const loc = brief?.location;
                      if (!loc || loc === 'No Location' || loc === 'No location') {
                        return 'No location specified';
                      }
                      if (typeof loc !== 'string') {
                        return 'No location specified';
                      }
                      const trimmed = loc.trim();
                      
                      // Parse Zoom link, password, and email (matching Dashboard format)
                      const zoomMatch = trimmed.match(/https?:\/\/[^\s]+zoom[^\s]*/i);
                      if (zoomMatch) {
                        let zoomUrl = zoomMatch[0];
                        // Clean up URL - remove trailing ?. or ? or other query params that are malformed
                        zoomUrl = zoomUrl.replace(/[?.]+$/, '').replace(/\?$/, '');
                        
                        // Extract password if present
                        const remainingText = trimmed.substring(zoomMatch.index + zoomMatch[0].length);
                        const pwdMatch = remainingText.match(/pwd=([^\s\/]+)/i) || trimmed.match(/pwd=([^\s\/]+)/i);
                        const password = pwdMatch ? pwdMatch[1] : null;
                        
                        // Extract email if present
                        const emailMatch = trimmed.match(/[\/\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                        const email = emailMatch ? emailMatch[1] : null;
                        
                        // Return formatted string (matching MeetingDetails simple format)
                        let result = zoomUrl;
                        if (password) {
                          result += ` (Password: ${password})`;
                        }
                        if (email) {
                          result += ` - ${email}`;
                        }
                        return result;
                      }
                      
                      // Not a Zoom link, return as-is
                      return trimmed;
                    })()}
                  </span>
                  </p>
                </div>
            </div>
          </div>

          {/* Attendees Section - Match MeetingDetails format */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiUsers className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Attendees</h2>
            </div>
            <ul className="space-y-2 text-gray-700 text-sm">
              {(() => {
                // Extract attendees from brief data
                const attendeesList = brief?.attendees || [];
                let attendees = [];
                
                if (Array.isArray(attendeesList)) {
                  attendees = attendeesList.map(att => {
                    if (typeof att === 'string') return att;
                    if (typeof att === 'object' && att.email) return att.email;
                    if (typeof att === 'object' && att.name) return att.name;
                    return String(att);
                  }).filter(Boolean);
                } else if (typeof attendeesList === 'string') {
                  // Handle string format (comma-separated or single)
                  attendees = attendeesList.split(',').map(a => a.trim()).filter(Boolean);
                }
                
                if (attendees.length > 0) {
                  return attendees.map((attendee, idx) => {
                    // Format status text (needsAction -> needs action)
                    let formattedAttendee = String(attendee);
                    formattedAttendee = formattedAttendee.replace(/\(needsAction\)/gi, '(needs action)');
                    
                    return (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-purple-600 flex-shrink-0">•</span>
                        <span className="flex-1">{formattedAttendee}</span>
                      </li>
                    );
                  });
                } else {
                  return (
                    <li className="flex items-center gap-2 text-gray-500">
                      <span className="text-purple-600 flex-shrink-0">•</span>
                      <span className="flex-1">Just you</span>
                    </li>
                  );
                }
              })()}
            </ul>
          </div>

          {/* Description */}
          {brief?.description && brief.description !== 'No Description' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiInfo className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Agenda / Description</h2>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{brief.description}</p>
            </div>
          )}

          {/* Enriched Attendee Profiles - Match MeetingDetails format */}
          {attendeeDetails.length > 0 && (
            <div className="space-y-6">
              {attendeeDetails.map((attendee, index) => {
                // Find matching attendee from briefing_source for additional data
                let briefingMatch = null;
                Object.entries(briefingCompanies).forEach(([companyName, companyData]) => {
                  const briefingAttendees = companyData?.attendees || [];
                  const match = briefingAttendees.find((a) => {
                    const attendeeEmail = attendee.email?.toLowerCase();
                    const aEmail = (a?.profile?.email || a?.email || '').toLowerCase();
                    if (attendeeEmail && aEmail && attendeeEmail === aEmail) return true;
                    
                    const attendeeName = attendee.name?.toLowerCase();
                    const aName = [a?.profile?.name?.first, a?.profile?.name?.last].filter(Boolean).join(' ').toLowerCase();
                    if (attendeeName && aName && attendeeName === aName) return true;
                    
                    return false;
                  });
                  if (match) briefingMatch = match;
                });

                // Find enriched match
                const enrichedAttendees = enrichedCompanies[attendee.company]?.attendees || [];
                const enrichedMatch = enrichedAttendees.find((ea) => {
                  const eaEmail = (ea?.email_address || '').toLowerCase();
                  const attendeeEmail = (attendee.email || '').toLowerCase();
                  return eaEmail && attendeeEmail && eaEmail === attendeeEmail;
                });

                // Calculate tenure
                let tenureStr = null;
                const briefingTenureMonths = briefingMatch?.profile?.tenure_months;
                if (briefingTenureMonths) {
                  if (typeof briefingTenureMonths === 'number' && briefingTenureMonths > 0) {
                    const years = Math.floor(briefingTenureMonths / 12);
                    const months = briefingTenureMonths % 12;
                    if (years > 0 && months > 0) {
                      tenureStr = `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
                    } else if (years > 0) {
                      tenureStr = `${years} year${years > 1 ? 's' : ''}`;
                    } else if (months > 0) {
                      tenureStr = `${months} month${months > 1 ? 's' : ''}`;
                    }
                  } else if (typeof briefingTenureMonths === 'string') {
                    tenureStr = briefingTenureMonths;
                  }
                }

                // Get previous role
                let previousRoleStr = null;
                const briefingPreviousPositions = briefingMatch?.career?.previous_positions || [];
                if (briefingPreviousPositions.length > 0) {
                  const briefingPreviousRole = briefingPreviousPositions[0];
                  if (briefingPreviousRole.title) {
                    previousRoleStr = briefingPreviousRole.title;
                    const companyName = briefingPreviousRole.company_name || briefingPreviousRole.company?.name || null;
                    if (companyName) {
                      previousRoleStr += ` - ${companyName}`;
                    }
                  }
                }

                return (
                  <div key={index} className="bg-white border border-gray-100 rounded-2xl p-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">{attendee.name}</h3>
                    
                    {/* Key Information Grid - Match MeetingDetails format */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {attendee.company && (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                            <img src="https://d1udkp95fdo7mt.cloudfront.net/images/building_1_fill.png" alt="Company" className="w-5 h-5" />
              </div>
                          <p className="text-xs text-gray-900 mb-0.5">Company</p>
                          <a 
                            href={attendee.linkedin ? attendee.linkedin.replace(/\/in\/.*/, '/company/' + attendee.company.toLowerCase().replace(/\s+/g, '-')) : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {attendee.company}
                          </a>
                        </div>
                      )}
                      
                      {attendee.title && (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                            <img src="https://d1udkp95fdo7mt.cloudfront.net/images/briefcase_fill.png" alt="Job Title" className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-900 mb-0.5">Job Title</p>
                          <p className="text-sm font-medium text-gray-500">{attendee.title}</p>
                        </div>
                      )}
                      
                      {tenureStr && (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                            <img src="https://d1udkp95fdo7mt.cloudfront.net/images/calendar_fill.png" alt="Tenure" className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-900 mb-0.5">Tenure</p>
                          <p className="text-sm font-medium text-gray-500">{tenureStr}</p>
                        </div>
                      )}
                      
                      {(attendee.location || briefingMatch?.profile?.location) && (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                            <img src="https://d1udkp95fdo7mt.cloudfront.net/images/location_fill.png" alt="Location" className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-900 mb-0.5">Location</p>
                          <p className="text-sm font-medium text-gray-500">{attendee.location || briefingMatch?.profile?.location || ''}</p>
                    </div>
                      )}
                      
                      {previousRoleStr && (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                            <img src="https://d1udkp95fdo7mt.cloudfront.net/images/briefcase_fill.png" alt="Previous Role" className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-900 mb-0.5">Previous Role</p>
                          <p className="text-sm font-medium text-gray-500">{previousRoleStr}</p>
                            </div>
                          )}
                      
                      {/* Decision-making Authority */}
                      {(briefingMatch?.profile?.decision_authority || enrichedMatch?.decision_making_authority) && (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                            <img src="https://d1udkp95fdo7mt.cloudfront.net/images/scales.png" alt="Decision-making Authority" className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-900 mb-0.5">Decision-making Authority</p>
                          <p className="text-sm font-medium text-gray-500">{briefingMatch?.profile?.decision_authority || enrichedMatch?.decision_making_authority || ''}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Background Section - Match MeetingDetails format */}
          {attendeeDetails.length > 0 && attendeeDetails.map((attendee, index) => {
            let briefingMatch = null;
            Object.entries(briefingCompanies).forEach(([companyName, companyData]) => {
              const briefingAttendees = companyData?.attendees || [];
              const match = briefingAttendees.find((a) => {
                const attendeeEmail = attendee.email?.toLowerCase();
                const aEmail = (a?.profile?.email || a?.email || '').toLowerCase();
                if (attendeeEmail && aEmail && attendeeEmail === aEmail) return true;
                
                const attendeeName = attendee.name?.toLowerCase();
                const aName = [a?.profile?.name?.first, a?.profile?.name?.last].filter(Boolean).join(' ').toLowerCase();
                if (attendeeName && aName && attendeeName === aName) return true;
                
                return false;
              });
              if (match) briefingMatch = match;
            });

            if (!briefingMatch || (briefingMatch?.career?.current_positions?.length <= 1 && (!briefingMatch?.career?.previous_positions || briefingMatch.career.previous_positions.length === 0))) {
              return null;
            }

            return (
              <div key={`background-${index}`} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                    <FiCalendar className="w-5 h-5 text-gray-900" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Background</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {briefingMatch?.career?.current_positions?.length > 1 && briefingMatch.career.current_positions.slice(1).map((position, idx) => {
                    const companyName = position.company?.name || position.company_name || '-';
                    const companyUrl = position.company?.url || null;
                    const tenure = position.tenure_months || '';
                    return (
                      <div key={`current-${idx}`} className="flex items-start">
                        <span className="mr-2">-</span>
                        <span>
                          {position.title || '-'}, {companyUrl ? (
                            <a href={companyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {companyName}
                            </a>
                          ) : (
                            <span>{companyName}</span>
                          )}
                          {tenure && ` (${tenure})`}
                        </span>
                      </div>
                    );
                  })}
                  {briefingMatch?.career?.previous_positions?.map((position, idx) => {
                    const companyName = position.company?.name || position.company_name || '-';
                    const companyUrl = position.company?.url || null;
                    const tenure = position.tenure_months || '';
                    return (
                      <div key={`prev-${idx}`} className="flex items-start">
                        <span className="mr-2">-</span>
                        <span>
                          {position.title || '-'}, {companyUrl ? (
                            <a href={companyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {companyName}
                            </a>
                          ) : (
                            <span>{companyName}</span>
                          )}
                          {tenure && ` (${tenure})`}
                        </span>
                      </div>
                    );
                  })}
                  </div>
              </div>
            );
          })}

          {/* Interesting Fact Section - Match MeetingDetails format */}
          {attendeeDetails.length > 0 && attendeeDetails.map((attendee, index) => {
            let briefingMatch = null;
            Object.entries(briefingCompanies).forEach(([companyName, companyData]) => {
              const briefingAttendees = companyData?.attendees || [];
              const match = briefingAttendees.find((a) => {
                const attendeeEmail = attendee.email?.toLowerCase();
                const aEmail = (a?.profile?.email || a?.email || '').toLowerCase();
                if (attendeeEmail && aEmail && attendeeEmail === aEmail) return true;
                
                const attendeeName = attendee.name?.toLowerCase();
                const aName = [a?.profile?.name?.first, a?.profile?.name?.last].filter(Boolean).join(' ').toLowerCase();
                if (attendeeName && aName && attendeeName === aName) return true;
                
                return false;
              });
              if (match) briefingMatch = match;
            });

            if (!briefingMatch?.profile?.interesting_fact || 
                briefingMatch.profile.interesting_fact === "No information found") {
              return null;
            }

            return (
              <div key={`interesting-${index}`} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                    <FiTrendingUp className="w-5 h-5 text-gray-900" />
              </div>
                  <h4 className="text-sm font-bold text-gray-900">Interesting Fact</h4>
            </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {briefingMatch.profile.interesting_fact}
                </p>
              </div>
            );
          })}

          {/* Recent LinkedIn Post Section - Match MeetingDetails format */}
          {recentLinkedInPost && (
            <>
              <div className="bg-white border-t border-gray-200"></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex flex-col items-center mb-5">
                  <img src="https://d1udkp95fdo7mt.cloudfront.net/images/image_li.png" alt="LinkedIn" className="w-8 h-8 mb-2" />
                  <h2 className="text-sm font-semibold text-gray-900">Recent LinkedIn Post</h2>
                </div>
                <div className="text-base text-gray-700 mb-4">
                  {recentLinkedInPost.content}
                </div>
                {recentLinkedInPost.url && (
                  <div className="flex justify-center pt-5">
                    <a
                      href={recentLinkedInPost.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 text-black font-semibold transition-colors text-xs"
                      style={{ 
                        background: '#F3C93B',
                        borderRadius: '50px',
                        display: 'inline-block',
                        textDecoration: 'none'
                      }}
                    >
                      View more on LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Company Information - Match MeetingDetails format */}
          {companyInfo && (() => {
            const founded = companyInfo.founded;
            const headquarters = companyInfo.headquarters;
            const employeeCount = companyInfo.employeeCount;
            const industry = companyInfo.industry;
            const description = companyInfo.description;
            const markets = companyInfo.markets;
            const customers = companyInfo.customers;
            const products = companyInfo.products;
            const revenueModel = companyInfo.revenueModel;
            const financialPerformance = companyInfo.financialPerformance;
            const competitors = companyInfo.competitors;
            const decisionMakers = companyInfo.decisionMakers;
            const customInsights = companyInfo.customInsights;
            
            // Format headquarters
            let headquartersStr = null;
            if (headquarters) {
              if (typeof headquarters === 'string') {
                headquartersStr = headquarters;
              } else if (typeof headquarters === 'object') {
                const parts = [
                  headquarters.city,
                  headquarters.state,
                  headquarters.country
                ].filter(Boolean);
                headquartersStr = parts.length > 0 ? parts.join(', ') : null;
              }
            }
            
            // Format founded year
            let foundedYear = null;
            if (founded) {
              if (typeof founded === 'string') {
                foundedYear = founded;
              } else if (typeof founded === 'object' && founded.year) {
                foundedYear = founded.year.toString();
              } else if (typeof founded === 'number') {
                foundedYear = founded.toString();
              }
            }
            
            return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-thin text-gray-900 mb-6 text-center uppercase tracking-wide">COMPANY INFORMATION</h2>
                
                {/* Company Name */}
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    <span className="underline">{companyName.split(' - ')[0]}</span>
                    {companyName.includes(' - ') && (
                      <span className="text-gray-600"> - {companyName.split(' - ').slice(1).join(' - ')}</span>
                    )}
                  </h3>
                </div>
                
                {/* Key Information Grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {foundedYear && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/calendar_fill.png" alt="Founded" className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Founded</p>
                      <p className="text-sm font-medium text-gray-500">{foundedYear}</p>
                    </div>
                  )}
                  
                  {headquartersStr && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/location_fill.png" alt="Headquarters" className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Headquarters</p>
                      <p className="text-sm font-medium text-gray-500">{headquartersStr}</p>
                    </div>
                  )}
                  
                  {employeeCount && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/group_3_fill.png" alt="Employees" className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">No. of Employees</p>
                      <p className="text-sm font-medium text-gray-500">{employeeCount}</p>
                    </div>
                  )}
                  
                  {industry && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/world_2_fill.png" alt="Industry" className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Industry</p>
                      <p className="text-sm font-medium text-gray-500">{industry}</p>
                    </div>
                  )}
                </div>
                
                {/* Description */}
                {description && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/shopping_bag_2_fill.png" alt="Description" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Description</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(description)}</p>
                  </div>
                )}
                
                {/* Markets */}
                {markets && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/world_2_fill.png" alt="Markets" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Markets</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(markets)}</p>
                  </div>
                )}
                
                {/* Customers */}
                {customers && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/group_3_fill.png" alt="Customers" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Customers</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(customers)}</p>
                  </div>
                )}
                
                {/* Primary Products */}
                {products && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/shopping_bag_2_fill.png" alt="Primary Products" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Primary Products</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(products)}</p>
                  </div>
                )}
                
                {/* Revenue Model */}
                {revenueModel && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/chart_pie_2_fill.png" alt="Revenue Model" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Revenue Model</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(revenueModel)}</p>
                  </div>
                )}
                
                {/* Financial Performance */}
                {financialPerformance && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/chart_bar_fill.png" alt="Financial Performance" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Financial Performance</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(financialPerformance)}</p>
                  </div>
                )}
                
                {/* Key Competitors */}
                {competitors && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/target_fill.png" alt="Key Competitors" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Key Competitors</h4>
                    </div>
                    {Array.isArray(competitors) ? (
                      <div className="space-y-3 text-sm text-gray-700">
                        {competitors.slice(0, 3).map((competitor, idx) => {
                          const competitorName = typeof competitor === 'string' ? competitor : (competitor.name || '');
                          const competitorSummary = typeof competitor === 'string' ? null : (competitor.summary || null);
                          return (
                            <div key={idx}>
                              <span className="font-semibold">{idx + 1}. {competitorName}</span>
                              {competitorSummary && <span> {linkifyText(competitorSummary)}</span>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed">{linkifyText(competitors)}</p>
                    )}
                  </div>
                )}
                
                {/* Decision Makers */}
                {decisionMakers && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/task_fill.png" alt="Decision Makers" className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Decision Makers</h4>
                    </div>
                    {Array.isArray(decisionMakers) ? (
                      <div className="space-y-2 text-sm text-gray-700">
                        {decisionMakers.map((maker, idx) => {
                          const makerText = typeof maker === 'string' ? maker : (maker.name || maker.summary || JSON.stringify(maker));
                          return (
                            <div key={idx}>
                              <span>{linkifyText(makerText)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : typeof decisionMakers === 'string' && decisionMakers.includes('\n') ? (
                      <div className="space-y-2 text-sm text-gray-700">
                        {decisionMakers.split('\n').filter(line => line.trim()).map((line, idx) => (
                          <div key={idx}>
                            <span>{linkifyText(line.trim())}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700">
                        <span>{linkifyText(decisionMakers)}</span>
                      </div>
                    )}
                </div>
                )}
                
                {/* Custom Insights - Match MeetingDetails format */}
                {customInsights.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#FBBF24' }}
                      >
                        <img
                          src="https://d1udkp95fdo7mt.cloudfront.net/images/lightbulb_fill.png"
                          alt="Custom Insights"
                          className="w-5 h-5"
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Custom Insights</h4>
                    </div>

                    <div className="space-y-4">
                      {customInsights.map((insight, idx) => {
                        if (!insight) return null;

                        const category = insight.category || '';
                        const question = insight.question || '';
                        const answer = insight.answer || '';
                        const sources = Array.isArray(insight.sources) ? insight.sources : [];

                        // Skip completely empty entries
                        if (!question && !answer && sources.length === 0) return null;

                        return (
                          <div key={idx} className="text-sm text-gray-700">
                            {/* Question / heading */}
                            {(category || question) && (
                              <p className="font-semibold text-gray-900 mb-1">
                                {category && <span>{category}: </span>}
                                {question}
                              </p>
                            )}

                            {/* Answer */}
                            {answer && (
                              <p className="mb-1 leading-relaxed">
                                - {linkifyText(answer)}
                              </p>
                            )}

                            {/* Sources */}
                            {sources.length > 0 && (
                              <p className="text-xs text-gray-500 italic">
                                sources:{' '}
                                {sources.map((src, sIdx) => {
                                  if (!src) return null;
                                  const url = typeof src === 'string' && (src.startsWith('http') || src.startsWith('www.')) ? src : null;
                                  const displayText = url ? (url.length > 50 ? url.substring(0, 50) + '...' : url) : src;
                                  return (
                                    <span key={sIdx}>
                                      {url ? (
                                        <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                          "{displayText}"
                                        </a>
                                      ) : (
                                        <span>"{displayText}"</span>
                                      )}
                                      {sIdx < sources.length - 1 && ', '}
                                    </span>
                                  );
                                })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* No Data Available */}
          {attendeeDetails.length === 0 && !recentLinkedInPost && !companyInfo && (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
              <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No enrichment data is available for this meeting yet.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 pb-12">
            <p className="text-sm text-gray-500">
              Powered by Merlin Meeting Intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedBrief;
