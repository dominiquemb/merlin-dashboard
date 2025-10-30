import React from 'react';
import Navbar from '../components/Navbar';
import { FiMail, FiCheckCircle, FiBarChart2, FiUsers, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { HiOutlineUserGroup, HiOutlineSpeakerphone } from 'react-icons/hi';

const Services = () => {
  const stakeholderIntelligenceIncluded = [
    'Comprehensive org chart mapping of target accounts',
    'Identification of key decision-makers and influencers',
    'Analysis of stakeholder relationships and power dynamics',
    'Champion identification and engagement strategies',
    'Buying committee composition and roles',
    'Historical decision-making patterns and preferences',
  ];

  const stakeholderIntelligenceBenefits = [
    'Reduce sales cycles by targeting the right stakeholders',
    'Increase win rates with strategic relationship mapping',
    'Navigate complex enterprise structures with confidence',
    'Build multi-threaded relationships across organizations',
  ];

  const prServicesIncluded = [
    'Strategic PR campaign planning and execution',
    'Media relations and press release distribution',
    'Thought leadership content development',
    'Industry analyst relations and briefings',
    'Award submissions and recognition programs',
    'Crisis communications and reputation management',
  ];

  const prServicesBenefits = [
    'Build brand awareness and market credibility',
    'Generate high-quality inbound leads',
    'Establish executives as industry thought leaders',
    'Increase media coverage and brand mentions',
  ];

  const handleContactClick = () => {
    window.location.href = 'mailto:insights@usemerlin.io';
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Services</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Accelerate your growth with Merlin's premium services. Tailored solutions designed to help
            you close more deals and expand your market presence.
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Stakeholder Intelligence Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Icon and Header */}
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <HiOutlineUserGroup className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Stakeholder Intelligence</h2>
              <p className="text-sm font-medium text-gray-600 mb-4">
                Map the power players in your target accounts
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Navigate complex enterprise organizations with confidence. Our Stakeholder Intelligence
                service identifies and maps key influencers, decision-makers, and champions within your
                target companies, giving you the insights needed to orchestrate winning deals.
              </p>
            </div>

            {/* What's Included */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FiBarChart2 className="w-4 h-4 text-gray-700" />
                <h3 className="font-semibold text-gray-900">What's Included</h3>
              </div>
              <div className="space-y-2">
                {stakeholderIntelligenceIncluded.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FiBarChart2 className="w-4 h-4 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Key Benefits</h3>
              </div>
              <div className="space-y-2">
                {stakeholderIntelligenceBenefits.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Badge */}
            <div className="mb-4">
              <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                Bespoke Pricing
              </span>
            </div>

            {/* Contact Button */}
            <button
              onClick={handleContactClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              <FiMail className="w-4 h-4" />
              Contact Us for Pricing
            </button>
          </div>

          {/* PR Services Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Icon and Header */}
            <div className="mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <HiOutlineSpeakerphone className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">PR Services</h2>
              <p className="text-sm font-medium text-gray-600 mb-4">
                Amplify your brand and drive growth
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Elevate your market presence and accelerate growth with our comprehensive PR services.
                We help B2B companies build authority, generate demand, and create meaningful connections
                with their target audience through strategic communications and media relations.
              </p>
            </div>

            {/* What's Included */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FiBarChart2 className="w-4 h-4 text-gray-700" />
                <h3 className="font-semibold text-gray-900">What's Included</h3>
              </div>
              <div className="space-y-2">
                {prServicesIncluded.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FiBarChart2 className="w-4 h-4 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Key Benefits</h3>
              </div>
              <div className="space-y-2">
                {prServicesBenefits.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Badge */}
            <div className="mb-4">
              <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                Bespoke Pricing
              </span>
            </div>

            {/* Contact Button */}
            <button
              onClick={handleContactClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              <FiMail className="w-4 h-4" />
              Contact Us for Pricing
            </button>
          </div>
        </div>

        {/* Why Choose Merlin Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Why Choose Merlin?</h2>
          <p className="text-gray-600 text-center mb-8">
            Merlin combines cutting-edge AI with deep B2B expertise to increase revenues
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Expert Team */}
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Team</h3>
              <p className="text-sm text-gray-600">
                Seasoned professionals with deep B2B intelligence and sales experience
              </p>
            </div>

            {/* Data-Driven */}
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTarget className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Data-Driven</h3>
              <p className="text-sm text-gray-600">
                AI-powered insights backed by comprehensive market intelligence
              </p>
            </div>

            {/* Proven Results */}
            <div className="text-center">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Proven Results</h3>
              <p className="text-sm text-gray-600">
                30%+ increase in engagements to conversions and 100% reduction in automating
                intelligence to accelerate growth and close deals
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
          <p className="text-gray-600 mb-6">
            Contact our team to discuss how our services can help you achieve your business goals.
          </p>
          <button
            onClick={handleContactClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <FiMail className="w-4 h-4" />
            Email insights@usemerlin.io
          </button>
        </div>
      </main>
    </div>
  );
};

export default Services;
