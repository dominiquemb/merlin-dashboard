import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FiMail, FiCheckCircle, FiBarChart2, FiUsers, FiTarget, FiTrendingUp, FiAlertCircle, FiX, FiSend } from 'react-icons/fi';
import { HiOutlineUserGroup, HiOutlineSpeakerphone } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';

const Services = () => {
  const { user } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const reputationIntelligenceIncluded = [
    'Real-time press and media monitoring',
    'Executive movement and leadership change alerts',
    'Industry analyst coverage and commentary',
    'Sentiment analysis and trend tracking',
    'Competitive positioning and market perception',
    'Social media monitoring and engagement signals',
  ];

  const reputationIntelligenceBenefits = [
    { metric: '2.5x', description: 'Faster response to account changes' },
    { metric: '60%', description: 'Reduction in lost deals to surprises' },
    { metric: '85%', description: 'Earlier risk detection' },
  ];

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

  const handleContactClick = (serviceName) => {
    setSelectedService(serviceName);
    setEmailMessage(`Hi Merlin, I'd like to learn more about ${serviceName} and discuss pricing.`);
    setEmailSent(false);
    setShowContactModal(true);
  };

  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();

    setIsSendingEmail(true);
    try {
      const formData = new FormData();
      formData.append('name', user?.user_metadata?.full_name || user?.email || 'User');
      formData.append('email', user?.email || '');
      formData.append('message', emailMessage);
      formData.append('_subject', `Service Inquiry: ${selectedService}`);
      formData.append('_captcha', 'false');

      const response = await fetch('https://formsubmit.co/insights@usemerlin.io', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Email sent successfully to insights@usemerlin.io');
        setEmailSent(true);
        setTimeout(() => {
          setShowContactModal(false);
        }, 2000);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="w-full px-6 py-12">
        {/* Full Width Header Section */}
        <div className="max-w-6xl mx-auto text-center mb-12">
          <div className="inline-block bg-accent-light border border-accent px-4 py-2 rounded-full mb-4">
            <span className="text-sm font-medium text-gray-900">Premium Services</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Accelerate Your Growth</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Premium services designed to help you close more deals and expand your market presence.
            Trusted by top-performing sales teams and growth leaders.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">The Impact of Premium Services</h2>
        </div>

        {/* Reputation Intelligence - Full Width Card */}
        <div className="mb-12">
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-8">
            {/* Top Section with Icon, Title, and Metric */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reputation Intelligence</h2>
                  <p className="text-base font-medium text-gray-600 mb-3">
                    Stay ahead of account changes
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Monitor your target accounts in real-time. Track press mentions, sentiment shifts, executive moves, and competitive
                    positioning to stay informed and responsive.
                  </p>
                </div>
              </div>
              <div className="text-right ml-8 flex-shrink-0">
                <div className="text-4xl font-bold text-green-600">2.5x</div>
                <div className="text-sm text-gray-600 mt-1">Faster Account Response</div>
              </div>
            </div>

            {/* What's Included */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FiCheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 text-lg">What's Included</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {reputationIntelligenceIncluded.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FiBarChart2 className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900 text-lg">Key Benefits</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {reputationIntelligenceBenefits.map((benefit, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{benefit.metric}</div>
                    <div className="text-sm text-gray-700">{benefit.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                Bespoke Pricing
              </span>
              <button
                onClick={() => handleContactClick('Reputation Intelligence')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                <FiMail className="w-4 h-4" />
                Contact Us for Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Stakeholder Intelligence Card */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
            {/* Icon and Header */}
            <div className="mb-6">
              <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center mb-4">
                <HiOutlineUserGroup className="w-6 h-6 text-accent" />
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
              onClick={() => handleContactClick('Stakeholder Intelligence')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              <FiMail className="w-4 h-4" />
              Contact Us for Pricing
            </button>
          </div>

          {/* PR Services Card */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
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
              onClick={() => handleContactClick('PR Services')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              <FiMail className="w-4 h-4" />
              Contact Us for Pricing
            </button>
          </div>
        </div>

        {/* Why Choose Merlin Section */}
        <div className="bg-accent-light border border-accent rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Why Choose Merlin?</h2>
          <p className="text-gray-600 text-center mb-8">
            Merlin combines cutting-edge AI with deep B2B expertise to increase revenues
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Expert Team */}
            <div className="text-center">
              <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-7 h-7 text-black" />
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
            onClick={() => handleContactClick('Premium Services')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <FiMail className="w-4 h-4" />
            Email insights@usemerlin.io
          </button>
        </div>
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-6 h-6" />
            </button>

            {emailSent ? (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">
                  We'll get back to you shortly about {selectedService}.
                </p>
              </div>
            ) : (
              /* Email Form */
              <form onSubmit={handleSendEmail}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Send us a message about <span className="font-semibold">{selectedService}</span>
                </p>

                <div className="space-y-4">
                  {/* From (user's email) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* To (fixed) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <input
                      type="email"
                      value="insights@usemerlin.io"
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={5}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowContactModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail || !emailMessage.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingEmail ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
