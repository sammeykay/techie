// OAuth utility functions for Google authentication
export const generateOAuthState = (): string => {
  // Generate a cryptographically secure random state parameter
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const storeOAuthState = (state: string): void => {
  sessionStorage.setItem('oauth_state', state);
};

export const getStoredOAuthState = (): string | null => {
  return sessionStorage.getItem('oauth_state');
};

export const clearOAuthState = (): void => {
  sessionStorage.removeItem('oauth_state');
};

export const buildGoogleOAuthUrl = (state: string): string => {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount';
  const params = new URLSearchParams({
    client_id: '1009978295589-f94v1q8ic5qn4fdc7mff7qknu3ib6d91.apps.googleusercontent.com',
    redirect_uri: 'https://techer.work.gd/api/auth/gmail/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: state,
    service: 'lso',
    o2v: '2',
    flowName: 'GeneralOAuthFlow',
    techieplus: 'true' // Added to identify requests from techieplus domain
  });
  
  return `${baseUrl}?${params.toString()}`;
};

export const handleOAuthCallback = (url: string): { state: string; code: string } | null => {
  try {
    const urlObj = new URL(url);
    const state = urlObj.searchParams.get('state');
    const code = urlObj.searchParams.get('code');
    
    if (!state || !code) {
      throw new Error('Missing required OAuth parameters');
    }
    
    return { state, code };
  } catch (error) {
    console.error('Failed to parse OAuth callback URL:', error);
    return null;
  }
};

// New function to handle the techieplus.netlify.app redirect format
export const handleTechieOAuthCallback = (): { access: string; refresh: string } | null => {
  try {
    // Check if we have tokens in the URL hash
    const hash = window.location.hash.substring(1); // Remove the # symbol
    const params = new URLSearchParams(hash);
    
    const access = params.get('access');
    const refresh = params.get('refresh');
    
    if (!access || !refresh) {
      console.log('No OAuth tokens found in URL hash');
      return null;
    }
    
    console.log('Found OAuth tokens in URL hash');
    return { access, refresh };
  } catch (error) {
    console.error('Failed to parse OAuth tokens from URL hash:', error);
    return null;
  }
};

// Function to clean up the URL after processing OAuth tokens
export const cleanupOAuthUrl = (): void => {
  // Remove the hash from the URL without triggering a page reload
  if (window.location.hash) {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }
};