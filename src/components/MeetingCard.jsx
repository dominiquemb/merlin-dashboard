import React from 'react';
import { FiClock, FiMapPin, FiUsers, FiCheck } from 'react-icons/fi';

const MeetingCard = ({ meeting, isSelected, onClick }) => {
  const getTypeColor = (type) => {
    return type === 'external' ? 'bg-gray-900' : 'bg-orange-600';
  };

  const getTypeText = (type) => {
    return type === 'external' ? 'external' : 'internal';
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 cursor-pointer transition mb-3 ${
        isSelected
          ? 'border-gold bg-accent-light'
          : 'border-gray-100 bg-[#fafafa] hover:border-gray-200'
      }`}
    >
      {/* Status Badges - Top Right on Separate Row */}
      <div className="flex items-center justify-end gap-2 mb-3 w-full">
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
        {meeting.type && (
          <span className={`${getTypeColor(meeting.type)} text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap`}>
            {getTypeText(meeting.type)}
          </span>
        )}
      </div>

      {/* Title - Full Width */}
      <h3 className="font-semibold text-neutral-800 mb-3 text-lg w-full">{meeting.title}</h3>

      {/* Date and Time Row */}
      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
        <FiClock className="w-4 h-4 flex-shrink-0" />
        <span>{meeting.time}</span>
        <span>•</span>
        <span>{meeting.duration}</span>
      </div>

      {/* Platform */}
      <div className="flex items-start gap-2 text-sm text-neutral-600 mb-3">
        <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {(() => {
            const loc = meeting.platform || meeting.rawEvent?.location;
            if (!loc) return <span>No location specified</span>;
            if (typeof loc !== 'string') return <span>No location specified</span>;
            const trimmed = loc.trim();
            if (!trimmed || trimmed === 'No Location' || trimmed === 'No location') return <span>No location specified</span>;
            
            // Parse Zoom link, password, and email
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
              
              return (
                <div className="space-y-1">
                  <div>
                    <a 
                      href={zoomUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {zoomUrl}
                    </a>
                  </div>
                  {password && (
                    <div className="text-xs text-gray-500">
                      Password: {password}
                    </div>
                  )}
                  {email && (
                    <div className="text-xs text-gray-500">
                      {email}
                    </div>
                  )}
                </div>
              );
            }
            
            // Not a Zoom link, return as-is
            return <span className="break-all">{trimmed}</span>;
          })()}
        </div>
      </div>

      {/* Attendees */}
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <FiUsers className="w-4 h-4" />
        <span>{meeting.attendees.join(', ')}</span>
      </div>
    </div>
  );
};

export default MeetingCard;
