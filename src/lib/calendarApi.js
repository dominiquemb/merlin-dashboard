/**
 * Calendar Sync API utilities
 * 
 * Functions to interact with the merlin_heart Calendar Sync API
 */

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

/**
 * Get the Supabase auth token from the session
 * @returns {Promise<string|null>} JWT token or null
 */
const getAuthToken = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('❌ [Calendar API] Failed to get auth token:', error);
    return null;
  }
};

/**
 * Sync calendar for the authenticated user
 * 
 * @param {number} daysAhead - Number of days ahead to sync (default: 7)
 * @returns {Promise<Object>} Sync result
 */
export const syncUserCalendar = async (daysAhead = 7) => {
  console.log('📨 [Calendar API] Sync request initiated', { daysAhead, apiUrl: API_URL });
  
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.error('❌ [Calendar API] No authentication token found');
      return {
        success: false,
        error: 'Not authenticated. Please log in.',
      };
    }
    
    console.log('✅ [Calendar API] Auth token obtained');
    console.log('🔄 [Calendar API] Sending POST request to:', `${API_URL}/calendar/sync`);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    let response;
    try {
      response = await fetch(`${API_URL}/calendar/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          days_ahead: daysAhead,
          use_perplexity: false, // Disable Perplexity for calendar sync
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - sync is taking too long. Please check backend logs.');
      }
      throw error;
    }

    console.log('📡 [Calendar API] Response received:', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Calendar API] HTTP error:', { status: response.status, errorData });
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the sync actually succeeded (backend returns 200 OK even on failure)
    if (!data.success) {
      console.error('❌ [Calendar API] Sync failed:', data);
      return {
        success: false,
        error: data.error || data.message || 'Sync failed',
        data,
      };
    }
    
    console.log('✅ [Calendar API] Sync successful:', data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [Calendar API] Error syncing calendar:', {
      message: error.message,
      error: error,
      daysAhead
    });
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('401')) {
      return {
        success: false,
        error: 'Authentication failed. Please log in again.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to sync calendar',
    };
  }
};

/**
 * Get calendar sync status for the authenticated user
 * 
 * @returns {Promise<Object>} Sync status
 */
export const getCalendarSyncStatus = async () => {
  console.log('📊 [Calendar API] Status check initiated');
  
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.error('❌ [Calendar API] No authentication token found');
      return {
        success: false,
        error: 'Not authenticated. Please log in.',
      };
    }
    
    const url = `${API_URL}/calendar/sync/status`;
    console.log('🔄 [Calendar API] Fetching status from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📡 [Calendar API] Status response:', { 
      status: response.status, 
      ok: response.ok 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Calendar API] Status check failed:', errorData);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Calendar API] Status retrieved:', data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [Calendar API] Error getting sync status:', {
      message: error.message,
      error: error
    });
    
    return {
      success: false,
      error: error.message || 'Failed to get sync status',
    };
  }
};

/**
 * Check if the API is reachable
 * 
 * @returns {Promise<boolean>} True if API is reachable
 */
export const checkApiHealth = async () => {
  console.log('🏥 [Calendar API] Health check starting...');
  
  try {
    const response = await fetch(`${API_URL}/docs`, {
      method: 'GET',
    });
    
    const isHealthy = response.ok;
    console.log(isHealthy ? '✅ [Calendar API] API is healthy' : '⚠️ [Calendar API] API unhealthy');
    
    return isHealthy;
  } catch (error) {
    console.error('❌ [Calendar API] Health check failed:', error);
    return false;
  }
};

/**
 * Fetch upcoming calendar events for the authenticated user
 *
 * @param {Object} options
 * @param {number} [options.limit=50]
 * @param {number} [options.daysAhead=30]
 * @returns {Promise<Object>} Calendar events result
 */
export const fetchCalendarEvents = async ({ limit = 50, daysAhead = 30 } = {}) => {
  console.log('📅 [Calendar API] Fetch events', { limit, daysAhead });

  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ [Calendar API] No authentication token found for events fetch');
      return {
        success: false,
        error: 'Not authenticated. Please log in.',
      };
    }

    const url = new URL(`${API_URL}/calendar/events`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('days_ahead', daysAhead);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Calendar API] Fetch events failed:', { status: response.status, errorData });
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Calendar API] Events received:', data);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [Calendar API] Error fetching events:', {
      message: error.message,
      error,
    });

    return {
      success: false,
      error: error.message || 'Failed to fetch calendar events',
    };
  }
};
