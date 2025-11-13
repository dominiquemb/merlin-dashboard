/**
 * Shares API utilities
 *
 * Functions to interact with the merlin_heart Shares API for creating and managing shareable meeting brief links
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

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
    console.error('❌ [Shares API] Failed to get auth token:', error);
    return null;
  }
};

/**
 * Create a shareable link for a meeting brief
 *
 * @param {string} eventId - The event ID to share
 * @param {number|null} expiresDays - Optional number of days until the link expires
 * @returns {Promise<Object>} Share result with token and URL
 */
export const createShareLink = async (eventId, expiresDays = null) => {
  console.log('📨 [Shares API] Creating share link', { eventId, expiresDays, apiUrl: API_URL });

  try {
    const token = await getAuthToken();

    if (!token) {
      console.error('❌ [Shares API] No authentication token found');
      return {
        success: false,
        error: 'Not authenticated. Please log in.',
      };
    }

    console.log('✅ [Shares API] Auth token obtained');
    console.log('🔄 [Shares API] Sending POST request to:', `${API_URL}/shares/create`);

    const response = await fetch(`${API_URL}/shares/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
        expires_days: expiresDays,
      }),
    });

    console.log('📡 [Shares API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Shares API] HTTP error:', { status: response.status, errorData });
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ [Shares API] Share link creation failed:', data);
      return {
        success: false,
        error: data.error || 'Failed to create share link',
        data,
      };
    }

    // Construct the full frontend URL
    const fullShareUrl = `${FRONTEND_URL}/shared/${data.share_token}`;

    console.log('✅ [Shares API] Share link created:', {
      shareToken: data.share_token,
      shareUrl: fullShareUrl
    });

    return {
      success: true,
      shareToken: data.share_token,
      shareUrl: fullShareUrl,
      data,
    };
  } catch (error) {
    console.error('❌ [Shares API] Error creating share link:', {
      message: error.message,
      error: error,
      eventId
    });

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Get a shared brief by its token (public access, no auth required)
 *
 * @param {string} shareToken - The share token
 * @returns {Promise<Object>} Brief data
 */
export const getSharedBrief = async (shareToken) => {
  console.log('📨 [Shares API] Fetching shared brief', { shareToken, apiUrl: API_URL });

  try {
    console.log('🔄 [Shares API] Sending GET request to:', `${API_URL}/shares/${shareToken}`);

    const response = await fetch(`${API_URL}/shares/${shareToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 [Shares API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Shares API] HTTP error:', { status: response.status, errorData });

      if (response.status === 404) {
        return {
          success: false,
          error: 'Shared brief not found or has been revoked',
        };
      }

      if (response.status === 410) {
        return {
          success: false,
          error: 'This shared link has expired',
        };
      }

      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ [Shares API] Shared brief retrieved successfully');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [Shares API] Error fetching shared brief:', {
      message: error.message,
      error: error,
      shareToken
    });

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Revoke (deactivate) a shared link
 *
 * @param {string} shareToken - The share token to revoke
 * @returns {Promise<Object>} Revoke result
 */
export const revokeShareLink = async (shareToken) => {
  console.log('📨 [Shares API] Revoking share link', { shareToken, apiUrl: API_URL });

  try {
    const token = await getAuthToken();

    if (!token) {
      console.error('❌ [Shares API] No authentication token found');
      return {
        success: false,
        error: 'Not authenticated. Please log in.',
      };
    }

    console.log('✅ [Shares API] Auth token obtained');
    console.log('🔄 [Shares API] Sending DELETE request to:', `${API_URL}/shares/${shareToken}`);

    const response = await fetch(`${API_URL}/shares/${shareToken}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📡 [Shares API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Shares API] HTTP error:', { status: response.status, errorData });
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ [Shares API] Share link revoked successfully');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [Shares API] Error revoking share link:', {
      message: error.message,
      error: error,
      shareToken
    });

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};
