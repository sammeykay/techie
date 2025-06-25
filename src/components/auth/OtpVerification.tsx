import React, { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiService } from '../../services/api';

interface OtpVerificationProps {
  email: string;
  type: 'email' | 'reset';
  onSuccess: () => void;
  onBack: () => void;
  newPassword?: string;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  type,
  onSuccess,
  onBack,
  newPassword
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (type === 'email') {
        await apiService.verifyEmailOtp(email, otp);
      } else if (type === 'reset' && newPassword) {
        await apiService.verifyResetOtp(email, otp, newPassword);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (type === 'reset') {
        await apiService.requestResetOtp(email);
      }
      // For email verification, you might need to call signup again or have a separate resend endpoint
    } catch (err) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Enter verification code</h2>
        <p className="mt-2 text-gray-600">
          We've sent a 6-digit code to {email}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="text"
          label="Verification code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          required
        />

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Verify code
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Resend code
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
      </form>
    </div>
  );
};