import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Integration API URL for API key management
// Remove trailing slash if present to avoid double slashes in URLs
const getIntegrationApiUrl = () => {
  const url = process.env.REACT_APP_INTEGRATION_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-core-api.onrender.com' : 'http://localhost:8000');
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};
const INTEGRATION_API_URL = getIntegrationApiUrl();

/**
 * Get auth token from Supabase session
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

/**
 * Generate a new API key
 * Uses POST /v1/key endpoint from merlin-integration API
 */
export const generateApiKey = async (name) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Integration API expects empty body for POST /v1/key
    const response = await fetch(`${INTEGRATION_API_URL}/v1/key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty body as per API spec
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate API key');
    }

    const result = await response.json();
    
    // Transform response to match expected format
    // Integration API returns: { error: false, message: "General.OK_REGISTER", data: { api_key: "...", is_active: true } }
    if (result.data && result.data.api_key) {
      return {
        api_key: result.data.api_key, // Full API key for display
        id: 'current',
        name: name || 'API Key', // Name is not stored in integration API, use provided name
      };
    }
    
    throw new Error('Invalid response format from API');
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
};

/**
 * Get current API key
 * Uses GET /v1/key endpoint from merlin-integration API
 */
export const listApiKeys = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(`${INTEGRATION_API_URL}/v1/key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404, return empty array (no key exists yet)
      if (response.status === 404) {
        return [];
      }
      
      // Try to parse error response
      let errorMessage = 'Failed to fetch API key';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        // Also check for "no rows" in message
        if (errorData.message?.includes('no rows')) {
          return [];
        }
      } catch (e) {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Transform response to match expected format
    // Integration API returns: { error: false, message: "General.OK_REGISTER", data: { user_id: "...", api_key: "...", is_active: true } }
    if (result.data && result.data.api_key) {
      const apiKey = result.data.api_key;
      const keyPrefix = apiKey.substring(0, 10) + '...';
      return [{
        id: 'current',
        name: 'API Key', // Integration API doesn't store names
        key_prefix: keyPrefix,
        key: keyPrefix, // For display purposes
        fullKey: apiKey, // Store full key for use
        is_active: result.data.is_active !== false,
        created_at: new Date().toISOString(), // Integration API doesn't return created_at
        last_used_at: null, // Integration API doesn't return last_used_at
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
};

/**
 * Toggle API key active status
 * Uses PATCH /v1/key/status endpoint from merlin-integration API
 */
export const toggleApiKey = async (keyId, isActive) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Integration API toggles the status, so we just call it
    const response = await fetch(`${INTEGRATION_API_URL}/v1/key/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to toggle API key status');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error toggling API key:', error);
    throw error;
  }
};

/**
 * Delete an API key
 * Uses DELETE /v1/key endpoint from merlin-integration API
 */
export const deleteApiKey = async (keyId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Delete the API key using DELETE /v1/key
    const response = await fetch(`${INTEGRATION_API_URL}/v1/key`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete API key');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
};

/**
 * Fetch usage logs
 * Uses GET /v1/stats/logs endpoint from merlin-integration API
 */
export const fetchLogs = async (page = 1, limit = 10) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${INTEGRATION_API_URL}/v1/stats/logs?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch logs');
    }

    const result = await response.json();

    // Transform response to match expected format
    // Integration API returns: { error: false, message: "General.OK_REGISTER", data: { info: [...], pages: N } }
    if (result.data) {
      return {
        logs: result.data.info || [],
        totalPages: result.data.pages || 0,
      };
    }

    return { logs: [], totalPages: 0 };
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};
