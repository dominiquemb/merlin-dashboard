import React from 'react';

const ServiceCard = ({ icon, title, description, buttonText, iconBgColor, iconColor }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      {/* Icon */}
      <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center mb-4`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        {description}
      </p>

      {/* Button */}
      <button className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
        {buttonText}
      </button>
    </div>
  );
};

export default ServiceCard;
