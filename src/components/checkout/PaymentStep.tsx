import { FC, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { Loader2,  LockKeyhole, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { PaymentProps, PaymentInfo } from '../../types/checkout';

// Regex para identificar bandeiras de cartão
const CARD_PATTERNS = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  amex: /^3[47]/,
  discover: /^6/,
  diners: /^3(?:0[0-5]|[68])/,
  jcb: /^(?:2131|1800|35\d{3})/
};

// URLs dos logos das bandeiras
const CARD_LOGOS = {
  visa: 'https://prosecurelsp.com/images/visa.svg',
  mastercard: 'https://prosecurelsp.com/images/mastercard.svg',
  amex: 'https://prosecurelsp.com/images/amex.svg',
  discover: 'https://prosecurelsp.com/images/discover.svg',
  diners: 'https://prosecurelsp.com/images/diners.svg',
  jcb: 'https://prosecurelsp.com/images/jcb.svg'
};


export const PaymentStep: FC<PaymentProps> = ({ onBack, checkoutId }) => {
  const [paymentData, setPaymentData] = useState<PaymentInfo>({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    sid: checkoutId
  });
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const detectCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    for (const [brand, pattern] of Object.entries(CARD_PATTERNS)) {
      if (pattern.test(cleanNumber)) {
        return brand;
      }
    }
    return null;
  };

  const validateExpiryDate = (expiry: string): boolean => {
    if (expiry.length !== 5) return false;
    
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = 2000 + parseInt(yearStr, 10);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    if (month < 1 || month > 12) return false;

    return true;
  };

  const handleExpiryChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, expiry: value }));
    if (value.length === 5 && !validateExpiryDate(value)) {
      setError('Please enter a valid expiration date');
    } else {
      setError('');
    }
  };

  const handleCardNumberChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, cardNumber: value }));
    setCardBrand(detectCardBrand(value));
  };

  const handleSubmit = async () => {
    if (!validateExpiryDate(paymentData.expiry)) {
      setError('Please enter a valid expiration date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://pay.prosecurelsp.com/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardname: paymentData.cardName,
          cardnumber: paymentData.cardNumber.replace(/\D/g, ''),
          cvv: paymentData.cvv,
          expiry: paymentData.expiry,
          sid: checkoutId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = 'https://prosecurelsp.com/users/index.php?err3=true';
        }, 5000);
      } else {
        setError(data.message || 'Payment processing failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for subscribing to ProSecureLSP. An activation link has been sent to your email.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-form mx-auto">
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Payment Information</h2>
            <p className="text-gray-600 mt-2">
              Enter your card details to complete the subscription
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <LockKeyhole className="w-5 h-5" />
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Card Holder Name */}
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Card Holder Name
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="John Doe"
              value={paymentData.cardName}
              onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
            />
          </div>

          {/* Card Number */}
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Card Number
            </label>
            <div className="relative">
              <IMaskInput
                mask="0000 0000 0000 0000"
                value={paymentData.cardNumber}
                unmask={false}
                onAccept={handleCardNumberChange}
                className="input-base pr-12"
                placeholder="4242 4242 4242 4242"
              />
              {cardBrand && (
                <img
                  src={CARD_LOGOS[cardBrand as keyof typeof CARD_LOGOS]}
                  alt={`${cardBrand} logo`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-auto"
                />
              )}
            </div>
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-primary mb-2">
                Expiration Date
              </label>
              <IMaskInput
                mask="00/00"
                value={paymentData.expiry}
                unmask={false}
                onAccept={handleExpiryChange}
                className="input-base"
                placeholder="MM/YY"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-primary mb-2">
                CVV
              </label>
              <IMaskInput
                mask="000"
                value={paymentData.cvv}
                unmask={false}
                onAccept={(value) => setPaymentData({ ...paymentData, cvv: value })}
                className="input-base"
                placeholder="123"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg text-gray-600">
            <CreditCard className="w-5 h-5" />
            <p className="text-sm">
              Your card will not be charged until after your 30-day trial period
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 button-secondary"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !paymentData.cardName || !paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv}
          className="flex-1 button-primary flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Complete Purchase'
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;