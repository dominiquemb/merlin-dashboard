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
