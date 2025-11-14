import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Get auth token from Supabase session
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

/**
 * Generate a new API key
 */
export const generateApiKey = async (name) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api-keys/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate API key');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
};

/**
 * Get list of API keys
 */
export const listApiKeys = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api-keys/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch API keys');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
};

/**
 * Toggle API key active status
 */
export const toggleApiKey = async (keyId, isActive) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api-keys/${keyId}/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to toggle API key');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling API key:', error);
    throw error;
  }
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (keyId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete API key');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
};
