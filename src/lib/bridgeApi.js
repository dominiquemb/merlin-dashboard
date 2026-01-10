/**
 * Bridge API client for company and person uploads
 */

// Integration API URL for uploads (same as API key management)
// Remove trailing slash if present to avoid double slashes in URLs
const getIntegrationApiUrl = () => {
  const url = process.env.REACT_APP_INTEGRATION_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-core-api.onrender.com' : 'http://localhost:8000');
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
export const uploadPersonCsv = async (file, includes = {}, questions = [], token) => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    // Log API key being used (masked for security)
    const maskedToken = token.length > 10 ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}` : '***';
    console.log('🔑 Using Supabase token for integration API:', maskedToken);
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
        'Authorization': `Bearer ${token}`,
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

