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
  FiTarget,
} from 'react-icons/fi';

const formatDateTime = (date) =>
  date ? date.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not available';

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

const ResearchDetails = ({ meeting }) => {
  const attendeeDetails = meeting?.attendeeDetails || [];
  const insights = meeting?.insights || [];
  const recentLinkedInPost = meeting?.recentLinkedInPost || null;
  const recentNews = meeting?.recentNews || [];
  const companyInfo = meeting?.companyInfo;
  const readyToSend = meeting?.readyToSend || false;
  const hasEnrichment = meeting?.briefingSource || meeting?.enrichedSource;

  const hasResearch =
    attendeeDetails.length > 0 || insights.length > 0 || recentLinkedInPost || recentNews.length > 0 || !!companyInfo;

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

  // If meeting has enrichment but is not verified, show notice instead of cards
  if (hasEnrichment && !readyToSend) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Research</h2>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <FiClock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Enrichment Being Delivered Soon
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  The agent is now onboarding and will be ready to generate your insights in 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attendeeDetails.length > 0 && readyToSend && (
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
            let briefingMatch = null; // Store the matched attendee from briefing_source
            
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
                briefingMatch = match; // Store the match for use in rendering
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
            
            // Calculate tenure string - check briefing_source first (matching email template)
            let tenureStr = null;
            // First try to get from briefing_source (person.profile.tenure_months)
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
            // Fallback to enriched_source
            if (!tenureStr && tenureMonths) {
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
            
            // Get previous role - check briefing_source first (matching email template)
            let previousRoleStr = null;
            // First try from briefing_source (person.career.previous_positions[0])
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
            // Fallback to enriched_source
            if (!previousRoleStr) {
              const previousRole = previousPositions.length > 0 ? previousPositions[0] : null;
              if (previousRole) {
                previousRoleStr = `${previousRole.title || 'Previous Role'}${previousRole.company_name ? ` - ${previousRole.company_name}` : ''}`;
              }
            }
            
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
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/briefcase_fill.png" alt="Location" className="w-5 h-5" />
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
                  
                  {/* Decision-making Authority - check briefing_source first (matching email template) */}
                  {(briefingMatch?.profile?.decision_authority || enrichedAttendee?.decision_making_authority) && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-2" style={{ backgroundColor: '#FBBF24' }}>
                        <img src="https://d1udkp95fdo7mt.cloudfront.net/images/scales.png" alt="Decision-making Authority" className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-900 mb-0.5">Decision-making Authority</p>
                      <p className="text-sm font-medium text-gray-500">{briefingMatch?.profile?.decision_authority || enrichedAttendee?.decision_making_authority || ''}</p>
                    </div>
                  )}
                </div>
                
                {/* Insights (biography removed per user request) */}
                {insights.length > 0 && readyToSend && (
                  <div className="mb-6">
                    <div className="space-y-2 text-sm text-gray-700">
                      {insights.map((insight, idx) => (
                        <div key={idx}>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Background Section - Separate Card (matching email template) */}
      {attendeeDetails.length > 0 && readyToSend && attendeeDetails.map((attendee, index) => {
        const briefingSource = meeting?.briefingSource || meeting?.briefing_source;
        const briefingCompanies = briefingSource?.companies || {};
        
        // Find matching attendee from briefing_source
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
              {/* Additional current positions (skip first one as it's the main role) */}
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
              {/* Previous positions */}
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

      {/* Interesting Fact Section - Separate Card (matching email template) */}
      {attendeeDetails.length > 0 && readyToSend && attendeeDetails.map((attendee, index) => {
        const briefingSource = meeting?.briefingSource || meeting?.briefing_source;
        const briefingCompanies = briefingSource?.companies || {};
        
        // Find matching attendee from briefing_source
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

      {/* Recent LinkedIn Post Section (matching email format) */}
      {recentLinkedInPost && readyToSend && (
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

      {/* Recent News Section (matching email format) */}
      {recentNews.length > 0 && readyToSend && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-center mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent News</h2>
          </div>
          <div className="text-sm text-gray-700">
            {recentNews.map((newsItem, index) => (
              <div key={index} className="text-gray-700 mb-2 last:mb-0">
                {newsItem.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {companyInfo && readyToSend && (() => {
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
        const customers = companyInfoBlock.customers || null;
        const products = companyInfoBlock.products || companyInfoBlock.primary_products || null;
        const revenueModel = companyInfoBlock.revenue_model || null;
        const financialPerformance = companyInfoBlock.financial_performance || null;
        const competitors = companyInfoBlock.competitors || null;
        const decisionMakers = companyInfoBlock.decision_makers || null;
        const customInsights = Array.isArray(companyInfoBlock.custom_insights)
          ? companyInfoBlock.custom_insights
          : [];
        
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
            
            {/* Custom Insights (match email template layout) */}
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
                              const url =
                                typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))
                                  ? src
                                  : `https://${src}`;
                              const label = src.length > 60 ? `${src.slice(0, 57)}…` : src;
                              return (
                                <span key={sIdx}>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    “{label}”
                                  </a>
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
