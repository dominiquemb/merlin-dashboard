import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiMail, FiMessageSquare, FiBriefcase, FiTarget, FiZap, FiCreditCard } from 'react-icons/fi';
import CreditsBadge from './CreditsBadge';

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

const ICPSettings = () => {
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

  //Save ICP settings to backend
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

      // Map frontend values to backend format
      const employeeSizesMap = {
        '1-10': '1-10',
        '11-50': '11-50',
        '51-200': '51-100',  // Backend uses 51-100 and 101-500
        '201-500': '101-500',
        '501-1000': '500+',
        '1001-5000': '500+',
        '5001+': '500+',
      };

      const yearsFoundedMap = {
        '0-2': 'Last 12 months',
        '3-5': '1-3 years',
        '6-10': 'More than 3 years',
        '11-20': 'More than 3 years',
        '20+': 'More than 3 years',
      };

      const requestBody = {
        enabled: icpAnalysisEnabled,
        employee_sizes: employeeRanges.map(range => employeeSizesMap[range] || range),
        founded_years: yearsFounded.map(year => yearsFoundedMap[year] || year),
      };

      console.log('Saving ICP criteria:', requestBody);

      const response = await fetch(`${apiUrl}/icp/criteria`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveMessage('✅ Settings saved successfully!');
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage(`❌ ${result.message || 'Failed to save settings'}`);
      }
      
    } catch (error) {
      console.error('Error saving ICP settings:', error);
      setSaveMessage('❌ Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

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
              onClick={() => setDeliveryChannels(prev => ({ ...prev, slack: !prev.slack }))}
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
              onClick={() => setDeliveryChannels(prev => ({ ...prev, crm: !prev.crm }))}
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
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ICPSettings;
