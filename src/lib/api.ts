// API utility functions to interact with the Cloudflare Worker

// Base URL for the API
// In development, we need to use a different URL than in production
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // In development, use localhost
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:8787/api';
    }
    
    // In production, use the deployed Worker URL
    // This assumes the Worker is deployed under the same domain in the /api path
    const currentDomain = window.location.hostname;
    return `https://${currentDomain}/api`;
  }
  
  // Fallback for server-side rendering
  return 'https://droitfpra.pages.dev/api';
};

// Generic fetch function with error handling
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

// API functions for specific endpoints
export const getApiStatus = () => fetchApi('');

export const getNews = () => fetchApi('/news');

export const createNewsItem = (data: any) => 
  fetchApi('/news', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export default {
  getApiStatus,
  getNews,
  createNewsItem,
}; 