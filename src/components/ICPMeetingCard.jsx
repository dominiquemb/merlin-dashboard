import React, { useState } from 'react';
import { FiClock, FiMapPin, FiUsers, FiAlertCircle, FiBriefcase } from 'react-icons/fi';

const ICPMeetingCard = ({ meeting }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
              Low ICP Match
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <FiClock className="w-4 h-4" />
              <span>{meeting.date} • {meeting.time}</span>
            </div>
            <span>•</span>
            <span>{meeting.duration}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <FiBriefcase className="w-4 h-4" />
              <span>{meeting.company}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiMapPin className="w-4 h-4" />
              <span>{meeting.platform}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUsers className="w-4 h-4" />
            <div className="flex items-center gap-2">
              {meeting.attendees.map((attendee, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {attendee.initials}
                  </div>
                  <span>{attendee.name}</span>
                  {idx < meeting.attendees.length - 1 && <span>,</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ICP Score */}
        {meeting.icpScore && (
          <div className="ml-4 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{meeting.icpScore.score}</div>
              <div className="text-xs text-red-600">/ {meeting.icpScore.maxScore}</div>
            </div>
          </div>
        )}
      </div>

      {/* Reasons Section */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full"
      >
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition">
          <FiAlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 mb-2">Reasons why not relevant:</p>
            {isExpanded && (
              <ul className="space-y-2 text-sm text-gray-700">
                {meeting.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-gray-400 text-sm flex-shrink-0">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </button>
    </div>
  );
};

export default ICPMeetingCard;
