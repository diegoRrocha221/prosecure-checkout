import { FC, useMemo, useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask';
import { AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { PersonalInfoProps, Country } from '../../types/checkout';
import { useMFAVerification } from '../../hooks/useMFAVerification';
import { checkoutService } from '../../services/api';
import { COUNTRY_CONFIGS, CountryCode } from '../../utils/phoneMasks';
import VerificationBox from './VerificationBox';

const COUNTRIES: Country[] = [
  { code: 'US' as CountryCode, name: 'United States', flag: '🇺🇸', prefix: '+1' },
  { code: 'CA' as CountryCode, name: 'Canada', flag: '🇨🇦', prefix: '+1' },
  { code: 'AU' as CountryCode, name: 'Australia', flag: '🇦🇺', prefix: '+61' },
  { code: 'BR' as CountryCode, name: 'Brazil', flag: '🇧🇷', prefix: '+55' }
];

// Função para limpar número de telefone
const cleanPhoneNumber = (phone: string) => {
  return phone.replace(/\D/g, '');
};

export const PersonalInfo: FC<PersonalInfoProps> = ({ formData, onUpdate, onNext }) => {
  const {
    isVerifying,
    isVerified,
    showVerificationInput,
    error,
    sendVerificationCode,
    verifyCode,
    resendCode,
    resetVerification
  } = useMFAVerification();

  // Inicializar o estado de verificação com base no formData
  useEffect(() => {
    if (formData.mfaVerified && !isVerified) {

    }
  }, []);

  // Atualizar o formData quando a verificação for bem-sucedida
  useEffect(() => {
    if (isVerified && !formData.mfaVerified) {
      onUpdate({
        ...formData,
        mfaVerified: true
      });
    }
  }, [isVerified, formData.mfaVerified]);

  const [emailAvailability, setEmailAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
  }>({
    checking: false,
    available: null
  });

  // Email availability check
  useEffect(() => {
    const checkEmailAvailability = async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailAvailability({ checking: false, available: null });
        return;
      }

      setEmailAvailability(prev => ({ ...prev, checking: true }));
      try {
        const available = await checkoutService.checkEmailAvailability(formData.email);
        setEmailAvailability({ 
          checking: false, 
          available: available 
        });
      } catch (err) {
        setEmailAvailability({ checking: false, available: null });
      }
    };

    // Debounce email availability check
    const timeoutId = setTimeout(checkEmailAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handlePhoneChange = (value: string) => {
    const cleanedPhone = cleanPhoneNumber(value);
    onUpdate({ 
      ...formData, 
      phone: cleanedPhone,
      mfaVerified: false // Reset do estado de verificação quando o telefone muda
    });
    resetVerification(); // Reset do estado do hook de verificação
  };
  
  const handleZipCodeChange = async (zip: string) => {
    onUpdate({ ...formData, zipCode: zip });
    if (formData.country.code === 'US' && zip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
        const data = await response.json();
        if (data.places && data.places[0]) {
          onUpdate({
            ...formData,
            zipCode: zip,
            state: data.places[0]['state abbreviation'],
            city: data.places[0]['place name'],
          });
        }
      } catch (error) {
        console.error('Error fetching address data:', error);
      }
    }
  };
  
  const handleVerify = () => {
    const countryConfig = COUNTRY_CONFIGS[formData.country.code as CountryCode];
    
    // Formata o número com o código do país
    const fullPhoneNumber = `${formData.country.prefix}${cleanPhoneNumber(formData.phone)}`;
    
    if (countryConfig.validate(formData.phone)) {
      sendVerificationCode(
        fullPhoneNumber,
        formData.email
      );
    }
  };

  const isPhoneValid = () => {
    const countryConfig = COUNTRY_CONFIGS[formData.country.code as CountryCode];
    return countryConfig.validate(formData.phone);
  };

  const isFormValid = useMemo(() => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      emailAvailability.available === true &&
      formData.phone.trim() !== '' &&
      formData.zipCode.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.street.trim() !== '' &&
      (isVerified || formData.mfaVerified) // Verifica ambos os estados de verificação
    );
  }, [formData, isVerified, emailAvailability.available]);

  const renderRequiredIndicator = (fieldName: keyof typeof formData) => {
    if (fieldName !== 'additional') {
      return <span className="text-red-500 ml-1">*</span>;
    }
    return null;
  };

  // Determina se o telefone está verificado (usando formData ou estado atual)
  const isPhoneVerified = isVerified || formData.mfaVerified;

  return (
    <div className="space-y-6 max-w-form mx-auto">
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-primary mb-2">Personal Information</h2>
        <p className="text-sm text-gray-500 mb-6">Fields marked with * are required</p>
        
        {/* Nome e Sobrenome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              First Name {renderRequiredIndicator('firstName')}
            </label>
            <input
              type="text"
              className="input-base"
              value={formData.firstName}
              onChange={(e) => onUpdate({ ...formData, firstName: e.target.value })}
              placeholder="John"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Last Name {renderRequiredIndicator('lastName')}
            </label>
            <input
              type="text"
              className="input-base"
              value={formData.lastName}
              onChange={(e) => onUpdate({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group mb-6">
          <label className="block text-sm font-medium text-primary mb-2">
            Email {renderRequiredIndicator('email')}
          </label>
          <div className="relative">
            <input
              type="email"
              className={`input-base pr-10 ${
                formData.email && emailAvailability.available === false 
                  ? 'border-red-500' 
                  : formData.email && emailAvailability.available === true 
                    ? 'border-green-500' 
                    : ''
              }`}
              value={formData.email}
              onChange={(e) => onUpdate({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
              required
            />
            {formData.email && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {emailAvailability.checking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                ) : emailAvailability.available === false ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : emailAvailability.available === true ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : null}
              </div>
            )}
          </div>
          {formData.email && emailAvailability.available === false && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              This email is already registered
            </p>
          )}
        </div>

        {/* Telefone */}
        <div className="form-group mb-6">
          <label className="block text-sm font-medium text-primary mb-2">
            Mobile Phone Number {renderRequiredIndicator('phone')}
            {isPhoneVerified && (
              <span className="ml-2 text-green-600 inline-flex items-center">
                <Check className="w-4 h-4 mr-1" />
                Verified
              </span>
            )}
          </label>
          <div className="flex gap-3">
            <select
              className="w-32 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent bg-white"
              value={formData.country.code}
              onChange={(e) => {
                const country = COUNTRIES.find(c => c.code === e.target.value) as Country;
                onUpdate({ 
                  ...formData, 
                  country, 
                  phone: '', 
                  mfaVerified: false // Reset verificação quando o país muda
                });
                resetVerification();
              }}
              disabled={isPhoneVerified}
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.prefix}
                </option>
              ))}
            </select>
            
            <div className="flex-1 relative">
              <IMaskInput
                mask={COUNTRY_CONFIGS[formData.country.code as CountryCode].mask}
                value={formData.phone}
                unmask={false}
                onAccept={handlePhoneChange}
                className={`input-base ${isPhoneVerified ? 'bg-gray-50' : ''}`}
                placeholder={COUNTRY_CONFIGS[formData.country.code as CountryCode].example}
                disabled={isPhoneVerified}
                required
              />
              {!isPhoneVerified && (
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || !formData.phone || !formData.email || !isPhoneValid()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isVerifying ? 'Sending...' : 'Verify'}
                </button>
              )}
            </div>
          </div>
          {!isPhoneVerified && formData.phone && !isPhoneValid() && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Please enter a valid phone number
            </p>
          )}
        </div>

        {/* Código de Verificação */}
        {showVerificationInput && !isPhoneVerified && (
          <VerificationBox
            onVerify={(code) => verifyCode(code, formData.email)}
            onResend={() => {
              resendCode(
                `${formData.country.prefix}${formData.phone}`,
                formData.email
              );
            }}
            isVerifying={isVerifying}
            error={error}
            phone={`${formData.country.prefix}${formData.phone}`}
          />
        )}

        {error && !showVerificationInput && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Código Postal */}
        <div className="form-group mb-6">
          <label className="block text-sm font-medium text-primary mb-2">
            ZIP Code {renderRequiredIndicator('zipCode')}
          </label>
          <IMaskInput
            mask="00000"
            value={formData.zipCode}
            unmask={false}
            onAccept={handleZipCodeChange}
            className="input-base"
            placeholder="12345"
            required
          />
        </div>

        {/* Estado e Cidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              City {renderRequiredIndicator('city')}
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="San Francisco"
              value={formData.city}
              onChange={(e) => onUpdate({ ...formData, city: e.target.value })}
              readOnly={formData.country.code === 'US'}
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              State {renderRequiredIndicator('state')}
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="CA"
              value={formData.state}
              onChange={(e) => onUpdate({ ...formData, state: e.target.value })}
              readOnly={formData.country.code === 'US'}
              required
            />
          </div>
          
        </div>

        {/* Rua e Complemento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Street {renderRequiredIndicator('street')}
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="123 Main St"
              value={formData.street}
              onChange={(e) => onUpdate({ ...formData, street: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Apartment/Suite
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="Apt 4B"
              value={formData.additional}
              onChange={(e) => onUpdate({ ...formData, additional: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isFormValid}
        className={`w-full py-4 rounded-lg font-medium text-lg transition-colors
          ${isFormValid 
            ? 'bg-[#157347] text-white hover:bg-[#126A40]' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Continue
      </button>
    </div>
  );
};

export default PersonalInfo;