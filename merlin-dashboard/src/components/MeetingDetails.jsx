import React from 'react';
import { FiMail, FiPhone, FiLinkedin, FiTrendingUp, FiClock, FiBriefcase } from 'react-icons/fi';

const MeetingDetails = ({ meeting }) => {
  if (!meeting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select a meeting to view research</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Meeting Intelligence</h1>
          <p className="text-gray-600">Research on attendees</p>
        </div>

        {/* Attendees */}
        <div className="space-y-6 mb-8">
          {meeting.attendeeDetails?.map((attendee, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
              {/* Attendee Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {attendee.initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{attendee.name}</h3>
                  <p className="text-gray-600">{attendee.title}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <FiBriefcase className="w-4 h-4" />
                    <span>{attendee.company}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiMail className="w-4 h-4" />
                  <a href={`mailto:${attendee.email}`} className="hover:text-primary">
                    {attendee.email}
                  </a>
                </div>
                {attendee.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiPhone className="w-4 h-4" />
                    <a href={`tel:${attendee.phone}`} className="hover:text-primary">
                      {attendee.phone}
                    </a>
                  </div>
                )}
                {attendee.linkedin && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiLinkedin className="w-4 h-4" />
                    <a
                      href={attendee.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {attendee.linkedin}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Key Insights */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Key Insights</h2>
          </div>
          <ul className="space-y-2">
            {meeting.insights?.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-primary mt-1.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FiClock className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <ul className="space-y-2">
            {meeting.recentActivity?.map((activity, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-purple-600 mt-1.5">•</span>
                <span>{activity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Information */}
        {meeting.companyInfo && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiBriefcase className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Company Size</p>
                <p className="font-medium text-gray-900">{meeting.companyInfo.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Industry</p>
                <p className="font-medium text-gray-900">{meeting.companyInfo.industry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="font-medium text-gray-900">{meeting.companyInfo.revenue}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;
