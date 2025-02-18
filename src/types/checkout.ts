export interface PlanData {
  plan_id: number;
  plan_name: string;
  anually: number;
  username: string;
  email: string;
  is_master: number;
}

export interface CheckoutData {
  checkout_id: string;
  name: string;
  email: string;
  phoneNumber: string;
  zipcode: string;
  state: string;
  city: string;
  street: string;
  additional: string;
  plans_json: string;
  plan: number;
  username: string;
  passphrase: string;
  status: number;
  created_at: string;
}

export interface PaymentInfo {
  cardName: string;
  cardNumber: string;
  cvv: string;
  expiry: string;
  sid: string;
}

export interface MFAData {
  phone: string;
  email: string;
  code?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: Country;
  zipCode: string;
  state: string;
  city: string;
  street: string;
  additional: string;
  verificationCode: string;
  mfaVerified: boolean;
  // Account creation fields
  username: string;
  password: string;
  confirmPassword: string;
}

export interface PersonalInfoProps {
  formData: FormData;
  onUpdate: (data: FormData) => void;
  onNext: () => void;
}

export interface PaymentProps {
  formData: FormData;
  onBack: () => void;
  checkoutId: string; // Adicionando a propriedade checkoutId
}
export interface ReviewStepProps {
  formData: FormData;
  onNext: () => void;
  onBack: () => void;
  setCurrentStep: (step: number) => void;
}