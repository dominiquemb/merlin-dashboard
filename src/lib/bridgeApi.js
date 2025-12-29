/**
 * Bridge API client for company and person uploads
 */

const BRIDGE_API_URL = process.env.REACT_APP_BRIDGE_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-bridge-api.onrender.com' : 'http://localhost:8080');

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

    const response = await fetch(`${BRIDGE_API_URL}/v1/company/upload`, {
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

    const formData = new FormData();
    formData.append('file_upload', file);
    
    // Create JSON payload
    const jsonPayload = {
      includes: includes,
      questions: questions
    };
    
    formData.append('json', JSON.stringify(jsonPayload));

    const response = await fetch(`${BRIDGE_API_URL}/v1/person/upload`, {
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
    console.error('Error uploading person CSV to bridge API:', error);
    throw error;
  }
};

