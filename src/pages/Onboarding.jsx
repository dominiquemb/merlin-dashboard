import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FiChevronDown, FiChevronUp, FiMail, FiMessageSquare, FiBriefcase, FiTarget, FiZap, FiCreditCard, FiX, FiSend } from 'react-icons/fi';
import CreditsBadge from '../components/CreditsBadge';
import AddSettingsModal from '../components/AddSettingsModal';
import { createSetting, exchangeOAuthCode } from '../lib/settingsApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [icpAnalysisEnabled, setIcpAnalysisEnabled] = useState(true);
  const [icpCriteriaExpanded, setIcpCriteriaExpanded] = useState(false);
  const [deliveryChannels, setDeliveryChannels] = useState({
    email: true,
    slack: false,
    crm: false,
  });
  const [employeeRanges, setEmployeeRanges] = useState([]);
  const [yearsFounded, setYearsFounded] = useState([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmEmailMessage, setCrmEmailMessage] = useState('');
  const [isSendingCrmEmail, setIsSendingCrmEmail] = useState(false);
  const [crmEmailSent, setCrmEmailSent] = useState(false);

  // Handle OAuth return when component mounts
  useEffect(() => {
    const handleOAuthReturn = async () => {
      console.log('Onboarding mounted, checking for OAuth return...');
      console.log('Current URL:', window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      const oauthReturn = urlParams.get('oauth_return');
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      // Check if user returned from OAuth (they navigated back manually)
      const oauthInProgress = localStorage.getItem('settings_oauth_in_progress');
      
      if (oauthReturn === 'true' || oauthInProgress === 'true') {
        console.log('User returned from OAuth flow');
        
        // Try to get the token from merlin-core-app's localStorage via iframe/postMessage
        // Since we can't access cross-origin localStorage, we'll need to user to manually
        // copy the token or we'll need to use a different approach
        
        // For now, show a message asking user to copy the token
        if (oauthInProgress === 'true') {
          setSaveMessage('⚠️ OAuth completed. Please check merlin-core-app dashboard for your JWT token, or use email/password login instead.');
          setTimeout(() => setSaveMessage(''), 10000);
          localStorage.removeItem('settings_oauth_in_progress');
          localStorage.removeItem('settings_oauth_provider');
          localStorage.removeItem('settings_oauth_return_url');
        }
        
        // Clean up URL
        if (oauthReturn === 'true') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }
      
      if (error) {
        console.error('OAuth error:', error);
        setSaveMessage(`❌ OAuth authentication failed: ${error}`);
        setTimeout(() => setSaveMessage(''), 5000);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (code) {
        console.log('✅ OAuth callback detected with code:', code.substring(0, 20) + '...');
        try {
          const response = await exchangeOAuthCode(code);
          console.log('OAuth exchange response:', response);
          if (!response.error) {
            console.log('✅ OAuth authentication successful, token stored');
            window.history.replaceState({}, document.title, window.location.pathname);
            // Open the modal if it was in progress
            if (oauthInProgress === 'true') {
              console.log('Reopening Slack modal after OAuth');
              setIsSlackModalOpen(true);
              localStorage.removeItem('settings_oauth_in_progress');
              localStorage.removeItem('settings_oauth_provider');
              localStorage.removeItem('settings_oauth_return_url');
            }
          } else {
            console.error('❌ OAuth exchange failed:', response.message);
            setSaveMessage(`❌ OAuth authentication failed: ${response.message}`);
            setTimeout(() => setSaveMessage(''), 5000);
          }
        } catch (error) {
          console.error('❌ Error handling OAuth callback:', error);
          setSaveMessage(`❌ Error during OAuth authentication: ${error.message}`);
          setTimeout(() => setSaveMessage(''), 5000);
        }
      }
    };

    handleOAuthReturn();
  }, []);

  // Custom insights questions organized by category
  const [selectedQuestions, setSelectedQuestions] = useState({
    brand: [
      'Does the company have any negative news or press releases recently (limit to last 6 months)?',
      'Does the company have any positive news or press releases recently (limit to last 6 months)?',
      'Has the company completed a rebrand or refresh of their website recently?',
    ],
    customers: [],
    esg: [],
    growth: [],
    hiringHR: [],
    industry: [],
    product: [],
  });

  const questionCategories = {
    brand: {
      label: 'Brand',
      count: 4,
      questions: [
        'Does the company have any negative news or press releases recently (limit to last 6 months)?',
        'Does the company have any positive news or press releases recently (limit to last 6 months)?',
        'Has the company completed a rebrand or refresh of their website recently?',
        'Does the company have any negative reviews to do with delivery or customer service?',
      ],
    },
    customers: {
      label: 'Customers',
      count: 3,
      questions: [
        'Does the company have customers in highly regulated industries?',
        'Does the company have a large user community or user base?',
        'Has the company onboarded new customers recently',
      ],
    },
    esg: {
      label: 'ESG',
      count: 4,
      questions: [
        'Does the company have a sustainability, climate or ESG report?',
        'Is the company part of any climate-focussed organisations / certifications?',
        'Is the company reporting their CO2 carbon footprint?',
        'Does the company have any net zero (emissions) goals / targets before 2030?',
      ],
    },
    growth: {
      label: 'Growth',
      count: 4,
      questions: [
        'Is the company expanding their physical locations or offices?',
        'Is the company struggling with high churn rates?',
        'Does the company have an enterprise sales model?',
        'What are their current sales priorities?',
      ],
    },
    hiringHR: {
      label: 'Hiring & HR',
      count: 6,
      questions: [
        'Is the company actively hiring?',
        'Has the company laid off employees recently?',
        'Who has the company recently hired in the last 6 months?',
        'Has the company made any senior hire such as new CEO, C-level executive, vice-presidents or board member?',
        'Have they had any recent senior sales hires?',
        'Is the company experiencing employee dissatisfaction?',
      ],
    },
    industry: {
      label: 'Industry',
      count: 2,
      questions: [
        'What is the latest legislation change that will impact the company?',
        'What are the key trends or drivers affecting the industry of the company?',
      ],
    },
    product: {
      label: 'Product',
      count: 7,
      questions: [
        'Is the company removing any features from their product or service?',
        'Does the company have an iOS or Android mobile app?',
        'What types of customer support does the company have?',
        'Has the company launched a new product in the last 6 months?',
        'Is the company expecting to launch a new product in next 3-6 months?',
        'Does the company offer repeat purchases?',
        'List of new developments the company is working on',
      ],
    },
  };

  const toggleQuestion = (category, question) => {
    setSelectedQuestions(prev => {
      const categoryQuestions = prev[category] || [];
      const isSelected = categoryQuestions.includes(question);

      return {
        ...prev,
        [category]: isSelected
          ? categoryQuestions.filter(q => q !== question)
          : [...categoryQuestions, question],
      };
    });
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedQuestions).reduce((total, questions) => total + questions.length, 0);
  };

  // Load ICP settings from backend
  useEffect(() => {
    const loadICPSettings = async () => {
      setIsLoading(true);
      try {
        const token = await getAuthToken();
        const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');
        
        const response = await fetch(`${apiUrl}/icp/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('ICP status:', data);
          
          // Load existing criteria if available
          if (data.icp_criteria) {
            const criteria = data.icp_criteria;
            console.log('Loading ICP criteria from backend:', criteria);
            
            // Map backend values to frontend format
            const backendToFrontendEmployees = {
              '1-10': '1-10',
              '11-50': '11-50',
              '51-100': '51-200',
              '101-500': '201-500',
              '500+': '501-1000',
            };
            
            const backendToFrontendYears = {
              'Last 12 months': '0-2',
              '1-3 years': '3-5',
              'More than 3 years': '6-10',
            };
            
            if (criteria.employee_sizes && Array.isArray(criteria.employee_sizes)) {
              console.log('Backend employee_sizes:', criteria.employee_sizes);
              const mappedSizes = criteria.employee_sizes.map(size => backendToFrontendEmployees[size] || size);
              console.log('Mapped to frontend:', mappedSizes);
              setEmployeeRanges(mappedSizes);
              console.log('Set employeeRanges state to:', mappedSizes);
            }
            
            if (criteria.founded_years && Array.isArray(criteria.founded_years)) {
              console.log('Backend founded_years:', criteria.founded_years);
              const mappedYears = criteria.founded_years.map(year => backendToFrontendYears[year] || year);
              console.log('Mapped to frontend:', mappedYears);
              setYearsFounded(mappedYears);
              console.log('Set yearsFounded state to:', mappedYears);
            }
            
            if (typeof criteria.enabled !== 'undefined') {
              setIcpAnalysisEnabled(criteria.enabled);
              // Auto-expand criteria section if ICP is enabled
              setIcpCriteriaExpanded(criteria.enabled);
            }
          }
        }
      } catch (error) {
        console.error('Error loading ICP settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadICPSettings();
  }, []);

  // Save ICP settings to backend - but for onboarding, redirect to dashboard instead
  const handleSaveSettings = async () => {
    // For onboarding, just redirect to dashboard
    navigate('/dashboard');
  };

  const handleAddSettingsSubmit = async (formData) => {
    try {
      const response = await createSetting(formData);
      if (response.requiresLogin) {
        // The modal will handle showing the login form
        setSaveMessage('⚠️ Please login to the settings API in the modal');
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }
      if (!response.error) {
        setSaveMessage('✅ Slack webhook settings added successfully!');
        setIsSlackModalOpen(false);
        // Enable Slack delivery channel after successful setup
        setDeliveryChannels(prev => ({ ...prev, slack: true }));
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(`❌ ${response.message || 'Failed to add settings'}`);
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding settings:', error);
      setSaveMessage('❌ Failed to add settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Merlin!</h1>
          <p className="text-gray-600">
            Let's set up your preferences and configure your Ideal Customer Profile criteria
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Send my insights to + Custom Insights */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
            {/* Send my insights to */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <FiMail className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Send my insights to</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Select your preferred delivery channels (multiple allowed)</p>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setDeliveryChannels(prev => ({ ...prev, email: !prev.email }))}
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryChannels.email
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <FiMail className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                  <div className="text-sm font-medium text-gray-900">Email</div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSlackModalOpen(true)}
                  disabled
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryChannels.slack
                      ? 'border-gray-300 bg-gray-100'
                      : 'border-gray-200 bg-gray-50'
                  } opacity-50 cursor-not-allowed`}
                >
                  <FiMessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm font-medium text-gray-500">Slack</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCrmEmailMessage('Hi Merlin, I\'d like to learn more about CRM integration.');
                    setCrmEmailSent(false);
                    setShowCrmModal(true);
                  }}
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryChannels.crm
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <FiBriefcase className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                  <div className="text-sm font-medium text-gray-900">CRM Integration</div>
                </button>
              </div>
            </div>

            {/* Custom Insights */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiZap className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Custom Insights</h3>
                </div>
                <CreditsBadge 
                  text="1 credit/question"
                  icon={<FiCreditCard />}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">Select questions to answer for your meetings</p>

              <div className="mb-4">
                <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {getTotalSelectedCount()} selected
                </span>
              </div>

              <div className="space-y-6">
                {Object.entries(questionCategories).map(([key, category]) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-gray-900">{category.label}</h4>
                      <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        {category.count} questions
                      </span>
                    </div>
                    <div className="space-y-2">
                      {category.questions.map((question, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(selectedQuestions[key] || []).includes(question)}
                            onChange={() => toggleQuestion(key, question)}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">{question}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Custom Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Your Own Custom Question
                  </label>
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="e.g., What are the prospect's recent LinkedIn posts about?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: ICP Focus */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
            {/* ICP Focus Toggle */}
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <FiTarget className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">ICP Focus</h3>
                  <p className="text-sm text-gray-600">Include Ideal Customer Profile analysis in reports</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newState = !icpAnalysisEnabled;
                  setIcpAnalysisEnabled(newState);
                  setIcpCriteriaExpanded(newState);
                }}
                className={`relative w-12 h-6 rounded-full transition ${
                  icpAnalysisEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    icpAnalysisEnabled ? 'transform translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Collapsible ICP Criteria Section */}
            {icpAnalysisEnabled && (
              <div className="mt-4">
                <button
                  onClick={() => setIcpCriteriaExpanded(!icpCriteriaExpanded)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <FiTarget className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Define Your Ideal Customer Profile</span>
                  </div>
                  {icpCriteriaExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {icpCriteriaExpanded && (
                  <div className="mt-4 space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-4">Set criteria to identify which meetings align with your target customer profile</p>

                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiBriefcase className="w-4 h-4" />
                          Number of Employees (select all that apply)
                        </label>
                        <div className="space-y-2">
                          {['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+'].map(range => {
                            const isChecked = employeeRanges.includes(range);
                            return (
                              <label key={range} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEmployeeRanges([...employeeRanges, range]);
                                    } else {
                                      setEmployeeRanges(employeeRanges.filter(r => r !== range));
                                    }
                                  }}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">{range} employees</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiTarget className="w-4 h-4" />
                          Year Founded (select all that apply)
                        </label>
                        <div className="space-y-2">
                          {['0-2', '3-5', '6-10', '11-20', '20+'].map(years => (
                            <label key={years} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={yearsFounded.includes(years)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setYearsFounded([...yearsFounded, years]);
                                  } else {
                                    setYearsFounded(yearsFounded.filter(y => y !== years));
                                  }
                                }}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <span className="text-sm text-gray-700">Founded {years} years ago</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiZap className="w-4 h-4" />
                          Other (Optional)
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">Beta</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Additional criteria..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`p-3 rounded-lg ${saveMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {saveMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </div>

          {/* Add Settings Modal */}
          <AddSettingsModal
            isOpen={isSlackModalOpen}
            onClose={() => setIsSlackModalOpen(false)}
            onSubmit={handleAddSettingsSubmit}
            initialData={{
              vendor: 'slack',
              title: '',
              channel: '',
              hook_url: ''
            }}
          />
        </div>
      </main>

      {/* CRM Contact Modal */}
      {showCrmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowCrmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-6 h-6" />
            </button>

            {crmEmailSent ? (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">
                  We'll get back to you shortly about CRM integration.
                </p>
              </div>
            ) : (
              /* Email Form */
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSendingCrmEmail(true);
                try {
                  const formData = new FormData();
                  formData.append('name', user?.user_metadata?.full_name || user?.email || 'User');
                  formData.append('email', user?.email || '');
                  formData.append('message', crmEmailMessage);
                  formData.append('_subject', 'CRM Integration Inquiry');
                  formData.append('_captcha', 'false');

                  const response = await fetch('https://formsubmit.co/insights@usemerlin.io', {
                    method: 'POST',
                    body: formData,
                    headers: {
                      'Accept': 'application/json'
                    }
                  });

                  if (response.ok) {
                    setCrmEmailSent(true);
                    setTimeout(() => {
                      setShowCrmModal(false);
                    }, 2000);
                  } else {
                    throw new Error('Failed to send email');
                  }
                } catch (error) {
                  console.error('❌ Error sending email:', error);
                  alert('Failed to send email. Please try again.');
                } finally {
                  setIsSendingCrmEmail(false);
                }
              }}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Send us a message about <span className="font-semibold">CRM Integration</span>
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
                      value={crmEmailMessage}
                      onChange={(e) => setCrmEmailMessage(e.target.value)}
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
                      onClick={() => setShowCrmModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingCrmEmail || !crmEmailMessage.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingCrmEmail ? (
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

export default Onboarding;
