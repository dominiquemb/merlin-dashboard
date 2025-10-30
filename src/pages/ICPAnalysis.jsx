import React from 'react';
import Navbar from '../components/Navbar';
import ICPMeetingCard from '../components/ICPMeetingCard';
import ICPSettings from '../components/ICPSettings';
import CreditsBadge from '../components/CreditsBadge';
import { FiAlertCircle, FiCalendar, FiCreditCard } from 'react-icons/fi';

const ICPAnalysis = () => {
  // Sample data for low ICP match meetings
  const lowICPMeetings = [
    {
      id: 1,
      title: 'Product Demo - Acme Corp',
      date: 'Oct 19, 2025',
      time: '09:00 AM',
      duration: '30 min',
      company: 'Acme Corp',
      platform: 'Zoom',
      attendees: [
        { name: 'Sarah Johnson', initials: 'SJ' },
        { name: 'Mike Chen', initials: 'MC' },
      ],
      icpScore: {
        score: 5,
        maxScore: 15,
      },
      reasons: [
        'Company size (500-1000 employees) is below our ideal range of 1000+',
        'Industry (Enterprise Software) is outside our target verticals',
        'Budget authority unclear - VP of Sales may not have final decision power',
      ],
    },
    {
      id: 2,
      title: 'Discovery Call - TechStart Inc',
      date: 'Oct 19, 2025',
      time: '11:00 AM',
      duration: '45 min',
      company: 'TechStart Inc',
      platform: 'Google Meet',
      attendees: [
        { name: 'David Martinez', initials: 'DM' },
      ],
      icpScore: {
        score: 4,
        maxScore: 15,
      },
      reasons: [
        'Early-stage startup with only 20-50 employees (below our minimum of 500)',
        'Recent Series A funding suggests limited budget for enterprise solutions',
        'Tech stack may not be mature enough for our product integration',
      ],
    },
    {
      id: 3,
      title: 'Consultation - StartupXYZ',
      date: 'Oct 20, 2025',
      time: '02:00 PM',
      duration: '30 min',
      company: 'StartupXYZ',
      platform: 'Zoom',
      attendees: [
        { name: 'Emma Wilson', initials: 'EW' },
      ],
      icpScore: {
        score: 6,
        maxScore: 15,
      },
      reasons: [
        'Company is in pre-seed stage with less than 20 employees',
        'Industry (Consumer Tech) doesn\'t match our B2B focus',
        'Limited runway may prevent long-term commitment to our platform',
      ],
    },
  ];

  const weekRange = 'Oct 19 - Oct 25, 2025';

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">ICP Analysis</h1>
            <CreditsBadge 
              text="1 credit/analysis"
              icon={<FiCreditCard />}
            />
          </div>
          <p className="text-gray-600">
            Review upcoming meetings with low alignment to your Ideal Customer Profile
          </p>
        </div>

        {/* Settings */}
        <ICPSettings />

        {/* Alert Summary Card */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiAlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Meetings That Don't Fit Your ICP
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                <span className="font-bold">{lowICPMeetings.length} meetings</span>{' '}
                <span className="text-gray-600">this week</span>
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="w-4 h-4" />
                <span>{weekRange}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Cards */}
        <div className="space-y-4">
          {lowICPMeetings.map((meeting) => (
            <ICPMeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>

        {/* Empty State (shown when no low ICP meetings) */}
        {lowICPMeetings.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All meetings match your ICP!
            </h3>
            <p className="text-gray-600">
              Great news! All your upcoming meetings align well with your Ideal Customer Profile.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ICPAnalysis;
