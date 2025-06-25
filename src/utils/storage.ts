// Secure token storage utilities
const TOKEN_KEYS = {
  ACCESS: 'admin_copilot_access_token',
  REFRESH: 'admin_copilot_refresh_token',
} as const;

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.ACCESS);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.REFRESH);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    console.log('Storing new tokens...');
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  },

  clearTokens: (): void => {
    console.log('Clearing stored tokens...');
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
  },

  hasValidTokens: (): boolean => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!accessToken || !refreshToken) {
      console.log('Missing tokens');
      return false;
    }

    // Check if refresh token is expired
    if (isTokenExpired(refreshToken)) {
      console.log('Refresh token is expired, clearing tokens');
      tokenStorage.clearTokens();
      return false;
    }

    // If access token is expired but refresh token is valid, we can still consider it valid
    // because the API service will handle the refresh automatically
    return true;
  }
};

export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) {
    console.log('Token has no expiration or invalid payload');
    return true;
  }
  
  const currentTime = Date.now() / 1000;
  const isExpired = payload.exp < currentTime;
  
  if (isExpired) {
    console.log('Token is expired:', {
      exp: payload.exp,
      current: currentTime,
      expiredBy: currentTime - payload.exp
    });
  }
  
  return isExpired;
};

export const getTokenTimeRemaining = (token: string): number => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return 0;
  
  const currentTime = Date.now() / 1000;
  const timeRemaining = payload.exp - currentTime;
  return Math.max(0, timeRemaining);
};