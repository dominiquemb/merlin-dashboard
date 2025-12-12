import React, { useState, useEffect } from 'react';
import {
  FiMail,
  FiMessageSquare,
  FiBriefcase,
  FiZap,
  FiCreditCard,
  FiX,
  FiSend,
} from 'react-icons/fi';
import CreditsBadge from './CreditsBadge';
import AddSettingsModal from './AddSettingsModal';
import { createSetting, exchangeOAuthCode } from '../lib/settingsApi';
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

const SettingsContent = ({ 
  saveButtonText = 'Save Changes',
  onSaveComplete,
  isLoading: externalIsLoading = false
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [deliveryChannels, setDeliveryChannels] = useState({
    email: true,
    slack: false,
    crm: false,
  });
  const [customQuestion, setCustomQuestion] = useState('');
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmEmailMessage, setCrmEmailMessage] = useState('');
  const [isSendingCrmEmail, setIsSendingCrmEmail] = useState(false);
  const [crmEmailSent, setCrmEmailSent] = useState(false);

  // Custom insights questions organized by category
  const [selectedQuestions, setSelectedQuestions] = useState({
    brand: [],
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

  // Handle OAuth return when component mounts
  useEffect(() => {
    const handleOAuthReturn = async () => {
      console.log('SettingsContent mounted, checking for OAuth return...');
      console.log('Current URL:', window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const oauthInProgress = localStorage.getItem('settings_oauth_in_progress');
      
      if (!code || !oauthInProgress) {
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

  // Load custom insights questions from backend
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const token = await getAuthToken();
        const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');
        
        const questionsResponse = await fetch(`${apiUrl}/preferences/questions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          console.log('Questions data:', questionsData);
          
          if (questionsData.success && questionsData.questions && questionsData.questions.length > 0) {
            // Convert backend format (array of {question, category}) to frontend format (object by category)
            const questionsByCategory = {};
            questionsData.questions.forEach(q => {
              const category = q.category || 'other';
              if (!questionsByCategory[category]) {
                questionsByCategory[category] = [];
              }
              questionsByCategory[category].push(q.question);
            });
            
            // Merge with existing structure, preserving all categories
            setSelectedQuestions(prev => ({
              ...prev,
              ...questionsByCategory
            }));
            console.log('Loaded questions:', questionsByCategory);
          }
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  // Save custom insights questions to backend
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      // Convert frontend format (object by category) to backend format (array of {question, category})
      const questionsArray = [];
      Object.entries(selectedQuestions).forEach(([category, questions]) => {
        questions.forEach(question => {
          questionsArray.push({
            question: question,
            category: category
          });
        });
      });
      
      // Add custom question if provided
      if (customQuestion && customQuestion.trim()) {
        questionsArray.push({
          question: customQuestion.trim(),
          category: 'other'
        });
      }

      console.log('Saving questions:', questionsArray);

      // Save custom insights questions
      const questionsResponse = await fetch(`${apiUrl}/preferences/questions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: questionsArray }),
      });

      const questionsResult = await questionsResponse.json();
      
      if (questionsResult.success) {
        setSaveMessage('✅ Settings saved successfully!');
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
        
        // Call onSaveComplete callback if provided
        if (onSaveComplete) {
          onSaveComplete();
        }
      } else {
        setSaveMessage(`❌ ${questionsResult.detail || 'Failed to save settings'}`);
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('❌ Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSettingsSubmit = async (formData) => {
    try {
      const response = await createSetting(formData);
      if (response.requiresLogin) {
        setSaveMessage('⚠️ Please login to the settings API in the modal');
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }
      if (!response.error) {
        setSaveMessage('✅ Slack webhook settings added successfully!');
        setIsSlackModalOpen(false);
        setDeliveryChannels(prev => ({ ...prev, slack: true }));
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(`❌ ${response.message || 'Failed to add settings'}`);
      }
      
    } catch (error) {
      console.error('Error adding settings:', error);
      setSaveMessage('❌ Failed to add settings');
    }
  };

  const handleToggleDeliveryChannel = (channel) => {
    setDeliveryChannels(prev => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  if (externalIsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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
              onClick={() => handleToggleDeliveryChannel('email')}
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
              className={`p-4 rounded-lg border-2 transition ${
                deliveryChannels.slack
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <FiMessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Slack</div>
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
          {isSaving ? 'Saving...' : saveButtonText}
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
                      setCrmEmailMessage('');
                    }, 2000);
                  } else {
                    throw new Error('Failed to send email');
                  }
                } catch (error) {
                  console.error('❌ Error sending CRM inquiry email:', error);
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={crmEmailMessage}
                      onChange={(e) => setCrmEmailMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Tell us about your CRM integration needs..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingCrmEmail}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSendingCrmEmail ? (
                      'Sending...'
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsContent;

