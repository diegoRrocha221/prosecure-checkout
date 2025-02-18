import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://mfa.prosecurelsp.com';

export const useMFAVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const sendVerificationCode = async (phone: string, email: string) => {
    setIsVerifying(true);
    setError(undefined);
    try {
      const response = await axios.post(`${API_URL}/api/checkout/verify_phone`, {
        phone: phone.replace(/\D/g, ''), // Remove não-dígitos
        username: email
      });

      if (response.data.status === 'pending_verification') {
        setShowVerificationInput(true);
      } else {
        setError('Failed to send verification code');
      }
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyCode = async (code: string, email: string) => {
    setIsVerifying(true);
    setError(undefined);
    try {
      const response = await axios.post(`${API_URL}/api/checkout/verify_code`, {
        code,
        username: email
      });

      if (response.data.status === 'authenticated') {
        setIsVerified(true);
        setShowVerificationInput(false);
      } else {
        setError('Invalid verification code');
      }
    } catch (err: any) {
      console.error('Error verifying code:', err);
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('Failed to verify code. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async (phone: string, email: string) => {
    setIsVerifying(true);
    setError(undefined);
    try {
      const response = await axios.post(`${API_URL}/api/checkout/resend_code`, {
        phone: phone.replace(/\D/g, ''),
        username: email
      });

      if (response.data.status === 'pending_verification') {
        setShowVerificationInput(true);
      } else {
        setError('Failed to resend verification code');
      }
    } catch (err: any) {
      console.error('Error resending code:', err);
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setIsVerifying(false);
    setIsVerified(false);
    setShowVerificationInput(false);
    setError(undefined);
  };

  return {
    isVerifying,
    isVerified,
    showVerificationInput,
    error,
    sendVerificationCode,
    verifyCode,
    resendCode,
    resetVerification
  };
};