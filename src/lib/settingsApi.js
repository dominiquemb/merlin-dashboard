import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Use the same API base URL as merlin-core-app
const API_URL = process.env.REACT_APP_SETTINGS_API_URL || 'https://int.dev.usemerlin.io';

/**
 * Signup to the settings API and get JWT token
 */
export const signupToSettingsAPI = async (userName, password, title) => {
  try {
    const response = await fetch(`${API_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name: userName,
        password: password,
        title: title
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return {
        error: true,
        message: data.message || 'Signup failed',
        data: null
      };
    }

    // The API returns: { data: { jwt_token, id, email, title, payload: { expiry } }, error: false, message: "..." }
    // Store the JWT token
    const jwtToken = data.data?.jwt_token;
    if (jwtToken) {
      localStorage.setItem('settings_jwt_token', jwtToken);
      // Also store the token expiry if provided
      if (data.data?.payload?.expiry) {
        localStorage.setItem('settings_jwt_expiry', data.data.payload.expiry);
      }
    } else {
      console.error('No JWT token in signup response:', data);
      return {
        error: true,
        message: 'Signup response missing JWT token',
        data: null
      };
    }

    return {
      error: false,
      message: data.message || 'Signup successful',
      data: data.data
    };
  } catch (error) {
    console.error('Error signing up to settings API:', error);
    return {
      error: true,
      message: error.message || 'Failed to signup',
      data: null
    };
  }
};

/**
 * Exchange OAuth code for JWT token
 */
export const exchangeOAuthCode = async (code) => {
  try {
    const response = await fetch(`${API_URL}/auth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return {
        error: true,
        message: data.message || 'OAuth exchange failed',
        data: null
      };
    }

    // Store the JWT token
    const jwtToken = data.data?.jwt_token;
    if (jwtToken) {
      localStorage.setItem('settings_jwt_token', jwtToken);
      // Also store the token expiry if provided
      if (data.data?.payload?.expiry) {
        localStorage.setItem('settings_jwt_expiry', data.data.payload.expiry);
      }
    } else {
      console.error('No JWT token in OAuth exchange response:', data);
      return {
        error: true,
        message: 'OAuth exchange response missing JWT token',
        data: null
      };
    }

    return {
      error: false,
      message: data.message || 'OAuth authentication successful',
      data: data.data
    };
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    return {
      error: true,
      message: error.message || 'Failed to exchange OAuth code',
      data: null
    };
  }
};

/**
 * Login to the settings API and get JWT token
 */
export const loginToSettingsAPI = async (userName, password) => {
  try {
    const response = await fetch(`${API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name: userName,
        password: password
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return {
        error: true,
        message: data.message || 'Login failed',
        data: null
      };
    }

    // The API returns: { data: { jwt_token, id, email, title, payload: { expiry } }, error: false, message: "..." }
    // Store the JWT token
    const jwtToken = data.data?.jwt_token;
    if (jwtToken) {
      localStorage.setItem('settings_jwt_token', jwtToken);
      // Also store the token expiry if provided
      if (data.data?.payload?.expiry) {
        localStorage.setItem('settings_jwt_expiry', data.data.payload.expiry);
      }
    } else {
      console.error('No JWT token in login response:', data);
      return {
        error: true,
        message: 'Login response missing JWT token',
        data: null
      };
    }

    return {
      error: false,
      message: data.message || 'Login successful',
      data: data.data
    };
  } catch (error) {
    console.error('Error logging in to settings API:', error);
    return {
      error: true,
      message: error.message || 'Failed to login',
      data: null
    };
  }
};

/**
 * Check if JWT token is expired by decoding the token and checking the exp claim
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    // Decode JWT token (format: header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format: token should have 3 parts');
      return true;
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired using the exp claim (Unix timestamp in seconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error('JWT token is expired');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating JWT token:', error);
    return true;
  }
};

/**
 * Get auth token from Supabase session
 */
const getAuthToken = async () => {
  try {
    // First try to get the current session
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting Supabase session:', sessionError);
      return null;
    }
    
    // If no session, try to refresh it
    if (!session) {
      console.log('No session found, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing Supabase session:', refreshError);
        return null;
      }
      
      session = refreshedSession;
    }
    
    if (!session || !session.access_token) {
      console.error('No valid session or access token found');
      return null;
    }
    
    console.log('Successfully retrieved Supabase access token');
    return session.access_token;
  } catch (error) {
    console.error('Failed to get Supabase auth token:', error);
    return null;
  }
};

/**
 * Get list of vendors
 */
export const getVendors = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available for vendors API');
      return {
        error: true,
        data: null,
        message: 'Not authenticated. Please login first.',
        requiresLogin: true
      };
    }

    console.log('Fetching vendors from:', `${API_URL}/v1/common/vendors`);
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_URL}/v1/common/vendors`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Vendors API response status:', response.status);
    console.log('Vendors API response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Vendors API error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch vendors');
    }

    const data = await response.json();
    console.log('Vendors API success, data:', data);
    return {
      error: false,
      data: data.data || data,
      message: 'Vendors fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return {
      error: true,
      data: null,
      message: error.message || 'Failed to fetch vendors'
    };
  }
};

/**
 * Get settings list
 */
export const getSettings = async (page = 1, limit = 15, search = '') => {
  try {
    const token = await getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    
    const response = await fetch(`${API_URL}/v1/settings?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch settings');
    }

    const data = await response.json();
    return {
      error: false,
      data: data.data || data,
      message: 'Settings fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      error: true,
      data: null,
      message: error.message || 'Failed to fetch settings'
    };
  }
};

/**
 * Get setting by ID
 */
export const getSettingById = async (id) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/v1/settings/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch setting');
    }

    const data = await response.json();
    return {
      error: false,
      data: data.data || data,
      message: 'Setting fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching setting:', error);
    return {
      error: true,
      data: null,
      message: error.message || 'Failed to fetch setting'
    };
  }
};

/**
 * Create a new setting
 */
export const createSetting = async (settingData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        error: true,
        data: null,
        message: 'Not authenticated. Please login first.',
        requiresLogin: true
      };
    }

    const response = await fetch(`${API_URL}/v1/settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create setting');
    }

    const data = await response.json();
    return {
      error: false,
      data: data.data || data,
      message: data.message || 'Setting created successfully'
    };
  } catch (error) {
    console.error('Error creating setting:', error);
    return {
      error: true,
      data: null,
      message: error.message || 'Failed to create setting'
    };
  }
};

/**
 * Update a setting
 */
export const updateSetting = async (id, settingData) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/v1/settings/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update setting');
    }

    const data = await response.json();
    return {
      error: false,
      data: data.data || data,
      message: data.message || 'Setting updated successfully'
    };
  } catch (error) {
    console.error('Error updating setting:', error);
    return {
      error: true,
      data: null,
      message: error.message || 'Failed to update setting'
    };
  }
};

/**
 * Delete a setting
 */
export const deleteSetting = async (id) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/v1/settings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete setting');
    }

    const data = await response.json();
    return {
      error: false,
      data: data.data || data,
      message: data.message || 'Setting deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting setting:', error);
    return {
      error: true,
      data: null,
      message: error.message || 'Failed to delete setting'
    };
  }
};

