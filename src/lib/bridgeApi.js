/**
 * Bridge API client for company and person uploads
 */

// Integration API URL for uploads (same as API key management)
// Remove trailing slash if present to avoid double slashes in URLs
const getIntegrationApiUrl = () => {
  const url = process.env.REACT_APP_INTEGRATION_API_URL || (process.env.NODE_ENV === 'production' ? 'https://int.dev.usemerlin.io' : 'http://localhost:8000');
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};
const INTEGRATION_API_URL = getIntegrationApiUrl();

/**
 * Upload CSV file to bridge API for company enrichment
 */
export const uploadCompanyCsv = async (file, includes = {}, questions = [], apiKey) => {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const formData = new FormData();
    formData.append('file_upload', file);
    
    // Create JSON payload
    const jsonPayload = {
      includes: includes,
      questions: questions
    };
    
    formData.append('json', JSON.stringify(jsonPayload));

    const response = await fetch(`${INTEGRATION_API_URL}/upload/company`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload company CSV');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading company CSV to bridge API:', error);
    throw error;
  }
};

/**
 * Upload CSV file to bridge API for person enrichment
 */
export const uploadPersonCsv = async (file, includes = {}, questions = [], apiKey) => {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Log API key being used (masked for security)
    const maskedKey = apiKey.length > 10 ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : '***';
    console.log('🔑 Using API key for integration API:', maskedKey);
    console.log('📤 Uploading to:', `${INTEGRATION_API_URL}/upload/person`);

    const formData = new FormData();
    formData.append('file_upload', file);

    // Create JSON payload
    const jsonPayload = {
      includes: includes,
      questions: questions
    };

    formData.append('json', JSON.stringify(jsonPayload));

    const response = await fetch(`${INTEGRATION_API_URL}/upload/person`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload person CSV');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading person CSV to integration API:', error);
    throw error;
  }
};

