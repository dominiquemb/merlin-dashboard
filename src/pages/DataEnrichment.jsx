import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FiMail, FiDownload, FiUpload, FiFileText, FiCode, FiCreditCard, FiInfo, FiKey, FiCopy, FiTrash2, FiPlus, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getEnrichmentJobs, downloadEnrichedCsv } from '../lib/enrichmentApi';
import { generateApiKey, listApiKeys, toggleApiKey, deleteApiKey } from '../lib/apiKeysApi';
import { uploadPersonCsv } from '../lib/bridgeApi';
import { useAuth } from '../contexts/AuthContext';

const DataEnrichment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('csv');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [email, setEmail] = useState('');
  const [showGenerateKeyModal, setShowGenerateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentSuccess, setEnrichmentSuccess] = useState(null);
  const [enrichmentError, setEnrichmentError] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null); // Store newly generated key temporarily

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
  ];

  const toggleField = (fieldId) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleFileUpload = (e) => {
    e.preventDefault(); // Prevent any default form submission behavior
    e.stopPropagation(); // Stop event propagation
    
    const file = e.target.files?.[0];
    if (file) {
      // Only set the file in state - do NOT upload yet
      setUploadedFile(file);
      // Clear previous messages when new file is uploaded
      setEnrichmentSuccess(null);
      setEnrichmentError(null);
    }
  };

  const handleStartEnrichment = async () => {
    if (!uploadedFile || selectedFields.length === 0 || !email) {
      return;
    }

    setIsEnriching(true);
    setEnrichmentSuccess(null);
    setEnrichmentError(null);

    try {
      // Get the first active API key (bridge API requires X-API-Key header)
      const activeApiKey = apiKeys.find(key => key.isActive);
      if (!activeApiKey) {
        setEnrichmentError('No active API key found. Please go to the "API Integration" tab to generate an API key first.');
        setIsEnriching(false);
        setTimeout(() => setEnrichmentError(null), 10000); // Show for 10 seconds so user can read it
        return;
      }

      // Use the full key if available, otherwise use the key prefix
      const apiKey = activeApiKey.fullKey || activeApiKey.key;
      
      // Log which API key is being used (masked for security)
      const maskedKey = apiKey.length > 10 ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : '***';
      console.log('🔑 Selected API key:', maskedKey);
      console.log('📋 API key details:', {
        id: activeApiKey.id,
        name: activeApiKey.name,
        isActive: activeApiKey.isActive,
        keyPrefix: maskedKey
      });

      // Get auth token for fetching preferences
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setEnrichmentError('No authentication token found. Please log in again.');
        setIsEnriching(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

      // Fetch custom questions from ICP settings
      let customQuestions = [];
      try {
        const questionsResponse = await fetch(`${apiUrl}/preferences/questions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          if (questionsData.success && questionsData.questions && questionsData.questions.length > 0) {
            // Transform to bridge API format: array of {category, question}
            customQuestions = questionsData.questions.map(q => ({
              category: q.category || 'other',
              question: q.question
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching custom questions:', error);
        // Continue without questions if fetch fails
      }

      // Map selected fields to bridge API PersonalIncludes format
      const includes = {};
      
      // Map person fields to PersonalIncludes
      if (selectedFields.includes('person_name') || selectedFields.includes('email_address')) {
        includes.summary = true;
      }
      if (selectedFields.includes('skills')) {
        includes.skills = true;
      }
      if (selectedFields.includes('employment_history') || selectedFields.includes('job_title')) {
        includes.experience = true;
        includes.positions = true;
      }
      if (selectedFields.includes('education')) {
        includes.education = true;
      }
      if (selectedFields.includes('current_company') || selectedFields.includes('company_name')) {
        includes.company_info = true;
      }
      if (selectedFields.includes('linkedin_url')) {
        includes.profile_avatar = true;
      }

      // Call bridge API person upload endpoint with custom questions
      const result = await uploadPersonCsv(
        uploadedFile,
        includes,
        customQuestions, // Include custom questions from ICP settings
        apiKey
      );

      setEnrichmentSuccess('Successfully uploaded person CSV file. Processing will begin shortly.');

      // Send notification to insights@usemerlin.io via formsubmit.co
      try {
        const formData = new FormData();
        formData.append('name', user?.user_metadata?.full_name || user?.email || 'User');
        formData.append('email', user?.email || '');
        formData.append('message', `CSV Upload for Data Enrichment:\n\n` +
          `- File: ${uploadedFile.name}\n` +
          `- Records: ${result.total_records}\n` +
          `- Fields: ${selectedFields.join(', ')}\n` +
          `- Delivery Email: ${email}\n` +
          `- Job ID: ${result.job_id}\n` +
          `- Credits Charged: ${result.credits_required}`);
        formData.append('_subject', `Data Enrichment: CSV Upload - ${uploadedFile.name}`);
        formData.append('_captcha', 'false');

        const response = await fetch('https://formsubmit.co/insights@usemerlin.io', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          console.log('✅ Notification sent to insights@usemerlin.io');
        }
      } catch (error) {
        // Don't fail the enrichment if notification fails
        console.error('Error sending notification:', error);
      }

      // Reset form
      setUploadedFile(null);

      // Refresh recent jobs
      fetchRecentJobs();

      // Clear success message after 10 seconds
      setTimeout(() => {
        setEnrichmentSuccess(null);
      }, 10000);
    } catch (error) {
      setEnrichmentError(error.message || 'Failed to start enrichment');

      // Clear error message after 10 seconds
      setTimeout(() => {
        setEnrichmentError(null);
      }, 10000);
    } finally {
      setIsEnriching(false);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const jobs = await getEnrichmentJobs(10);
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error);
    }
  };

  useEffect(() => {
    // Load recent jobs when CSV tab is active
    if (activeTab === 'csv') {
      fetchRecentJobs();
      // Also load API keys for the upload form
      fetchApiKeys();
    }
    // Load API keys when API tab is active
    if (activeTab === 'api') {
      fetchApiKeys();
    }
  }, [activeTab]);

  // Auto-refresh jobs every 30 seconds if there are active jobs
  useEffect(() => {
    if (activeTab !== 'csv') return;

    const hasActiveJobs = recentJobs.some(job => ['pending', 'processing'].includes(job.status));

    if (!hasActiveJobs) return;

    const intervalId = setInterval(() => {
      fetchRecentJobs();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [activeTab, recentJobs]);

  const fetchApiKeys = async () => {
    setIsLoadingApiKeys(true);
    try {
      const keys = await listApiKeys();
      // Transform backend format to frontend format
      const transformedKeys = keys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key_prefix || key.key, // Use prefix for display
        fullKey: key.fullKey || key.key, // Store full key for API calls
        created: key.created_at ? new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
        lastUsed: key.last_used_at ? formatTimeAgo(new Date(key.last_used_at)) : 'Never',
        isActive: key.is_active,
      }));
      setApiKeys(transformedKeys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const handleGenerateKey = () => {
    setShowGenerateKeyModal(true);
    setNewApiKey(null); // Clear any previous new key
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const result = await generateApiKey(newKeyName);

      // Store the full API key to show it
      // Full keys are now stored encrypted in the database, so we don't need localStorage
      setNewApiKey(result.api_key);

      // Refresh the API keys list
      await fetchApiKeys();

      setNewKeyName('');
      // Don't close modal yet - show the new key first
    } catch (error) {
      console.error('Failed to generate API key:', error);
      alert('Failed to generate API key: ' + error.message);
    }
  };

  const handleCancelGenerateKey = () => {
    setShowGenerateKeyModal(false);
    setNewKeyName('');
    setNewApiKey(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show a brief success message (you could use a toast library here)
    alert('API key copied to clipboard!');
  };

  const toggleKeyStatus = async (id) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;

    try {
      await toggleApiKey(id, !key.isActive);
      // Update local state optimistically
      setApiKeys(apiKeys.map(k =>
        k.id === id ? { ...k, isActive: !k.isActive } : k
      ));
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      alert('Failed to toggle API key: ' + error.message);
    }
  };

  const deleteKey = async (id) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApiKey(id);
      setApiKeys(apiKeys.filter(key => key.id !== id));
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key: ' + error.message);
    }
  };

  const handleDownloadCsv = async (jobId, filename) => {
    try {
      const enrichedFilename = filename.replace('.csv', '_enriched.csv');
      await downloadEnrichedCsv(jobId, enrichedFilename);
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert('Failed to download CSV: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Data Enrichment</h1>
            <div className="flex items-center gap-2 text-sm text-primary bg-accent-light border border-accent rounded-lg px-3 py-1.5">
              <FiCreditCard className="w-4 h-4" />
              <span className="font-medium">3 credits per contact enriched (up to 5 new fields)</span>
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
            {/* Success Message */}
            {enrichmentSuccess && (
              <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl flex items-start gap-3 shadow-sm">
                <FiCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-900 font-semibold text-lg">{enrichmentSuccess}</p>
                  <p className="text-sm text-green-700 mt-2">
                    ✓ Job created successfully<br />
                    ✓ Credits deducted<br />
                    ✓ Your enriched CSV will be emailed to you once processing is complete
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {enrichmentError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Failed to start enrichment</p>
                  <p className="text-sm text-red-700 mt-1">{enrichmentError}</p>
                </div>
              </div>
            )}

            {/* Upload CSV Section */}
            <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-accent-light rounded-lg flex items-center justify-center flex-shrink-0">
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary hover:bg-accent-light transition cursor-pointer">
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
              <div className="mt-4 p-4 bg-accent-light border border-accent rounded-lg">
                <div className="flex items-start gap-2">
                  <FiInfo className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm text-gray-900">
                    <span className="font-semibold">CSV format:</span>
                    <br />
                    All columns are optional. Supported columns (in order from left to right):{' '}
                    <span className="font-semibold text-primary">record_id</span> (user-provided, can be any value you wish),{' '}
                    <span className="font-semibold text-primary">first_name</span>,{' '}
                    <span className="font-semibold text-primary">last_name</span>,{' '}
                    <span className="font-semibold text-primary">email</span>,{' '}
                    <span className="font-semibold text-primary">social_url</span>
                    <br />
                    <span className="text-gray-700 mt-2 block">
                      The script processes columns from right to left, starting with the rightmost column.
                    </span>
                    <div className="mt-3">
                      <a
                        href="/example_person_upload.csv"
                        download="example_person_upload.csv"
                        className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium underline"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download example CSV file
                      </a>
                    </div>
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
                <span className="bg-accent-light0 text-white text-sm px-3 py-1 rounded-full font-medium">
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
                          ? 'bg-accent-light border-2 border-primary'
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
                          ? 'bg-accent-light border-2 border-primary'
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
                
                {/* Contact Us for Other Insights */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2">
                        <span className="font-semibold">Need other types of insights?</span>
                      </p>
                      <button
                        onClick={() => {
                          const formData = new FormData();
                          formData.append('name', user?.user_metadata?.full_name || user?.email || 'User');
                          formData.append('email', user?.email || '');
                          formData.append('message', 'Hi Merlin, I\'d like to learn about other types of data enrichment insights available.');
                          formData.append('_subject', 'Data Enrichment: Other Insights Inquiry');
                          formData.append('_captcha', 'false');
                          
                          fetch('https://formsubmit.co/insights@usemerlin.io', {
                            method: 'POST',
                            body: formData,
                            headers: { 'Accept': 'application/json' }
                          }).then(() => {
                            alert('Message sent! We\'ll get back to you shortly.');
                          }).catch(() => {
                            alert('Failed to send message. Please try again.');
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Contact us to learn more
                      </button>
                    </div>
                  </div>
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
                disabled={!uploadedFile || selectedFields.length === 0 || !email || isEnriching}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnriching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-5 h-5" />
                    Start Enrichment
                  </>
                )}
              </button>
            </div>

            {/* Recent Jobs */}
            {recentJobs.length > 0 && (
              <div className="mt-8 bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Enrichment Jobs</h2>
                    {recentJobs.filter(job => ['pending', 'processing'].includes(job.status)).length > 0 && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                        Auto-refreshing
                      </span>
                    )}
                  </div>
                  <button
                    onClick={fetchRecentJobs}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    <FiDownload className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className={`flex items-center justify-between p-4 bg-white border-2 rounded-lg transition ${
                        ['pending', 'processing'].includes(job.status)
                          ? 'border-blue-300 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900">{job.original_filename}</span>
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : job.status === 'processing'
                                ? 'bg-blue-100 text-blue-700'
                                : job.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {['pending', 'processing'].includes(job.status) && (
                              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                            )}
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {job.total_records} records • {job.credits_charged} credits • {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        {['pending', 'processing'].includes(job.status) && (
                          <div className="mt-2 text-xs text-blue-600 font-medium">
                            ⏱ Processing... your CSV will be emailed to {job.delivery_email} when complete
                          </div>
                        )}
                        {job.status === 'completed' && (
                          <div className="mt-2 text-xs text-green-600 font-medium">
                            ✓ Completed! Your CSV will be emailed to {job.delivery_email} soon
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {job.status === 'completed' && job.processed_records > 0 && (
                          <>
                            <div className="text-sm font-medium text-green-600">
                              ✓ {job.successful_records}/{job.total_records} successful
                            </div>
                            <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
                              <FiMail className="w-4 h-4" />
                              CSV will be emailed to {job.delivery_email}
                            </div>
                            {/* Download button temporarily disabled - CSV will be emailed instead
                            <button
                              onClick={() => handleDownloadCsv(job.id, job.original_filename)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                            >
                              <FiDownload className="w-4 h-4" />
                              Download CSV
                            </button>
                            */}
                          </>
                        )}
                        {job.status === 'failed' && (
                          <div className="text-sm font-medium text-red-600">
                            ✗ Failed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                          <code className="text-sm font-mono text-gray-700">
                            {apiKey.key}
                          </code>
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

              {/* Create Enrichment Request */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">1. Create Enrichment Request</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm mb-3">
                  <span className="text-green-600 font-semibold">POST</span>{' '}
                  <span className="text-gray-900">https://api.merlin.ai/v1/enrich</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Headers</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-1">
                    <div>
                      <span className="text-accent">Authorization:</span> Bearer YOUR_API_KEY
                    </div>
                    <div>
                      <span className="text-accent">Content-Type:</span> application/json
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Request Body</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700">
                    <pre className="whitespace-pre">{`{
  "email": "john.doe@company.com",
  "fields": ["person_name", "job_title", "company_name"]
}`}</pre>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Response</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700">
                    <pre className="whitespace-pre">{`{
  "status": "pending",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Enrichment request queued successfully. Processing will begin via scheduled flows.",
  "credits_charged": 1
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Retrieve Results - Commented out: users will be emailed the CSV */}
              {/* <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">2. Retrieve Enrichment Results</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm mb-3">
                  <span className="text-blue-600 font-semibold">GET</span>{' '}
                  <span className="text-gray-900">https://api.merlin.ai/v1/enrich/{'{'}request_id{'}'}</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Headers</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700">
                    <div>
                      <span className="text-accent">Authorization:</span> Bearer YOUR_API_KEY
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Response (Pending)</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700">
                    <pre className="whitespace-pre">{`{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "input_email": "john.doe@company.com",
  "requested_fields": ["person_name", "job_title", "company_name"],
  "credits_charged": 1,
  "created_at": "2025-11-13T10:00:00Z",
  "updated_at": "2025-11-13T10:00:00Z"
}`}</pre>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Response (Completed)</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700">
                    <pre className="whitespace-pre">{`{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "input_email": "john.doe@company.com",
  "requested_fields": ["person_name", "job_title", "company_name"],
  "credits_charged": 1,
  "created_at": "2025-11-13T10:00:00Z",
  "updated_at": "2025-11-13T10:15:00Z",
  "data": {
    "person_name": "John Doe",
    "job_title": "Senior Software Engineer",
    "company_name": "Acme Corp"
  }
}`}</pre>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">Note:</span> Enrichment is processed asynchronously.
                    Poll this endpoint every 30-60 seconds until status is "completed" or "failed".
                    Processing typically takes 5-15 minutes.
                  </p>
                </div>
              </div> */}

              {/* Results Delivery */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">2. Receiving Results</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800">
                    <span className="font-semibold">📧 Results Delivery:</span> Once your enrichment request is processed,
                    you'll receive an email with the enriched CSV file attached.
                  </p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {newApiKey ? 'API Key Generated!' : 'Generate New API Key'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {newApiKey
                ? 'Make sure to copy your API key now. You won\'t be able to see it again!'
                : 'Create a new API key for programmatic access to Merlin\'s data enrichment'
              }
            </p>

            {/* Show newly created key */}
            {newApiKey ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Your API Key
                </label>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                    {newApiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newApiKey)}
                    className="flex-shrink-0 p-2 text-gray-700 hover:text-gray-900 hover:bg-yellow-100 rounded transition"
                    title="Copy to clipboard"
                  >
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ This is the only time you'll see this key. Store it securely!
                </p>
              </div>
            ) : (
              /* Form */
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
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelGenerateKey}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
              >
                {newApiKey ? 'Done' : 'Cancel'}
              </button>
              {!newApiKey && (
                <button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim()}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Key
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEnrichment;
