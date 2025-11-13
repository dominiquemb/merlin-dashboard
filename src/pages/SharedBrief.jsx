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

  // Extract recent activity
  const recentActivity = [];
  Object.values(briefingCompanies).forEach((companyData) => {
    const recentNews = companyData?.recent_news;
    if (Array.isArray(recentNews)) {
      recentNews.forEach((newsItem) => {
        if (typeof newsItem === 'string') {
          recentActivity.push(newsItem);
        } else if (typeof newsItem === 'object') {
          const headline = newsItem.headline || newsItem.title || '';
          const summary = newsItem.summary || newsItem.description || '';
          const combined = [headline, summary].filter(Boolean).join(' — ');
          if (combined) recentActivity.push(combined);
        }
      });
    }

    const attendees = companyData?.attendees || [];
    attendees.forEach((attendee) => {
      const post = attendee?.social_media?.linkedin_post;
      if (post?.content) {
        const datePart = post.date || '';
        const content = post.content;
        const engagementParts = [];
        if (post.engagement?.likes) engagementParts.push(`${post.engagement.likes} likes`);
        if (post.engagement?.comments) engagementParts.push(`${post.engagement.comments} comments`);
        const engagement = engagementParts.length ? ` [${engagementParts.join(', ')}]` : '';
        const activityLine = `${attendee.name || 'User'} • LinkedIn${datePart ? ` (${datePart})` : ''}: ${content}${engagement}`;
        recentActivity.push(activityLine);
      }
    });
  });

  // Extract company info
  let companyInfo = null;
  for (const companyData of Object.values(briefingCompanies)) {
    const ci = companyData?.company_info;
    if (ci && Object.keys(ci).length > 0) {
      companyInfo = {
        size: ci.employee_count || ci.company_size || 'Unknown',
        industry: ci.industry || 'Unknown',
        revenue: ci.revenue_model || ci.financial_performance || 'Unknown',
        website: ci.website || '',
        linkedin: ci.linkedin_url || '',
        headquarters: ci.headquarters || null,
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

          {/* Meeting Overview */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
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
              {brief?.location && brief.location !== 'No Location' && (
                <div>
                  <p className="text-gray-500 uppercase tracking-wide text-xs mb-1">Location</p>
                  <p className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-gray-500" />
                    <span>{brief.location}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {brief?.description && brief.description !== 'No Description' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiInfo className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Agenda / Description</h3>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{brief.description}</p>
            </div>
          )}

          {/* Enriched Attendee Profiles */}
          {attendeeDetails.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <FiUsers className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Attendee Profiles</h3>
              </div>
              <div className="space-y-6">
                {attendeeDetails.map((attendee, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 border border-gray-100 rounded-2xl p-4 bg-white/40"
                  >
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {attendee.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{attendee.name}</h4>
                          {attendee.title && <p className="text-sm text-gray-600">{attendee.title}</p>}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <FiBriefcase className="w-4 h-4" />
                            <span>{attendee.company}</span>
                          </div>
                          {attendee.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <FiMapPin className="w-4 h-4" />
                              <span>{attendee.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {attendee.email && (
                            <a href={`mailto:${attendee.email}`} className="flex items-center gap-1 hover:text-primary">
                              <FiMail className="w-4 h-4" />
                              <span>{attendee.email}</span>
                            </a>
                          )}
                          {attendee.phone && (
                            <a href={`tel:${attendee.phone}`} className="flex items-center gap-1 hover:text-primary">
                              <FiPhone className="w-4 h-4" />
                              <span>{attendee.phone}</span>
                            </a>
                          )}
                          {attendee.linkedin && (
                            <a
                              href={attendee.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <FiLinkedin className="w-4 h-4" />
                              <span>LinkedIn</span>
                            </a>
                          )}
                        </div>
                      </div>
                      {attendee.summary && <p className="text-sm text-gray-600 mt-2">{attendee.summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {insights.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
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

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiClock className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
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

          {/* Company Information */}
          {companyInfo && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiBriefcase className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Company Size</p>
                  <p className="font-medium text-gray-900">{companyInfo.size}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Industry</p>
                  <p className="font-medium text-gray-900">{companyInfo.industry}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Revenue Model</p>
                  <p className="font-medium text-gray-900">{companyInfo.revenue}</p>
                </div>
                {companyInfo.website && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Website</p>
                    <a
                      href={companyInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {companyInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Data Available */}
          {attendeeDetails.length === 0 && insights.length === 0 && recentActivity.length === 0 && !companyInfo && (
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
