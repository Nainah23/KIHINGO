import React from 'react';

export const Card = ({ children, className }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => {
  return (
    <div className={`border-b pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className }) => {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
};

export const CardContent = ({ children, className }) => {
  return (
    <div className={`text-gray-700 ${className}`}>
      {children}
    </div>
  );
};
