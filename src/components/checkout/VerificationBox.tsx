import { FC, useEffect, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { Loader2 } from 'lucide-react';

interface VerificationBoxProps {
  onVerify: (code: string) => void;
  onResend: () => void;
  isVerifying: boolean;
  error?: string;
}

export const VerificationBox: FC<VerificationBoxProps> = ({
  onVerify,
  onResend,
  isVerifying,
  error
}) => {
  const [timer, setTimer] = useState(30);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = () => {
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleResend = () => {
    setTimer(30);
    onResend();
  };

  return (
    <div className="verification-box">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-primary mb-2">
            Enter Verification Code
          </h3>
          <p className="text-sm text-gray-600">
            We've sent a 6-digit code to your phone number
          </p>
        </div>

        <div className="flex justify-center space-x-2">
          <IMaskInput
            mask="000000"
            unmask={true}
            value={code}
            onAccept={(value) => setCode(value)}
            className="verification-code-input w-48 px-4 py-3 text-center tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent text-xl"
            placeholder="000000"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="button-primary flex items-center justify-center min-w-[120px]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>
          
          <button
            onClick={handleResend}
            disabled={timer > 0}
            className="resend-button flex items-center"
          >
            {timer > 0 ? (
              `Resend in ${timer}s`
            ) : (
              'Resend Code'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBox;