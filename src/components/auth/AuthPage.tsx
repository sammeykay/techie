import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { OtpVerification } from './OtpVerification';
import { ForgotPassword } from './ForgotPassword';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-email' | 'verify-reset';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [newPasswordForReset, setNewPasswordForReset] = useState('');

  const handleSignupSuccess = (email: string) => {
    setEmailForVerification(email);
    setMode('verify-email');
  };

  const handleForgotPasswordOtp = (email: string, newPassword: string) => {
    setEmailForVerification(email);
    setNewPasswordForReset(newPassword);
    setMode('verify-reset');
  };

  const handleVerificationSuccess = () => {
    setMode('login');
    setEmailForVerification('');
    setNewPasswordForReset('');
  };

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onToggleMode={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot-password')}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onToggleMode={() => setMode('login')}
            onSignupSuccess={handleSignupSuccess}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword
            onBack={() => setMode('login')}
            onOtpRequired={handleForgotPasswordOtp}
          />
        );
      case 'verify-email':
        return (
          <OtpVerification
            email={emailForVerification}
            type="email"
            onSuccess={handleVerificationSuccess}
            onBack={() => setMode('signup')}
          />
        );
      case 'verify-reset':
        return (
          <OtpVerification
            email={emailForVerification}
            type="reset"
            newPassword={newPasswordForReset}
            onSuccess={handleVerificationSuccess}
            onBack={() => setMode('forgot-password')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl mb-6 relative">
            <Bot className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
            Admin Copilot
          </h1>
          <p className="text-gray-600">Your AI-powered productivity assistant</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Admin Copilot. Powered by advanced AI technology.
          </p>
        </div>
      </div>
    </div>
  );
};