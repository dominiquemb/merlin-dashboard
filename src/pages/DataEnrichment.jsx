import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FiMail, FiDownload, FiUpload, FiFileText, FiCode, FiCreditCard, FiInfo, FiKey, FiEye, FiEyeOff, FiCopy, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const DataEnrichment = () => {
  const [activeTab, setActiveTab] = useState('csv');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [email, setEmail] = useState('');
  const [showGenerateKeyModal, setShowGenerateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: 'Production API Key',
      key: 'mk_live_12••••••••••••••••••wxyz',
      fullKey: 'mk_live_12a3b4c5d6e7f8g9h0i1j2wxyz',
      created: 'Oct 15, 2025',
      lastUsed: '2 hours ago',
      isActive: true,
      isVisible: false,
    },
  ]);

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

  const handleGenerateKey = () => {
    setShowGenerateKeyModal(true);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;

    const fullKey = `mk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const maskedKey = `${fullKey.substring(0, 10)}••••••••••••••••••${fullKey.substring(fullKey.length - 4)}`;

    const newKey = {
      id: apiKeys.length + 1,
      name: newKeyName,
      key: maskedKey,
      fullKey: fullKey,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      isActive: true,
      isVisible: false,
    };
    setApiKeys([...apiKeys, newKey]);
    setShowGenerateKeyModal(false);
    setNewKeyName('');
  };

  const handleCancelGenerateKey = () => {
    setShowGenerateKeyModal(false);
    setNewKeyName('');
  };

  const toggleKeyVisibility = (id) => {
    setApiKeys(apiKeys.map(key =>
      key.id === id ? { ...key, isVisible: !key.isVisible } : key
    ));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const toggleKeyStatus = (id) => {
    setApiKeys(apiKeys.map(key =>
      key.id === id ? { ...key, isActive: !key.isActive } : key
    ));
  };

  const deleteKey = (id) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
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
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
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
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiInfo className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <span className="font-semibold">Required CSV format:</span>
                    <br />
                    Your CSV must contain either an <span className="font-semibold text-primary">email</span> column or a{' '}
                    <span className="font-semibold text-primary">linkedin_url</span> column (or both)
                  </div>
                </div>
              </div>
            </div>

            {/* Select Output Fields */}
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
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
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
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
          <>
            {/* API Keys Section */}
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiKey className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                    <p className="text-sm text-gray-600">
                      Manage your API keys for programmatic access
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateKey}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  <FiPlus className="w-4 h-4" />
                  Generate New Key
                </button>
              </div>

              {/* API Keys Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Key</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Used</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((apiKey) => (
                      <tr key={apiKey.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-900">{apiKey.name}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-gray-700">
                              {apiKey.isVisible ? apiKey.fullKey : apiKey.key}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                              className="text-gray-400 hover:text-gray-600 transition"
                              title={apiKey.isVisible ? 'Hide key' : 'Show key'}
                            >
                              {apiKey.isVisible ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(apiKey.fullKey)}
                              className="text-gray-400 hover:text-gray-600 transition"
                              title="Copy to clipboard"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{apiKey.created}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{apiKey.lastUsed}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleKeyStatus(apiKey.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              apiKey.isActive ? 'bg-gray-900' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                apiKey.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => deleteKey(apiKey.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete key"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API Documentation Section */}
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiCode className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">API Documentation</h2>
                  <p className="text-sm text-gray-600">
                    Use the Merlin API to enrich data programmatically
                  </p>
                </div>
              </div>

              {/* Endpoint */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Endpoint</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  <span className="text-green-600 font-semibold">POST</span>{' '}
                  <span className="text-gray-900">https://api.merlin.ai/v1/enrich</span>
                </div>
              </div>

              {/* Headers */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Headers</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-yellow-600">Authorization:</span> Bearer YOUR_API_KEY
                  </div>
                  <div>
                    <span className="text-yellow-600">Content-Type:</span> application/json
                  </div>
                </div>
              </div>

              {/* Request Body */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Request Body</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                  <pre className="whitespace-pre">{`{
  "email": "john@company.com",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "fields": ["person_name", "company_name", "company_industry"]
}`}</pre>
                </div>
              </div>

              {/* Response */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Response</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                  <pre className="whitespace-pre">{`{
  "status": "success",
  "data": {
    "person_name": "John Doe",
    "company_name": "Acme Corp",
    "company_industry": "Technology"
  }
}`}</pre>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Generate API Key Modal */}
      {showGenerateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={handleCancelGenerateKey}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generate New API Key</h2>
            <p className="text-sm text-gray-600 mb-6">
              Create a new API key for programmatic access to Merlin's data enrichment
            </p>

            {/* Form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateKey();
                  }
                }}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelGenerateKey}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEnrichment;
