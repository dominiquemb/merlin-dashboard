import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FiMail, FiDownload, FiUpload, FiFileText, FiCode, FiCreditCard, FiInfo } from 'react-icons/fi';

const DataEnrichment = () => {
  const [activeTab, setActiveTab] = useState('csv');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [email, setEmail] = useState('');

  // Pre-select some fields
  const [selectedFields, setSelectedFields] = useState([
    'person_name',
    'email_address',
    'job_title',
    'company_name',
    'industry',
    'num_employees',
  ]);

  const personDataFields = [
    { id: 'person_name', label: 'Person Name', description: 'Full name of the person' },
    { id: 'email_address', label: 'Email Address', description: 'Professional email address' },
    { id: 'phone_number', label: 'Phone Number', description: 'Contact phone number' },
    { id: 'linkedin_url', label: 'LinkedIn URL', description: 'LinkedIn profile URL' },
    { id: 'job_title', label: 'Job Title', description: 'Current job title' },
    { id: 'seniority_level', label: 'Seniority Level', description: 'Role seniority (e.g., Senior, Manager, Director)' },
    { id: 'education', label: 'Education', description: 'Educational background and degrees' },
    { id: 'skills', label: 'Skills', description: 'Professional skills and expertise' },
    { id: 'employment_history', label: 'Employment History', description: 'Previous work experience' },
    { id: 'current_company', label: 'Current Company', description: 'Current employer' },
  ];

  const companyDataFields = [
    { id: 'company_name', label: 'Company Name', description: 'Legal company name' },
    { id: 'company_website', label: 'Company Website', description: 'Primary website URL' },
    { id: 'industry', label: 'Industry', description: 'Primary industry/sector' },
    { id: 'num_employees', label: 'Number of Employees', description: 'Total employee count' },
    { id: 'revenue', label: 'Revenue', description: 'Annual revenue estimate' },
    { id: 'location', label: 'Location', description: 'Headquarters location' },
    { id: 'founded_year', label: 'Founded Year', description: 'Year company was founded' },
    { id: 'description', label: 'Description', description: 'Company overview' },
    { id: 'tech_stack', label: 'Tech Stack', description: 'Technologies used' },
    { id: 'funding', label: 'Funding', description: 'Funding stage and amount' },
  ];

  const toggleField = (fieldId) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleStartEnrichment = () => {
    console.log('Starting enrichment with fields:', selectedFields);
    console.log('Email:', email);
    console.log('File:', uploadedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Data Enrichment</h1>
            <div className="flex items-center gap-2 text-sm text-primary bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
              <FiCreditCard className="w-4 h-4" />
              <span className="font-medium">1 credit/record</span>
            </div>
          </div>
          <p className="text-gray-600">
            Enrich your contact data with comprehensive person and company information
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'csv'
                ? 'bg-white border-2 border-gray-900 text-gray-900'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <FiUpload className="w-4 h-4" />
            CSV Upload
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'api'
                ? 'bg-white border-2 border-gray-900 text-gray-900'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <FiCode className="w-4 h-4" />
            API Integration
          </button>
        </div>

        {activeTab === 'csv' && (
          <>
            {/* Upload CSV Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiFileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upload CSV File</h2>
                  <p className="text-sm text-gray-600">
                    Upload a CSV file containing email addresses or LinkedIn URLs
                  </p>
                </div>
              </div>

              {/* File Upload Area */}
              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary hover:bg-blue-50 transition cursor-pointer">
                  <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-1">
                    {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">
                    CSV file with email addresses or LinkedIn URLs
                  </p>
                </div>
              </label>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold">Required CSV format:</span>
                    <br />
                    Your CSV must contain either an <span className="font-semibold text-primary">email</span> column or a{' '}
                    <span className="font-semibold text-primary">linkedin_url</span> column (or both)
                  </div>
                </div>
              </div>
            </div>

            {/* Select Output Fields */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Select Output Fields</h2>
                  <p className="text-sm text-gray-600">Choose which data points you want to enrich</p>
                </div>
                <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {selectedFields.length} fields selected
                </span>
              </div>

              {/* Person Data */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Person Data</h3>
                <div className="grid grid-cols-2 gap-3">
                  {personDataFields.map((field) => (
                    <label
                      key={field.id}
                      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition ${
                        selectedFields.includes(field.id)
                          ? 'bg-blue-50 border-2 border-primary'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleField(field.id)}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{field.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company Data */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Company Data</h3>
                <div className="grid grid-cols-2 gap-3">
                  {companyDataFields.map((field) => (
                    <label
                      key={field.id}
                      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition ${
                        selectedFields.includes(field.id)
                          ? 'bg-blue-50 border-2 border-primary'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleField(field.id)}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{field.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delivery Method</h2>
                  <p className="text-sm text-gray-600">
                    Enriched data will be sent to your email as a CSV file
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.smith@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Start Enrichment Button */}
            <div className="flex justify-end">
              <button
                onClick={handleStartEnrichment}
                disabled={!uploadedFile || selectedFields.length === 0 || !email}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="w-5 h-5" />
                Start Enrichment
              </button>
            </div>
          </>
        )}

        {activeTab === 'api' && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <FiCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">API Integration</h3>
            <p className="text-gray-600 mb-4">Connect via API for automated data enrichment</p>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
              View API Documentation
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DataEnrichment;
