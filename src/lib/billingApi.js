import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

/**
 * Get auth token from Supabase session
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

/**
 * Get user's credit balance and usage
 */
export const getCreditBalance = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/billing/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch credit balance');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    throw error;
  }
};

/**
 * Get user's credit transaction history
 */
export const getCreditTransactions = async (limit = 50) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/billing/transactions?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch credit transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    throw error;
  }
};

/**
 * Purchase credits
 */
export const purchaseCredits = async (packageName, credits, price) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/billing/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package_name: packageName,
        credits: credits,
        price: price,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to purchase credits');
    }

    return await response.json();
  } catch (error) {
    console.error('Error purchasing credits:', error);
    throw error;
  }
};

/**
 * Get auto top-up settings
 */
export const getAutoTopUpSettings = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/billing/auto-top-up`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch auto top-up settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching auto top-up settings:', error);
    throw error;
  }
};

/**
 * Update auto top-up settings
 */
export const updateAutoTopUpSettings = async (enabled, threshold = null, amount = null) => {
  try {
    const token = await getAuthToken();
    const body = { enabled };
    if (threshold !== null) body.threshold = threshold;
    if (amount !== null) body.amount = amount;

    const response = await fetch(`${API_URL}/billing/auto-top-up`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to update auto top-up settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating auto top-up settings:', error);
    throw error;
  }
};

/**
 * Deduct credits for feature usage (internal)
 */
export const deductCredits = async (credits, description) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/billing/deduct-credits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credits: credits,
        description: description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to deduct credits');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/stripe/subscription/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
};

/**
 * Create subscription checkout session
 */
export const createSubscription = async (plan, successUrl, cancelUrl) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/stripe/create-subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan: plan,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Update auto renewal preference
 * Note: This is a preference flag only and does NOT cancel the Stripe subscription
 */
export const updateAutoRenewal = async (autoRenewalEnabled) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/stripe/subscription/auto-renewal`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auto_renewal_enabled: autoRenewalEnabled,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update auto renewal preference');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating auto renewal preference:', error);
    throw error;
  }
};
