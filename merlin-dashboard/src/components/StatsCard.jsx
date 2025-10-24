import React from 'react';
import { FiClock } from 'react-icons/fi';

const StatsCard = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <FiClock className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-gray-700 font-medium mb-1">
            Time Saved on Pre-Meeting Intelligence
          </h3>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">78 hours</span>
            <span className="text-gray-600">across 156 meetings</span>
          </div>
          <p className="text-gray-600">
            That's 10 days of research work automated
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
