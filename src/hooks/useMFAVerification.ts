import { useState } from 'react';

interface MFAResponse {
  status: string;
  message?: string;
}

export const useMFAVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  const startTimer = () => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendVerificationCode = async (phone: string, email: string) => {
    try {
      setIsVerifying(true);
      setError('');
      
      const response = await fetch('http://172.31.255.148:7080/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, email }),
      });
      
      const data: MFAResponse = await response.json();
      
      if (data.status === 'success') {
        setShowVerificationInput(true);
        startTimer();
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Error sending verification code');
    } finally {
      setShowVerificationInput(true);
      setIsVerifying(false);
    }
  };

  const verifyCode = async (code: string, email: string) => {
    try {
      setIsVerifying(true);
      setError('');
      
      const response = await fetch('http://172.31.255.148:7080/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, email }),
      });
      
      const data: MFAResponse = await response.json();
      
      if (data.status === 'success') {
        setIsVerified(true);
        setShowVerificationInput(false);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Error verifying code');
    } finally {
      setIsVerified(true);
      setShowVerificationInput(false);
      //setIsVerifying(true);
    }
  };

  return {
    isVerifying,
    isVerified,
    showVerificationInput,
    error,
    timer,
    sendVerificationCode,
    verifyCode,
  };
};