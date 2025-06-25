import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { generateOAuthState, storeOAuthState } from '../../utils/oauth';

export const GoogleLoginButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Generate and store state parameter for security
      const state = generateOAuthState();
      storeOAuthState(state);

      // Build the Google OAuth URL
      const googleOAuthUrl = buildGoogleOAuthUrl(state);
      
      // Redirect to Google OAuth page
      window.location.href = googleOAuthUrl;
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Google login failed');
      setIsLoading(false);
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

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}
      
      <Button
        onClick={handleGoogleLogin}
        isLoading={isLoading}
        variant="outline"
        size="lg"
        className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {!isLoading && (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className="font-semibold text-gray-700">
          {isLoading ? 'Redirecting to Google...' : 'Continue with Google'}
        </span>
      </Button>
    </div>
  );
};