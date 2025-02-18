// src/components/checkout/PlanAssociation.tsx
import { FC, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { checkoutService } from '../../services/api';

interface PlanAssociationProps {
  formData: {
    email: string;
    username: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export const PlanAssociation: FC<PlanAssociationProps> = ({
  formData,
  onNext,
  onBack
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const associatePlan = async () => {
      try {
        setStatus('loading');
        
        // Verificar se tem itens no carrinho primeiro
        const cartResponse = await checkoutService.getCart();
        if (!cartResponse?.items?.length) {
          throw new Error('No items in cart. Please add plans before proceeding.');
        }
  
        // Simulação de progresso visual
        const steps = [
          'Initializing your account...',
          'Configuring security settings...',
          'Setting up your plan...',
          'Finalizing your subscription...'
        ];
        
        for (let i = 0; i < steps.length; i++) {
          setProgress(((i + 1) / steps.length) * 100);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
  
        const checkoutId = localStorage.getItem('checkout_id');
        if (!checkoutId) {
          throw new Error('Checkout session not found');
        }
  
        await checkoutService.linkAccount(checkoutId);
        setStatus('success');
        setTimeout(() => {
          onNext();
        }, 2000);
  
      } catch (err: any) {
        setStatus('error');
        setError(err?.response?.data?.message || err?.message || 'Failed to associate plan');
      }
    };
  
    if (status === 'idle') {
      associatePlan();
    }
  }, [formData.email, formData.username, status]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
              </div>
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  className="text-gray-200"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="48"
                  cy="48"
                />
                <circle
                  className="text-accent"
                  strokeWidth="4"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * progress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="48"
                  cy="48"
                />
              </svg>
            </div>
            <div>
              <p className="text-xl font-medium text-primary">
                Setting Up Your Account
              </p>
              <p className="text-gray-500 mt-2">
                Please wait while we configure your account...
              </p>
            </div>
            <div className="w-full max-w-sm mx-auto bg-gray-100 rounded-full h-1">
              <div 
                className="bg-accent h-1 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary">
                Account Setup Complete!
              </h3>
              <p className="text-gray-600 mt-2">
                Your account has been successfully configured. Redirecting you to the next step...
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary mt-4">
                Setup Error
              </h3>
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 button-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStatus('idle')}
                className="flex-1 button-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-form mx-auto">
      <div className="bg-white rounded-lg p-8 shadow-sm min-h-[400px] flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default PlanAssociation;