import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMail, FiMessageSquare, FiBriefcase, FiTarget, FiZap, FiCreditCard } from 'react-icons/fi';
import CreditsBadge from './CreditsBadge';

const ICPSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [icpAnalysisEnabled, setIcpAnalysisEnabled] = useState(true);
  const [deliveryChannels, setDeliveryChannels] = useState({
    email: true,
    slack: false,
    crm: false,
  });
  const [employeeRange, setEmployeeRange] = useState('');
  const [yearFounded, setYearFounded] = useState('');
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

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <FiTarget className="w-5 h-5 text-primary" />
          <span className="font-semibold text-gray-900">Settings</span>
        </div>
        {isOpen ? <FiChevronUp className="w-5 h-5 text-gray-500" /> : <FiChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {isOpen && (
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-6 space-y-8">
          {/* Send my insights to */}
          <div>
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

          {/* ICP Analysis Toggle */}
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiTarget className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">ICP Analysis</h3>
                <p className="text-sm text-gray-600">Include Ideal Customer Profile analysis in reports</p>
              </div>
            </div>
            <button
              onClick={() => setIcpAnalysisEnabled(!icpAnalysisEnabled)}
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

          {/* Define Your Ideal Customer Profile */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Define Your Ideal Customer Profile</h3>
            <p className="text-sm text-gray-600 mb-4">Set criteria to identify which meetings align with your target customer profile</p>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FiBriefcase className="w-4 h-4" />
                  Number of Employees
                </label>
                <select
                  value={employeeRange}
                  onChange={(e) => setEmployeeRange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Select employee range</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001-5000">1001-5000 employees</option>
                  <option value="5001+">5001+ employees</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FiTarget className="w-4 h-4" />
                  Year Founded
                </label>
                <select
                  value={yearFounded}
                  onChange={(e) => setYearFounded(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Select company age</option>
                  <option value="0-2">Founded 0-2 years ago</option>
                  <option value="3-5">Founded 3-5 years ago</option>
                  <option value="6-10">Founded 6-10 years ago</option>
                  <option value="11-20">Founded 11-20 years ago</option>
                  <option value="20+">Founded 20+ years ago</option>
                </select>
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Save logic here
                setIsOpen(false);
              }}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICPSettings;
