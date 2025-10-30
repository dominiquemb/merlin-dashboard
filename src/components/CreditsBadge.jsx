import React from 'react';

const CreditsBadge = ({ amount, text, icon }) => {
  return (
    <div className="flex items-center space-x-2 bg-accent-light border border-accent rounded-full px-4 py-2">
      {icon && (
        <div className="w-5 h-5 text-accent flex items-center justify-center">
          {icon}
        </div>
      )}
      {amount && (
        <span className="text-sm font-semibold text-neutral-800">
          {amount}
        </span>
      )}
      {text && (
        <span className="text-sm font-semibold text-neutral-800">
          {text}
        </span>
      )}
    </div>
  );
};

export default CreditsBadge;

