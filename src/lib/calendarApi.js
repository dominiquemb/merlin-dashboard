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
  console.log('🔍 [DEBUG] [Calendar API] ========== SYNC REQUEST START ==========');
  console.log('📨 [DEBUG] [Calendar API] Sync request initiated', { daysAhead, apiUrl: API_URL });
  console.log('🔍 [DEBUG] [Calendar API] API_URL:', API_URL);
  console.log('🔍 [DEBUG] [Calendar API] daysAhead parameter:', daysAhead);
  
  try {
    console.log('🔍 [DEBUG] [Calendar API] Getting auth token...');
    const token = await getAuthToken();
    console.log('🔍 [DEBUG] [Calendar API] Token received:', token ? `Token exists (length: ${token.length})` : 'null');
    
    if (!token) {
      console.error('❌ [DEBUG] [Calendar API] No authentication token found');
      return {
        success: false,
        error: 'Not authenticated. Please log in.',
      };
    }
    
    console.log('✅ [DEBUG] [Calendar API] Auth token obtained');
    const requestUrl = `${API_URL}/calendar/sync`;
    console.log('🔄 [DEBUG] [Calendar API] Sending POST request to:', requestUrl);
    console.log('🔍 [DEBUG] [Calendar API] Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 20)}...` // Log only first 20 chars
    });
    const requestBody = {
      days_ahead: daysAhead,
      use_perplexity: false, // Disable Perplexity for calendar sync
    };
    console.log('🔍 [DEBUG] [Calendar API] Request body:', JSON.stringify(requestBody));
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    let response;
    try {
      console.log('🔍 [DEBUG] [Calendar API] About to call fetch...');
      response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log('🔍 [DEBUG] [Calendar API] Fetch completed, response received');
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ [DEBUG] [Calendar API] Fetch error:', error);
      console.error('🔍 [DEBUG] [Calendar API] Error name:', error?.name);
      console.error('🔍 [DEBUG] [Calendar API] Error message:', error?.message);
      console.error('🔍 [DEBUG] [Calendar API] Error stack:', error?.stack);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - sync is taking too long. Please check backend logs.');
      }
      throw error;
    }

    console.log('📡 [DEBUG] [Calendar API] Response received');
    console.log('🔍 [DEBUG] [Calendar API] Response status:', response.status);
    console.log('🔍 [DEBUG] [Calendar API] Response statusText:', response.statusText);
    console.log('🔍 [DEBUG] [Calendar API] Response ok:', response.ok);
    console.log('🔍 [DEBUG] [Calendar API] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [DEBUG] [Calendar API] HTTP error - response not ok');
      let errorData;
      try {
        const text = await response.text();
        console.log('🔍 [DEBUG] [Calendar API] Error response text:', text);
        errorData = JSON.parse(text);
      } catch (parseError) {
        console.error('🔍 [DEBUG] [Calendar API] Failed to parse error response:', parseError);
        errorData = {};
      }
      console.error('❌ [DEBUG] [Calendar API] HTTP error details:', { status: response.status, errorData });
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    console.log('🔍 [DEBUG] [Calendar API] Parsing response JSON...');
    let data;
    try {
      const responseText = await response.text();
      console.log('🔍 [DEBUG] [Calendar API] Response text length:', responseText.length);
      console.log('🔍 [DEBUG] [Calendar API] Response text (first 500 chars):', responseText.substring(0, 500));
      data = JSON.parse(responseText);
      console.log('🔍 [DEBUG] [Calendar API] Parsed response data:', data);
      console.log('🔍 [DEBUG] [Calendar API] Data type:', typeof data);
      console.log('🔍 [DEBUG] [Calendar API] Data keys:', data ? Object.keys(data) : 'null');
    } catch (parseError) {
      console.error('❌ [DEBUG] [Calendar API] Failed to parse response JSON:', parseError);
      throw parseError;
    }
    
    // Check if the sync actually succeeded (backend returns 200 OK even on failure)
    console.log('🔍 [DEBUG] [Calendar API] Checking data.success:', data?.success);
    if (!data.success) {
      console.error('❌ [DEBUG] [Calendar API] Sync failed according to data.success');
      console.error('🔍 [DEBUG] [Calendar API] Full data object:', JSON.stringify(data, null, 2));
      return {
        success: false,
        error: data.error || data.message || 'Sync failed',
        data,
      };
    }
    
    console.log('✅ [DEBUG] [Calendar API] Sync successful');
    console.log('🔍 [DEBUG] [Calendar API] Success data:', JSON.stringify(data, null, 2));
    console.log('🔍 [DEBUG] [Calendar API] ========== SYNC REQUEST END (SUCCESS) ==========');
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [DEBUG] [Calendar API] ========== SYNC REQUEST END (ERROR) ==========');
    console.error('❌ [DEBUG] [Calendar API] Error syncing calendar');
    console.error('🔍 [DEBUG] [Calendar API] Error type:', typeof error);
    console.error('🔍 [DEBUG] [Calendar API] Error name:', error?.name);
    console.error('🔍 [DEBUG] [Calendar API] Error message:', error?.message);
    console.error('🔍 [DEBUG] [Calendar API] Error stack:', error?.stack);
    console.error('🔍 [DEBUG] [Calendar API] Full error object:', {
      message: error.message,
      error: error,
      daysAhead
    });
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('401')) {
      console.log('🔍 [DEBUG] [Calendar API] Detected 401 authentication error');
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
  const timestamp = new Date().toISOString();
  console.log('📅 [Calendar API] ========== FETCH EVENTS START ==========');
  console.log('📅 [Calendar API] Fetch events request:', { limit, daysAhead, timestamp, apiUrl: API_URL });

  try {
    console.log('📅 [Calendar API] Getting auth token...');
    const token = await getAuthToken();
    console.log('📅 [Calendar API] Token obtained:', token ? `Token exists (length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...)` : 'null');
    
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
    
    const fullUrl = url.toString();
    console.log('📅 [Calendar API] Request URL:', fullUrl);
    console.log('📅 [Calendar API] Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
    });

    const requestStartTime = Date.now();
    console.log('📅 [Calendar API] Sending fetch request...');
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const requestDuration = Date.now() - requestStartTime;
    console.log('📅 [Calendar API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${requestDuration}ms`,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Calendar API] Fetch events failed:', { 
        status: response.status, 
        statusText: response.statusText,
        errorData,
        url: fullUrl,
      });
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    console.log('📅 [Calendar API] Parsing response JSON...');
    const data = await response.json();
    console.log('✅ [Calendar API] Events received:', {
      eventsCount: data?.events?.length || 0,
      hasEvents: Array.isArray(data?.events),
      dataKeys: Object.keys(data || {}),
      sampleEvent: data?.events?.[0] ? {
        event_id: data.events[0].event_id,
        event: data.events[0].event,
        start: data.events[0].start,
        email: data.events[0].email,
      } : null,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [Calendar API] Error fetching events:', {
      message: error.message,
      stack: error.stack,
      error,
      timestamp,
    });

    return {
      success: false,
      error: error.message || 'Failed to fetch calendar events',
    };
  }
};
