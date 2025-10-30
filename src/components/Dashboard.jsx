import React from 'react';
import Navbar from './Navbar';
import StatsCard from './StatsCard';
import ServiceCard from './ServiceCard';
import { FiCalendar, FiDatabase, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const services = [
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: 'Pre meeting intelligence',
      description: 'Get comprehensive insights about your prospects before every meeting.',
      buttonText: 'View Meetings',
      iconBgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      icon: <FiDatabase className="w-6 h-6" />,
      title: 'Data enrichment',
      description: 'Enhance your contact data with real-time information and insights.',
      buttonText: 'Enrich Data',
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: <FiBriefcase className="w-6 h-6" />,
      title: 'Services',
      description: 'Access all your business services and integrations in one place.',
      buttonText: 'Browse Services',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
            {/* Welcome Section */}
            <div className="mb-12">
            <h1 className="text-4xl font-display font-bold text-black mb-3">
              Welcome back, {
                user?.user_metadata?.given_name || 
                user?.user_metadata?.full_name?.split(' ')[0] || 
                user?.user_metadata?.name?.split(' ')[0] || 
                user?.email?.split('@')[0] || 
                'there'
              }
            </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your business today.
              </p>
            </div>

        {/* Stats Card */}
        <StatsCard />

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              buttonText={service.buttonText}
              iconBgColor={service.iconBgColor}
              iconColor={service.iconColor}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
