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
      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
        <FiMapPin className="w-4 h-4" />
        <span>{meeting.platform || meeting.rawEvent?.location || 'No location specified'}</span>
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
