import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import MeetingCard from '../components/MeetingCard';
import MeetingDetails from '../components/MeetingDetails';
import { FiChevronLeft, FiChevronRight, FiCreditCard } from 'react-icons/fi';

const Meetings = () => {
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Sample meetings data
  const meetings = [
    {
      id: 1,
      title: 'Product Demo - Acme Corp',
      time: '09:00 AM',
      duration: '30 min',
      platform: 'Zoom',
      type: 'external',
      attendees: ['Sarah Johnson', 'Mike Chen'],
      attendeeDetails: [
        {
          name: 'Sarah Johnson',
          initials: 'SJ',
          title: 'VP of Engineering',
          company: 'Acme Corp',
          email: 'sarah@acmecorp.com',
          phone: '+1 (555) 123-4567',
          linkedin: 'linkedin.com/in/sarahjohnson',
        },
      ],
      insights: [
        'Founded Acme Corp 3 years ago',
        'Series B funded ($15M) - 8 months ago',
        'Previously led engineering at TechCo',
        'Known for building scalable systems',
      ],
      recentActivity: [
        'Posted about new product launch on LinkedIn - 2 days ago',
        'Speaking at Tech Conference next month',
        'Hiring for 3 senior engineering roles',
      ],
      companyInfo: {
        size: '50-100 employees',
        industry: 'SaaS',
        revenue: '$5M - $10M ARR',
      },
    },
    {
      id: 2,
      title: 'Discovery Call - TechStart Inc',
      time: '11:00 AM',
      duration: '45 min',
      platform: 'Google Meet',
      type: 'external',
      attendees: ['David Martinez'],
      attendeeDetails: [
        {
          name: 'David Martinez',
          initials: 'DM',
          title: 'CTO',
          company: 'TechStart Inc',
          email: 'david@techstart.io',
          phone: '+1 (555) 987-6543',
          linkedin: 'linkedin.com/in/davidmartinez',
        },
      ],
      insights: [
        'Founded TechStart Inc 2 years ago',
        'Series A funded ($10M) - 6 months ago',
        'Previously led engineering at Stripe',
        'Known for building high-performance teams',
      ],
      recentActivity: [
        'Announced new product launch on Twitter - 3 days ago',
        'Speaking at TechCrunch Disrupt next month',
        'Hiring for 5 senior engineering roles',
      ],
      companyInfo: {
        size: '20-50 employees',
        industry: 'FinTech',
        revenue: '$2M - $5M ARR',
      },
    },
    {
      id: 3,
      title: 'Strategic Planning Session',
      time: '02:00 PM',
      duration: '1 hour',
      platform: 'Conference Room A',
      type: 'internal',
      attendees: ['Emma Wilson', 'James Brown'],
      attendeeDetails: [
        {
          name: 'Emma Wilson',
          initials: 'EW',
          title: 'Product Manager',
          company: 'Merlin Intelligence',
          email: 'emma@merlin.ai',
        },
        {
          name: 'James Brown',
          initials: 'JB',
          title: 'Lead Designer',
          company: 'Merlin Intelligence',
          email: 'james@merlin.ai',
        },
      ],
      insights: [
        'Q4 planning priorities',
        'New feature roadmap discussion',
        'Team resource allocation',
      ],
      recentActivity: [
        'Completed user research study',
        'Updated design system',
        'Planning team offsite',
      ],
    },
  ];

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Meetings List */}
        <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Meetings</h2>

            {/* Credit Badge */}
            <div className="flex items-center gap-2 text-sm text-primary bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
              <FiCreditCard className="w-4 h-4" />
              <span className="font-medium">1 credit/meeting</span>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition"
              >
                Today
              </button>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Current Date */}
            <p className="text-sm text-gray-600 mt-3">{formatDate(currentDate)}</p>
          </div>

          {/* Meetings List */}
          <div className="flex-1 overflow-y-auto p-4">
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No meetings scheduled</p>
              </div>
            ) : (
              meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  isSelected={selectedMeetingId === meeting.id}
                  onClick={() => setSelectedMeetingId(meeting.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Meeting Details */}
        <MeetingDetails meeting={selectedMeeting} />
      </div>
    </div>
  );
};

export default Meetings;
