import React from 'react';
import Navbar from '../components/Navbar';
import ICPSettings from '../components/ICPSettings';

const ICPSettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Configure your Ideal Customer Profile criteria and custom insights
          </p>
        </div>

        {/* Settings Component */}
        <ICPSettings />
      </main>
    </div>
  );
};

export default ICPSettingsPage;

