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
 * Upload CSV file for enrichment
 */
export const uploadCsvForEnrichment = async (file, selectedFields, deliveryEmail) => {
  try {
    const token = await getAuthToken();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_fields', JSON.stringify(selectedFields));
    formData.append('delivery_email', deliveryEmail);

    const response = await fetch(`${API_URL}/enrichment/upload-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload CSV');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading CSV for enrichment:', error);
    throw error;
  }
};

/**
 * Get user's enrichment job history
 */
export const getEnrichmentJobs = async (limit = 50) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/enrichment/jobs?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch enrichment jobs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching enrichment jobs:', error);
    throw error;
  }
};

/**
 * Get details of a specific enrichment job
 */
export const getEnrichmentJob = async (jobId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/enrichment/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch enrichment job');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching enrichment job:', error);
    throw error;
  }
};

/**
 * Download enriched CSV for a completed job
 */
export const downloadEnrichedCsv = async (jobId, filename) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/enrichment/jobs/${jobId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to download CSV');
    }

    // Create blob from response
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'enriched_data.csv';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Error downloading enriched CSV:', error);
    throw error;
  }
};
