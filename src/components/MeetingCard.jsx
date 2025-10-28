import React from 'react';
import { FiClock, FiMapPin, FiUsers, FiCheck } from 'react-icons/fi';

const MeetingCard = ({ meeting, isSelected, onClick }) => {
  const getTypeColor = (type) => {
    return type === 'external' ? 'bg-gray-900' : 'bg-yellow-500';
  };

  const getTypeText = (type) => {
    return type === 'external' ? 'external' : 'internal';
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl border-2 cursor-pointer transition mb-3 shadow-sm ${
        isSelected
          ? 'border-gold bg-accent-light'
          : 'border-neutral-300 bg-white hover:border-neutral-400'
      }`}
    >
      {/* Header with title and badges */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-800 mb-3 text-lg">{meeting.title}</h3>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <FiClock className="w-4 h-4 flex-shrink-0" />
            <span>{meeting.time}</span>
            <span>•</span>
            <span>{meeting.duration}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
            <FiCheck className="w-3 h-3" />
            Verified
          </div>
          <span className={`${getTypeColor(meeting.type)} text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap`}>
            {getTypeText(meeting.type)}
          </span>
        </div>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
        <FiMapPin className="w-4 h-4" />
        <span>{meeting.platform}</span>
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
