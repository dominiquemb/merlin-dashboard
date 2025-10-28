import React from 'react';

const ServiceCard = ({ icon, title, description, buttonText, iconBgColor, iconColor }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all">
      {/* Icon */}
      <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center mb-5`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-display font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        {description}
      </p>

      {/* Button */}
      <button className="w-full py-3 px-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
        {buttonText}
      </button>
    </div>
  );
};

export default ServiceCard;
