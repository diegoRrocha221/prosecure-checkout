import { FC, useEffect, useState } from 'react';
import { Check, MapPin, Mail, User, Package } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { checkoutService } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { ReviewStepProps } from '../../types/checkout';


interface PlanDetails {
  plan_id: number;
  plan_name: string;
  plan_description: string;
  price: number;
  plan_quantity: number;
  is_annual: boolean;
}

interface CartDetails {
  items: PlanDetails[];
  cart_subtotal: number;
  cart_discount: number;
  shortfall_for_discount: string;
  cart_total: number;
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

export const ReviewStep: FC<ReviewStepProps> = ({ formData, onNext, onBack}) => {
  const [cartDetails, setCartDetails] = useState<CartDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchCartDetails = async () => {
      try {
        setIsLoading(true);
        const response = await checkoutService.getCart();
        setCartDetails(response);
      } catch (error) {
        console.error('Error fetching cart details:', error);
        addNotification('error', 'Failed to load cart details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartDetails();
  }, []);

  // Calcula a data de renovação com base em is_annual
  const getRenewalDate = () => {
    if (!cartDetails || cartDetails.items.length === 0) return '';
    
    const currentDate = new Date();
    let hasAnnualPlan = false;
    
    // Verificar se existe algum plano anual no carrinho
    for (const item of cartDetails.items) {
      if (item.is_annual) {
        hasAnnualPlan = true;
        break;
      }
    }
    
    // Adicionar dias com base no tipo de plano
    const renewalDate = new Date(currentDate);
    if (hasAnnualPlan) {
      renewalDate.setDate(currentDate.getDate() + 365); // Plano anual - adiciona 1 ano
    } else {
      renewalDate.setDate(currentDate.getDate() + 30); // Plano mensal - adiciona 30 dias
    }
    
    // Formatar a data como mm/dd/yy
    const month = String(renewalDate.getMonth() + 1).padStart(2, '0');
    const day = String(renewalDate.getDate()).padStart(2, '0');
    const year = String(renewalDate.getFullYear()).slice(-2);
    
    return `${month}/${day}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!cartDetails || cartDetails.items.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No items in cart. Please go back and select plans.</AlertDescription>
      </Alert>
    );
  }

  const calculateTotals = () => {
    const subtotal = cartDetails.cart_subtotal;
    const discount = cartDetails.cart_discount;
    const first_month_discount = cartDetails.cart_total; 
    const total = cartDetails.cart_total;
    const total_first_month = first_month_discount - total;

    return { subtotal, discount, first_month_discount, total_first_month, total };
  };

  const { subtotal, discount, total } = calculateTotals();
  const renewalDate = getRenewalDate();

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
          {cartDetails.items.map((plan, index) => (
            <div key={index} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-primary font-medium">
                  {plan.plan_name} {plan.is_annual && '(Annual)'}
                </span>
                <span className="text-gray-600">${plan.price.toFixed(2)}</span>
              </div>
              <span className="text-sm text-gray-500">{plan.plan_description}</span>
            </div>
          ))}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <InfoRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {discount > 0 && (
              <InfoRow label="Discount" value={`-$${discount.toFixed(2)}`} />
            )}
            
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <InfoRow 
                label="total amount" 
                value={`$${total.toFixed(2)}`}
              />
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <InfoRow 
                label="First Month Discount" 
                value={`-$${total.toFixed(2)}`}
              />
              <InfoRow 
                label="Total charged today" 
                value="$ 0.00"
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Your account will automatically renew on {renewalDate} and on the same day every month thereafter for the amount shown above. You may cancel anytime by signing into your account portal.
          </p>
        </InfoSection>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => {
            formData.password = '';
            formData.confirmPassword = '';
            onBack();
          }}
          className="flex-1 button-secondary"

        >
          Back
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