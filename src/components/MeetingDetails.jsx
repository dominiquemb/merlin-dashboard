import React from 'react';
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
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
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
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FiUsers className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Enriched Attendee Profiles</h2>
          </div>
          <div className="space-y-6">
            {attendeeDetails.map((attendee, index) => (
              <div
                key={index}
                className="flex items-start gap-4 border border-gray-100 rounded-2xl p-4 bg-white/40"
              >
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {attendee.initials}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{attendee.name}</h3>
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
                  {attendee.summary && (
                    <p className="text-sm text-gray-600 mb-2">{attendee.summary}</p>
                  )}
                  {Array.isArray(attendee.similarities) && attendee.similarities.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-1">
                      {attendee.similarities.map((similarity, simIndex) => {
                        if (!similarity) return null;
                        const text =
                          typeof similarity === 'string'
                            ? similarity
                            : similarity.description || similarity.summary || similarity.text || '';
                        if (!text) return null;
                        return <li key={simIndex}>• {text}</li>;
                      })}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
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
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
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

      {companyInfo && (
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiBriefcase className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Company Size</p>
              <p className="font-medium text-gray-900">{companyInfo.size || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Industry</p>
              <p className="font-medium text-gray-900">{companyInfo.industry || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Revenue Model</p>
              <p className="font-medium text-gray-900">{companyInfo.revenue || 'Unknown'}</p>
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
    </div>
  );
};

const MeetingDetails = ({ meeting }) => {
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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{meeting.title}</h1>
            <p className="text-gray-600">Synced from your calendar</p>
          </div>

          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
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
                  <span>{platform}</span>
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

          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
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
                <li className="text-gray-500">Just you for now</li>
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
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
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
