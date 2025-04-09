import { FC, useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask';
import { Loader2, LockKeyhole, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { PaymentProps, PaymentInfo } from '../../types/checkout';
import { checkoutService } from '../../services/api';

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    cardName?: string;
  }>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState(checkoutId);

  // Detect card brand when card number changes
  useEffect(() => {
    setCardBrand(detectCardBrand(paymentData.cardNumber));
  }, [paymentData.cardNumber]);

  // Update payment data when checkout ID changes
  useEffect(() => {
    setPaymentData(prev => ({ ...prev, sid: currentCheckoutId }));
  }, [currentCheckoutId]);

  // Validate form when input changes
  useEffect(() => {
    const errors: {
      cardNumber?: string;
      expiry?: string;
      cvv?: string;
      cardName?: string;
    } = {};
    
    let valid = true;

    if (paymentData.cardName.trim() && !validateCardName(paymentData.cardName)) {
      errors.cardName = 'Please enter the cardholder name';
      valid = false;
    }

    if (paymentData.cardNumber.replace(/\D/g, '').length >= 13 && !validateCardNumber(paymentData.cardNumber)) {
      errors.cardNumber = 'Please enter a valid card number';
      valid = false;
    }

    if (paymentData.expiry.length === 5 && !validateExpiryDate(paymentData.expiry)) {
      errors.expiry = 'Please enter a valid expiration date';
      valid = false;
    }

    if (paymentData.cvv.length >= 3 && !validateCVV(paymentData.cvv)) {
      errors.cvv = 'Please enter a valid CVV';
      valid = false;
    }

    setFormErrors(errors);
    
    // Check if all fields have values and no errors
    const allFieldsFilled = 
      paymentData.cardName.trim() !== '' && 
      paymentData.cardNumber.replace(/\D/g, '').length >= 13 &&
      paymentData.expiry.length === 5 && 
      paymentData.cvv.length >= 3;
      
    setIsFormValid(valid && allFieldsFilled);
  }, [paymentData]);

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

  const validateCardNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\D/g, '');
    return cleanNumber.length >= 13 && cleanNumber.length <= 19;
  };

  const validateCVV = (cvv: string): boolean => {
    return cvv.length >= 3 && cvv.length <= 4;
  };

  const validateCardName = (name: string): boolean => {
    return name.trim().length > 0;
  };

  const handleExpiryChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, expiry: value }));
  };

  const handleCardNumberChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, cardNumber: value }));
  };

  const handleCVVChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, cvv: value }));
  };

  const handleCardNameChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, cardName: value }));
  };

  // Generate a new checkout ID and update the record in the database
  const generateAndUpdateCheckoutId = async () => {
    try {
      // Store the old checkout ID before generating a new one
      const oldCheckoutId = currentCheckoutId;
      
      // Generate a new checkout ID
      const newCheckoutId = await checkoutService.generateCheckoutId();
      
      // Update the checkout ID in the database
      await checkoutService.updateCheckoutId(oldCheckoutId, newCheckoutId);
      
      // Update local state with the new checkout ID
      setCurrentCheckoutId(newCheckoutId);
      localStorage.setItem('checkout_id', newCheckoutId);
      
      console.log('Updated checkout ID from', oldCheckoutId, 'to', newCheckoutId);
      
      return newCheckoutId;
    } catch (error) {
      console.error('Failed to generate and update checkout ID:', error);
      // In case of failure, continue with the current ID
      return currentCheckoutId;
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!acceptedTerms) {
      setError('Please accept the terms of service and billing agreement');
      return;
    }

    if (!isFormValid) {
      setError('Please correct the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Generate a new checkout ID and update the database record
      const activeCheckoutId = await generateAndUpdateCheckoutId();
      
      // Prepare the payment data for the API
      // Note: The API expects different property names than our internal PaymentInfo interface
      const paymentPayload = {
        cardname: paymentData.cardName,
        cardnumber: paymentData.cardNumber.replace(/\D/g, ''),
        cvv: paymentData.cvv,
        expiry: paymentData.expiry,
        sid: activeCheckoutId
      };
      
      // Process the payment with the updated checkout ID
      const response = await checkoutService.processPayment(paymentPayload);

      if (response.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = 'https://prosecurelsp.com/users/index.php?err3=true';
        }, 5000);
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      if (err.response) {
        setError('Payment processing failed. Please try again.');
      } else {
        setError('Network error. Please try again.');
      }
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
              className={`input-base ${formErrors.cardName ? 'border-red-500' : ''}`}
              placeholder="John Doe"
              value={paymentData.cardName}
              onChange={(e) => handleCardNameChange(e.target.value)}
            />
            {formErrors.cardName && (
              <p className="text-sm text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.cardName}
              </p>
            )}
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
                onAccept={handleCardNumberChange}
                className={`input-base pr-12 ${formErrors.cardNumber ? 'border-red-500' : ''}`}
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
            {formErrors.cardNumber && (
              <p className="text-sm text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.cardNumber}
              </p>
            )}
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
                onAccept={handleExpiryChange}
                className={`input-base ${formErrors.expiry ? 'border-red-500' : ''}`}
                placeholder="MM/YY"
              />
              {formErrors.expiry && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {formErrors.expiry}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-primary mb-2">
                CVV
              </label>
              <IMaskInput
                mask="000"
                value={paymentData.cvv}
                onAccept={handleCVVChange}
                className={`input-base ${formErrors.cvv ? 'border-red-500' : ''}`}
                placeholder="123"
              />
              {formErrors.cvv && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {formErrors.cvv}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg text-gray-600">
            <CreditCard className="w-5 h-5" />
            <p className="text-sm">
              Your card will not be charged until after your 30-day trial period
            </p>
          </div>

          {/* Terms of Service */}
          <div className="form-group">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I accept the <a 
                  href="https://prosecurelsp.com/toc.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  terms of service
                </a>
              </label>
            </div>
          </div>

          {/* Billing Agreement */}

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
          disabled={loading || !acceptedTerms || !isFormValid}
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