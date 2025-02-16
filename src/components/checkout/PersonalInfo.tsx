import { FC, useEffect, useMemo } from 'react';
import { IMaskInput } from 'react-imask';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { PersonalInfoProps, Country } from '../../types/checkout';
import { useMFAVerification } from '../../hooks/useMFAVerification';
import { COUNTRY_CONFIGS, CountryCode } from '../../utils/phoneMasks';
import VerificationBox from './VerificationBox';

const COUNTRIES: Country[] = [
  { code: 'US' as CountryCode, name: 'United States', flag: '🇺🇸', prefix: '+1' },
  { code: 'CA' as CountryCode, name: 'Canada', flag: '🇨🇦', prefix: '+1' },
  { code: 'AU' as CountryCode, name: 'Australia', flag: '🇦🇺', prefix: '+61' },
  { code: 'BR' as CountryCode, name: 'Brazil', flag: '🇧🇷', prefix: '+55' }
];

export const PersonalInfo: FC<PersonalInfoProps> = ({ formData, onUpdate, onNext }) => {
  const {
    isVerifying,
    isVerified,
    showVerificationInput,
    error,
    sendVerificationCode,
    verifyCode,
  } = useMFAVerification();

  const handlePhoneChange = (value: string) => {
    onUpdate({ ...formData, phone: value });
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
    if (countryConfig.validate(formData.phone)) {
      sendVerificationCode(
        `${formData.country.prefix}${formData.phone}`,
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
      formData.phone.trim() !== '' &&
      formData.zipCode.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.street.trim() !== '' &&
      isVerified
    );
  }, [formData, isVerified]);

  const renderRequiredIndicator = (fieldName: keyof typeof formData) => {
    if (fieldName !== 'additional') {
      return <span className="text-red-500 ml-1">*</span>;
    }
    return null;
  };

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
          <input
            type="email"
            className="input-base"
            value={formData.email}
            onChange={(e) => onUpdate({ ...formData, email: e.target.value })}
            placeholder="john.doe@example.com"
            required
          />
        </div>

        {/* Telefone */}
        <div className="form-group mb-6">
          <label className="block text-sm font-medium text-primary mb-2">
            Phone Number {renderRequiredIndicator('phone')}
            {isVerified && (
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
                onUpdate({ ...formData, country, phone: '' });
              }}
              disabled={isVerified}
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
                className={`input-base ${isVerified ? 'bg-gray-50' : ''}`}
                placeholder={COUNTRY_CONFIGS[formData.country.code as CountryCode].example}
                disabled={isVerified}
                required
              />
              {!isVerified && (
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
          {!isVerified && formData.phone && !isPhoneValid() && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Please enter a valid phone number
            </p>
          )}
        </div>

        {/* Código de Verificação */}
        {showVerificationInput && !isVerified && (
          <VerificationBox
            onVerify={(code) => verifyCode(code, formData.email)}
            onResend={handleVerify}
            isVerifying={isVerifying}
            error={error}
          />
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
            ? 'bg-accent text-white hover:bg-accent-hover' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Continue
      </button>
    </div>
  );
};

export default PersonalInfo;