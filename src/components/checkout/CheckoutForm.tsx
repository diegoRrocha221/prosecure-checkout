import { FC, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { PersonalInfo } from './PersonalInfo';
import AccountCreation from './AccountCreation';
import { PlanAssociation } from './PlanAssociation';
import { ReviewStep } from './ReviewStep';
import { PaymentStep } from './PaymentStep';
import { FormData, Country } from '../../types/checkout';

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
  console.log('CheckoutForm rendering');
  const [currentStep, setCurrentStep] = useState<number>(STEPS.PERSONAL);
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

  return (
    <div className="min-h-screen bg-gray-50">
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
        <CardContent>
          {currentStep === STEPS.PERSONAL && (
            <PersonalInfo
              formData={formData}
              onUpdate={setFormData}
              onNext={() => setCurrentStep(STEPS.ACCOUNT)}
            />
          )}
          {currentStep === STEPS.ACCOUNT && (
            <AccountCreation
              formData={formData}
              onUpdate={setFormData}
              onNext={() => setCurrentStep(STEPS.PLAN)}
              onBack={() => setCurrentStep(STEPS.PERSONAL)}
            />
          )}
          {currentStep === STEPS.PLAN && (
            <PlanAssociation
              formData={formData}
              onUpdate={setFormData}
              onNext={() => setCurrentStep(STEPS.REVIEW)}
              onBack={() => setCurrentStep(STEPS.ACCOUNT)}
            />
          )}
          {currentStep === STEPS.REVIEW && (
            <ReviewStep
              formData={formData}
              onNext={() => setCurrentStep(STEPS.PAYMENT)}
              onBack={() => setCurrentStep(STEPS.PLAN)}
              setCurrentStep={setCurrentStep}
            />
          )}
          {currentStep === STEPS.PAYMENT && (
            <PaymentStep
              formData={formData}
              onBack={() => setCurrentStep(STEPS.REVIEW)}
            />
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutForm;