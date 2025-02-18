import { FC, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { PersonalInfo } from './PersonalInfo';
import AccountCreation from './AccountCreation';
import { PlanAssociation } from './PlanAssociation';
import { ReviewStep } from './ReviewStep';
import { PaymentStep } from './PaymentStep';
import { FormData, Country } from '../../types/checkout';
import { checkoutService } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { Notifications } from '../ui/Notifications';

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', prefix: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', prefix: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', prefix: '+61' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', prefix: '+55' }
];

const STEPS = {
  PERSONAL: 1,
  ACCOUNT: 2,
  PLAN: 3,
  REVIEW: 4,
  PAYMENT: 5
} as const;

const STEPS_INFO = [
  { number: STEPS.PERSONAL, title: 'Personal Info', description: 'Your basic information' },
  { number: STEPS.ACCOUNT, title: 'Account', description: 'Create your account' },
  { number: STEPS.PLAN, title: 'Plan', description: 'Plan association' },
  { number: STEPS.REVIEW, title: 'Review', description: 'Review your information' },
  { number: STEPS.PAYMENT, title: 'Payment', description: 'Payment information' }
] as const;

const CheckoutForm: FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(STEPS.PERSONAL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkoutId, setCheckoutId] = useState<string>('');
  const { notifications, addNotification, removeNotification } = useNotification();
  const isInitialized = useRef(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: COUNTRIES[0],
    zipCode: '',
    state: '',
    city: '',
    street: '',
    additional: '',
    verificationCode: '',
    mfaVerified: false,
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!checkoutId && !isInitialized.current) {
        isInitialized.current = true;
        try {
          setIsLoading(true);
          const id = await checkoutService.generateCheckoutId();
          setCheckoutId(id);
          localStorage.setItem('checkout_id', id);
          console.log('Generated new checkout ID:', id);
        } catch (error) {
          addNotification(
            'error',
            'Failed to initialize checkout. Please refresh the page and try again.'
          );
          console.error('Initialization error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeCheckout();
  }, []);

  const handleFormUpdate = (newData: FormData) => {
    console.log('Updating form data:', newData);
    setFormData(newData);
  };

  const handleStepNavigation = async (nextStep: number) => {
    if (!checkoutId) {
      addNotification('error', 'Checkout session not initialized. Please refresh the page.');
      return;
    }

    // Só fazer chamada API quando estiver saindo do step ACCOUNT
    if (currentStep === STEPS.ACCOUNT) {
      setIsLoading(true);
      try {
        const apiData = {
          checkout_id: checkoutId,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phoneNumber: formData.phone,
          zipcode: formData.zipCode,
          state: formData.state,
          city: formData.city,
          street: formData.street,
          additional: formData.additional || '',
          username: formData.email,
          passphrase: formData.password
        };

        console.log('Sending API data:', apiData);
        await checkoutService.createOrUpdateCheckout(apiData);
        setCurrentStep(nextStep);
      } catch (error: any) {
        if (error.response) {
          switch (error.response.status) {
            case 400:
              addNotification('error', 'Please check your information and try again.');
              break;
            case 401:
              addNotification('error', 'Your session has expired. Please refresh the page.');
              break;
            case 409:
              addNotification('error', 'This information is already in use. Please try different details.');
              break;
            case 429:
              addNotification('warning', 'Too many attempts. Please wait a moment and try again.');
              break;
            case 500:
              addNotification('error', 'Server error. Please try again later or contact support.');
              break;
            default:
              addNotification('error', 'An unexpected error occurred. Please try again.');
          }
        } else if (error.request) {
          addNotification('error', 'Network error. Please check your connection and try again.');
        } else {
          addNotification('error', 'An unexpected error occurred. Please try again.');
        }
        console.error('Checkout error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Para outros steps, apenas navega
      setCurrentStep(nextStep);
    }
  };

  const handleBack = (previousStep: number) => {
    setCurrentStep(previousStep);
  };

  if (isLoading && !checkoutId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notifications 
        notifications={notifications}
        onRemove={removeNotification}
      />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between mb-8">
          {STEPS_INFO.map((step) => (
            <div 
              key={step.number}
              className={`relative flex flex-col items-center ${
                step.number === currentStep 
                  ? 'text-blue-600' 
                  : step.number < currentStep 
                    ? 'text-gray-500'
                    : 'text-gray-300'
              }`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2
                ${step.number === currentStep 
                  ? 'border-blue-600 bg-blue-50' 
                  : step.number < currentStep
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-300'
                }
              `}>
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            {currentStep === STEPS.PERSONAL && (
              <PersonalInfo
                formData={formData}
                onUpdate={handleFormUpdate}
                onNext={() => handleStepNavigation(STEPS.ACCOUNT)}
              />
            )}
            {currentStep === STEPS.ACCOUNT && (
              <AccountCreation
                formData={formData}
                onUpdate={handleFormUpdate}
                onNext={() => handleStepNavigation(STEPS.PLAN)}
                onBack={() => handleBack(STEPS.PERSONAL)}
              />
            )}
            {currentStep === STEPS.PLAN && (
              <PlanAssociation
                formData={formData}
                onNext={() => setCurrentStep(STEPS.REVIEW)}
                onBack={() => setCurrentStep(STEPS.ACCOUNT)}
              />
            )}
            {currentStep === STEPS.REVIEW && (
              <ReviewStep
                formData={formData}
                onNext={() => handleStepNavigation(STEPS.PAYMENT)}
                onBack={() => handleBack(STEPS.ACCOUNT)}
                setCurrentStep={setCurrentStep}
              />
            )}
            {currentStep === STEPS.PAYMENT && (
              <PaymentStep
                formData={formData}
                checkoutId={checkoutId}
                onBack={() => handleBack(STEPS.REVIEW)}
              />
            )}
          </CardContent>
        </Card>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutForm;