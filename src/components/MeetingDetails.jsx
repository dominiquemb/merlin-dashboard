import React, { useState } from 'react';
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
  FiShare2,
  FiCheck,
  FiX,
  FiFileText,
  FiGlobe,
  FiSettings,
} from 'react-icons/fi';

const formatDateTime = (date) =>
  date ? date.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not available';

const ResearchDetails = ({ meeting }) => {
  const attendeeDetails = meeting?.attendeeDetails || [];
  const insights = meeting?.insights || [];
  const recentActivity = meeting?.recentActivity || [];
  const companyInfo = meeting?.companyInfo;

  const hasResearch =
    attendeeDetails.length > 0 || insights.length > 0 || recentActivity.length > 0 || !!companyInfo;

  if (!hasResearch) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Research</h2>
          </div>
          <p className="text-sm text-gray-600">
            Research and enrichment will appear here automatically once generated for this meeting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attendeeDetails.length > 0 && (
          <div className="space-y-6">
          {attendeeDetails.map((attendee, index) => {
            // Extract enriched data from briefing source
            const briefingSource = meeting?.briefingSource || meeting?.briefing_source;
            const enrichedSource = meeting?.enrichedSource || meeting?.enriched_source;
            const enrichedCompanies = enrichedSource?.companies || {};
            const briefingCompanies = briefingSource?.companies || {};
            
            // Find matching attendee data
            let enrichedAttendee = null;
            let currentPositions = [];
            let previousPositions = [];
            let tenureMonths = null;
            let currentRoleStartDate = null;
            
            Object.entries(briefingCompanies).forEach(([companyName, companyData]) => {
              const enrichedAttendees = enrichedCompanies[companyName]?.attendees || [];
              const briefingAttendees = companyData?.attendees || [];
              
              // Try to match by email or name
              const match = briefingAttendees.find((a) => {
                const attendeeEmail = attendee.email?.toLowerCase();
                const aEmail = (a?.profile?.email || a?.email || '').toLowerCase();
                if (attendeeEmail && aEmail && attendeeEmail === aEmail) return true;
                
                const attendeeName = attendee.name?.toLowerCase();
                const aName = [a?.profile?.name?.first, a?.profile?.name?.last].filter(Boolean).join(' ').toLowerCase();
                if (attendeeName && aName && attendeeName === aName) return true;
                
                return false;
              });
              
              if (match) {
                const enrichedMatch = enrichedAttendees.find((ea) => {
                  const eaEmail = (ea?.email_address || '').toLowerCase();
                  const matchEmail = (match?.profile?.email || match?.email || '').toLowerCase();
                  return eaEmail && matchEmail && eaEmail === matchEmail;
                });
                
                if (enrichedMatch) {
                  enrichedAttendee = enrichedMatch;
                  currentPositions = enrichedMatch?.current_positions || [];
                  previousPositions = enrichedMatch?.previous_positions || [];
                  tenureMonths = enrichedMatch?.current_role_tenure_months;
                  currentRoleStartDate = enrichedMatch?.current_role_start_date;
                }
              }
            });
            
            // Calculate tenure string
            let tenureStr = null;
            if (tenureMonths) {
              const years = Math.floor(tenureMonths / 12);
              const months = tenureMonths % 12;
              if (years > 0 && months > 0) {
                tenureStr = `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
              } else if (years > 0) {
                tenureStr = `${years} year${years > 1 ? 's' : ''}`;
              } else if (months > 0) {
                tenureStr = `${months} month${months > 1 ? 's' : ''}`;
              }
            }
            
            // Get previous role
            const previousRole = previousPositions.length > 0 ? previousPositions[0] : null;
            const previousRoleStr = previousRole 
              ? `${previousRole.title || 'Previous Role'}${previousRole.company_name ? ` - ${previousRole.company_name}` : ''}`
              : null;
            
            // Build biography from available data
            const biographyParts = [];
            if (attendee.title && attendee.company) {
              biographyParts.push(`${attendee.name} is the ${attendee.title} of ${attendee.company}`);
            } else if (attendee.title) {
              biographyParts.push(`${attendee.name} is the ${attendee.title}`);
            } else if (attendee.company) {
              biographyParts.push(`${attendee.name} works at ${attendee.company}`);
            }
            
            if (attendee.company && enrichedAttendee) {
              // Try to get company location from briefing source
              const companyData = Object.values(briefingCompanies).find(cd => 
                cd?.company_info?.name === attendee.company
              );
              const companyLocation = companyData?.company_info?.headquarters;
              let locationStr = '';
              if (companyLocation) {
                if (typeof companyLocation === 'string') {
                  locationStr = companyLocation;
                } else if (typeof companyLocation === 'object') {
                  const parts = [
                    companyLocation.city,
                    companyLocation.state,
                    companyLocation.country
                  ].filter(Boolean);
                  locationStr = parts.join(', ');
                }
              }
              
              if (locationStr) {
                biographyParts[0] += `, a company based in ${locationStr}`;
              }
            }
            
            if (tenureStr) {
              biographyParts.push(`With ${tenureStr} of tenure`);
            }
            
            if (previousRoleStr) {
              biographyParts.push(`previously worked at ${previousRoleStr}`);
            }
            
            if (enrichedAttendee?.headline) {
              biographyParts.push(enrichedAttendee.headline);
            }
            
            const biography = biographyParts.length > 0 ? biographyParts.join('. ') + '.' : attendee.summary || '';
            
            return (
              <div key={index} className="bg-white border border-gray-100 rounded-2xl p-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">{attendee.name}</h3>
                
                {/* Key Information Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {attendee.company && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <FiBriefcase className="w-5 h-5 text-gray-900" />
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
                        <FiBriefcase className="w-5 h-5 text-gray-900" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Job Title</p>
                      <p className="text-sm font-medium text-gray-500">{attendee.title}</p>
                        </div>
                      )}
                  
                  {tenureStr && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <FiCalendar className="w-5 h-5 text-gray-900" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Tenure</p>
                      <p className="text-sm font-medium text-gray-500">{tenureStr}</p>
                    </div>
                  )}
                  
                  {attendee.location && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <FiMapPin className="w-5 h-5 text-gray-900" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Location</p>
                      <p className="text-sm font-medium text-gray-500">{attendee.location}</p>
                    </div>
                  )}
                  
                  {previousRoleStr && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <FiBriefcase className="w-5 h-5 text-gray-900" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Previous Role</p>
                      <p className="text-sm font-medium text-gray-500">{previousRoleStr}</p>
                  </div>
                  )}
                  
                  {/* Decision-making Authority - placeholder if we have data */}
                  {enrichedAttendee?.decision_making_authority && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <FiInfo className="w-5 h-5 text-gray-900" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Decision-making Authority</p>
                      <p className="text-sm font-medium text-gray-500">{enrichedAttendee.decision_making_authority}</p>
                    </div>
                  )}
                </div>
                
                {/* Detailed Biography */}
                {biography && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Detailed Biography</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{biography}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {insights.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Key Insights</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentActivity.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FiClock className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {recentActivity.map((activity, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-600 mt-1.5">•</span>
                <span>{activity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {companyInfo && (() => {
        // Extract company data from briefing source if available
        const briefingSource = meeting?.briefingSource || meeting?.briefing_source;
        const briefingCompanies = briefingSource?.companies || {};
        const companyName = Object.keys(briefingCompanies)[0] || companyInfo.name || 'Unknown Company';
        const companyData = briefingCompanies[companyName] || {};
        const companyInfoBlock = companyData?.company_info || {};
        
        const founded = companyInfoBlock.founded || companyInfo.founded || null;
        const headquarters = companyInfoBlock.headquarters || companyInfo.headquarters || null;
        const employeeCount = companyInfoBlock.employee_count || companyInfoBlock.company_size || companyInfo.size || null;
        const industry = companyInfoBlock.industry || companyInfo.industry || null;
        const description = companyInfoBlock.description || companyInfo.description || null;
        const markets = companyInfoBlock.markets || companyInfoBlock.key_markets || companyInfo.markets || null;
        
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              {foundedYear && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                    <FiCalendar className="w-5 h-5 text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-900 mb-0.5">Founded</p>
                  <p className="text-sm font-medium text-gray-500">{foundedYear}</p>
                </div>
              )}
              
              {headquartersStr && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                    <FiMapPin className="w-5 h-5 text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-900 mb-0.5">Headquarters</p>
                  <p className="text-sm font-medium text-gray-500">{headquartersStr}</p>
                </div>
              )}
              
              {employeeCount && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                    <FiUsers className="w-5 h-5 text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-900 mb-0.5">No. of Employees</p>
                  <p className="text-sm font-medium text-gray-500">{employeeCount}</p>
                </div>
              )}
              
              {industry && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                    <FiSettings className="w-5 h-5 text-gray-900" />
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
                    <FiFileText className="w-5 h-5 text-gray-900" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Description</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
            </div>
            )}
            
            {/* Markets */}
            {markets && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FBBF24' }}>
                    <FiGlobe className="w-5 h-5 text-gray-900" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Markets</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{markets}</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const MeetingDetails = ({ meeting }) => {
  const [shareStatus, setShareStatus] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = async () => {
    if (!meeting?.id) return;

    setShareStatus('loading');

    try {
      const { createShareLink } = await import('../lib/sharesApi');
      const result = await createShareLink(meeting.id);

      if (result.success) {
        setShareUrl(result.shareUrl);
        setShareStatus('success');

        // Copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(result.shareUrl);
        }

        // Reset after 3 seconds
        setTimeout(() => {
          setShareStatus(null);
        }, 3000);
      } else {
        setShareStatus('error');
        console.error('Failed to create share link:', result.error);

        // Reset after 3 seconds
        setTimeout(() => {
          setShareStatus(null);
        }, 3000);
      }
    } catch (error) {
      setShareStatus('error');
      console.error('Error sharing meeting:', error);

      // Reset after 3 seconds
      setTimeout(() => {
        setShareStatus(null);
      }, 3000);
    }
  };

  if (!meeting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select a meeting to view details</p>
      </div>
    );
  }

  if (meeting.source === 'calendar') {
    const { startDate, endDate, attendees = [], platform, description, enrichmentStatus, rawEvent } = meeting;
    const newAttendees = rawEvent?.new_attendees || [];
    const linkedinUrls = rawEvent?.linkedin_urls || [];

    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl space-y-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            </div>
            <button
              onClick={handleShare}
              disabled={shareStatus === 'loading'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                shareStatus === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : shareStatus === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-primary text-white hover:bg-primary/90'
              } ${shareStatus === 'loading' ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="Share this meeting brief"
            >
              {shareStatus === 'loading' ? (
                <>
                  <FiShare2 className="w-4 h-4 animate-pulse" />
                  <span>Generating...</span>
                </>
              ) : shareStatus === 'success' ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>Link Copied!</span>
                </>
              ) : shareStatus === 'error' ? (
                <>
                  <FiX className="w-4 h-4" />
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <FiShare2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Meeting overview</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Start</p>
                <p>{formatDateTime(startDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">End</p>
                <p>{formatDateTime(endDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Duration</p>
                <p>{meeting.duration}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Location</p>
                <p className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span>{platform || rawEvent?.location || 'No location specified'}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Enrichment status</p>
                <p className="flex items-center gap-2">
                  <FiInfo className="w-4 h-4 text-gray-500" />
                  <span className="capitalize">{enrichmentStatus || 'pending'}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Recurring</p>
                <p>{rawEvent?.is_recurring ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiUsers className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Attendees</h2>
            </div>
            <ul className="space-y-2 text-gray-700 text-sm">
              {attendees.length > 0 ? (
                attendees.map((attendee) => (
                  <li key={attendee} className="flex items-start gap-2">
                    <span className="mt-1.5 text-purple-600">•</span>
                    <span>{attendee}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2 text-gray-500">
                  <span className="mt-1.5 text-purple-600">•</span>
                  <span>Just you</span>
                </li>
              )}
            </ul>

            {newAttendees.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-800 mb-2">New external attendees requiring research</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {newAttendees.map((attendee) => (
                    <li key={attendee.email || attendee}>{attendee.email || attendee}</li>
                  ))}
                </ul>
              </div>
            )}

            {linkedinUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-800 mb-2">LinkedIn profiles detected</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {linkedinUrls.map((entry, index) => (
                    <li key={index}>{entry.email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {description && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiInfo className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Agenda / Description</h2>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{description}</p>
            </div>
          )}

          <ResearchDetails meeting={meeting} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Meeting Intelligence</h1>
          <p className="text-gray-600">Research on attendees</p>
        </div>

        <ResearchDetails meeting={meeting} />
      </div>
    </div>
  );
};

export default MeetingDetails;
