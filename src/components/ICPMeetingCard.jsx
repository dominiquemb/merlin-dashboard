import React, { useState } from 'react';
import { FiClock, FiMapPin, FiUsers, FiAlertCircle, FiBriefcase, FiCheck } from 'react-icons/fi';

const ICPMeetingCard = ({ meeting }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Determine if this is an ICP fit or non-fit based on reasons
  const isIcpFit = meeting.icpScore && meeting.icpScore.score >= 10;

  return (
    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
            {isIcpFit ? (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                ✓ ICP Match
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                Low ICP Match
              </span>
            )}
            {meeting.readyToSend ? (
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                <FiCheck className="w-3 h-3" />
                Verified
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                Pending Verification
              </div>
            )}
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
      </div>

      {/* Reasons Section */}
      {meeting.reasons && meeting.reasons.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          <div className={`flex items-start gap-2 rounded-lg p-4 transition ${isIcpFit ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-orange-50 border border-orange-200 hover:bg-orange-100'}`}>
            <FiAlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isIcpFit ? 'text-green-600' : 'text-orange-600'}`} />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 mb-2">{isIcpFit ? 'Reasons why relevant:' : 'Reasons why not relevant:'}</p>
              {isExpanded && (
                <ul className="space-y-2 text-sm text-gray-700">
                  {meeting.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`mt-1 ${isIcpFit ? 'text-green-600' : 'text-orange-600'}`}>•</span>
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
      )}
    </div>
  );
};

export default ICPMeetingCard;
