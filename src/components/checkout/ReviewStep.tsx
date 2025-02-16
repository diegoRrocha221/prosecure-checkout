import { FC, useEffect, useState } from 'react';
import { Check, MapPin, Mail, Phone, User, CreditCard, Package } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { FormData } from '../../types/checkout';

interface ReviewProps {
  formData: FormData;
  onNext: () => void;
  onBack: () => void;
  setCurrentStep: (step: number) => void;
}

interface PlanDetails {
  name: string;
  price: number;
  billing: string;
}

const InfoSection: FC<{ 
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4 text-primary">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const InfoRow: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-primary">{value}</span>
  </div>
);

export const ReviewStep: FC<ReviewProps> = ({ formData, onNext, setCurrentStep }) => {
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const checkoutId = localStorage.getItem('checkout_id');
        const response = await fetch(`https://pay.prosecurelsp.com/api/get-plans?checkout_id=${checkoutId}`);
        if (!response.ok) throw new Error('Failed to load plans');
        const data = await response.json();
        setPlans(data.plans);
      } catch (err) {
        setError('Failed to load plan details');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  const calculateTotals = () => {
    const subtotal = plans.reduce((sum, plan) => sum + plan.price, 0);
    const discount = subtotal; // 100% discount for trial period
    const total = 0; // First month is free

    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-form mx-auto">
      <div className="grid gap-6">
        <InfoSection title="Personal Information" icon={<User className="w-6 h-6" />}>
          <InfoRow label="Name" value={`${formData.firstName} ${formData.lastName}`} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow 
            label="Phone" 
            value={`${formData.country.prefix} ${formData.phone}`} 
          />
        </InfoSection>

        <InfoSection title="Billing Address" icon={<MapPin className="w-6 h-6" />}>
          <InfoRow label="Street" value={formData.street} />
          {formData.additional && (
            <InfoRow label="Apartment/Suite" value={formData.additional} />
          )}
          <InfoRow label="City" value={formData.city} />
          <InfoRow label="State" value={formData.state} />
          <InfoRow label="ZIP Code" value={formData.zipCode} />
        </InfoSection>

        <InfoSection title="Account Information" icon={<Mail className="w-6 h-6" />}>
          <InfoRow label="Username" value={formData.email} />
          <div className="flex items-center gap-2 text-green-600 mt-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">Account created successfully</span>
          </div>
        </InfoSection>

        <InfoSection title="Selected Plans" icon={<Package className="w-6 h-6" />}>
          {plans.map((plan, index) => (
            <div key={index} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-primary font-medium">{plan.name}</span>
                <span className="text-gray-600">${plan.price.toFixed(2)}</span>
              </div>
              <span className="text-sm text-gray-500">{plan.billing}</span>
            </div>
          ))}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <InfoRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <InfoRow label="New Subscriber Package" value={`-$${discount.toFixed(2)}`} />
            <div className="mt-2 pt-2 border-t border-gray-200">
              <InfoRow 
                label="Total amount charged today" 
                value={`$${total.toFixed(2)}`}
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Your card will not be charged until after your 30-day trial period.
          </p>
        </InfoSection>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep(2)} // Volta direto para o segundo passo
          className="flex-1 button-secondary"
        >
          Back to Account Creation
        </button>
        <button
          onClick={onNext}
          className="flex-1 button-primary"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;