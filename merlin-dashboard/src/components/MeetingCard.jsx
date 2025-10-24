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
      className={`p-4 rounded-xl border-2 cursor-pointer transition mb-3 ${
        isSelected
          ? 'border-primary bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header with title and badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{meeting.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiClock className="w-4 h-4" />
            <span>{meeting.time}</span>
            <span>•</span>
            <span>{meeting.duration}</span>
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
            <FiCheck className="w-3 h-3" />
            Verified
          </div>
          <span className={`${getTypeColor(meeting.type)} text-white px-2 py-1 rounded text-xs font-medium`}>
            {getTypeText(meeting.type)}
          </span>
        </div>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <FiMapPin className="w-4 h-4" />
        <span>{meeting.platform}</span>
      </div>

      {/* Attendees */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <FiUsers className="w-4 h-4" />
        <span>{meeting.attendees.join(', ')}</span>
      </div>
    </div>
  );
};

export default MeetingCard;
