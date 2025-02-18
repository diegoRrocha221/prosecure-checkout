import { FC, useEffect, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface VerificationBoxProps {
  onVerify: (code: string) => void;
  onResend: () => void;
  isVerifying: boolean;
  error?: string;
  phone: string;
}

export const VerificationBox: FC<VerificationBoxProps> = ({
  onVerify,
  onResend,
  isVerifying,
  error,
  phone
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
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Enter Verification Code
          </h3>
          <p className="text-sm text-gray-600">
            We've sent a 6-digit code to {phone}
          </p>
        </div>

        <div className="flex justify-center space-x-2">
          <IMaskInput
            mask="000000"
            unmask={true}
            value={code}
            onAccept={(value) => setCode(value)}
            className="w-48 px-4 py-3 text-center tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
            placeholder="000000"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              code.length === 6 && !isVerifying
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={timer > 0 || isVerifying}
            className={`px-4 py-2 rounded-lg font-medium ${
              timer > 0 || isVerifying
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
            }`}
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