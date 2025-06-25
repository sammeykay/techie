import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tokenStorage, isTokenExpired } from '../utils/storage';
import { apiService } from '../services/api';
import { generateOAuthState, storeOAuthState, getStoredOAuthState, clearOAuthState, handleTechieOAuthCallback, cleanupOAuthUrl } from '../utils/oauth';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface UserProfile {
  user: User;
  connected_gmail: string | null;
  display_picture: string;
  profile_image: string | null;
  gmail_profile_picture_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string, agreedToTerms: boolean) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  handleTokenExpiration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!profile && tokenStorage.hasValidTokens();

  const handleTokenExpiration = () => {
    console.log('Token expiration detected, logging out user...');
    logout();
    // You could also show a toast notification here
    alert('Your session has expired. Please log in again.');
  };

  const login = async (email: string, password: string) => {
    console.log('AuthContext login called');
    try {
      const response = await apiService.login(email, password);
      console.log('Login response:', response);
      
      if (response.access && response.refresh) {
        console.log('Storing tokens...');
        tokenStorage.setTokens(response.access, response.refresh);
        
        if (response.user) {
          console.log('Setting user from response:', response.user);
          setUser(response.user);
        }
        
        console.log('Refreshing profile...');
        await refreshProfile();
        console.log('Login process completed successfully');
      } else {
        console.error('Login response missing tokens:', response);
        throw new Error('Invalid login response - missing tokens');
      }
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    console.log('Google OAuth login initiated');
    try {
      // Generate and store state parameter
      const state = generateOAuthState();
      storeOAuthState(state);
      
      // Build the Google OAuth URL and redirect
      const googleOAuthUrl = buildGoogleOAuthUrl(state);
      window.location.href = googleOAuthUrl;
    } catch (error) {
      console.error('Google OAuth login failed:', error);
      clearOAuthState();
      throw error;
    }
  };

  const buildGoogleOAuthUrl = (state: string): string => {
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

  const handleOAuthReturn = async () => {
    try {
      // First, check for the new techieplus.netlify.app redirect format
      const techieTokens = handleTechieOAuthCallback();
      if (techieTokens) {
        console.log('Processing techieplus OAuth callback with tokens');
        
        // Store the tokens directly
        tokenStorage.setTokens(techieTokens.access, techieTokens.refresh);
        
        // Clean up the URL
        cleanupOAuthUrl();
        
        // Refresh profile to get user data
        await refreshProfile();
        clearOAuthState();
        
        return true; // Indicate successful OAuth processing
      }

      // Fallback to original OAuth callback handling
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = getStoredOAuthState();

      if (code && state && storedState && state === storedState) {
        console.log('Processing OAuth callback with code:', code);
        
        // Send the code and state to your backend
        const response = await apiService.handleGoogleCallback(state, code);
        
        if (response.access && response.refresh) {
          tokenStorage.setTokens(response.access, response.refresh);
          
          if (response.user) {
            setUser(response.user);
          }
          
          await refreshProfile();
          clearOAuthState();
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return true; // Indicate successful OAuth processing
        }
      }
      return false; // No OAuth callback processed
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      clearOAuthState();
      cleanupOAuthUrl();
      return false;
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, agreedToTerms: boolean) => {
    try {
      const response = await apiService.signup(email, password, firstName, lastName, agreedToTerms);
      // Signup might require email verification, handle accordingly
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    tokenStorage.clearTokens();
    clearOAuthState();
    cleanupOAuthUrl();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    console.log('Refreshing profile...');
    try {
      const profileData = await apiService.getProfile();
      console.log('Profile data received:', profileData);
      
      // Handle paginated response format
      let actualProfile: UserProfile;
      if (profileData.results && Array.isArray(profileData.results) && profileData.results.length > 0) {
        actualProfile = profileData.results[0];
        console.log('Extracted profile from results:', actualProfile);
      } else if (profileData.user) {
        // Direct profile object
        actualProfile = profileData;
        console.log('Using direct profile object:', actualProfile);
      } else {
        console.error('Invalid profile data structure:', profileData);
        throw new Error('Invalid profile data received');
      }
      
      setProfile(actualProfile);
      if (actualProfile.user) {
        console.log('Setting user from profile:', actualProfile.user);
        setUser(actualProfile.user);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If profile refresh fails due to auth issues, handle token expiration
      if (error instanceof Error && (
        error.message.includes('token') || 
        error.message.includes('401') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('Session expired')
      )) {
        console.log('Authentication error detected during profile refresh');
        handleTokenExpiration();
        throw error;
      }
    }
  };

  const tryRefreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken || isTokenExpired(refreshToken)) {
        console.log('Refresh token is invalid or expired');
        return false;
      }

      console.log('Attempting to refresh access token...');
      await apiService.refreshToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const initializeAuth = async () => {
    console.log('Initializing auth...');
    setIsLoading(true);
    
    try {
      // First, check for OAuth callback (both formats)
      const oauthProcessed = await handleOAuthReturn();
      if (oauthProcessed) {
        console.log('OAuth callback processed successfully');
        setIsLoading(false);
        return;
      }

      // Check if we have any tokens
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        console.log('No tokens found, user needs to login');
        setIsLoading(false);
        return;
      }

      // Check if refresh token is expired
      if (isTokenExpired(refreshToken)) {
        console.log('Refresh token expired, clearing tokens');
        tokenStorage.clearTokens();
        setIsLoading(false);
        return;
      }

      // If access token is expired but refresh token is valid, try to refresh
      if (isTokenExpired(accessToken)) {
        console.log('Access token expired, attempting refresh...');
        const refreshSuccess = await tryRefreshToken();
        if (!refreshSuccess) {
          console.log('Token refresh failed, user needs to login');
          tokenStorage.clearTokens();
          setIsLoading(false);
          return;
        }
      }

      // At this point we should have valid tokens, try to get profile
      console.log('Valid tokens found, refreshing profile...');
      await refreshProfile();
      console.log('Auth initialization completed successfully');
      
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear everything on initialization failure
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated,
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
    refreshProfile,
    handleTokenExpiration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};