import { FC, useState, useEffect, useMemo } from 'react';
import { InfoIcon, EyeIcon, EyeOffIcon, AlertCircle, Check } from 'lucide-react';


interface AccountCreationProps {
  formData: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AccountCreation: FC<AccountCreationProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  

  const [validations, setValidations] = useState({
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false,
    hasMinLength: false,
    passwordsMatch: false
  });

  // Força o username a ser igual ao email
  useEffect(() => {
    onUpdate({ ...formData, username: formData.email });
  }, [formData.email]);

  const validatePassword = (password: string) => {
    const validationResults = {
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password),
      hasMinLength: password.length >= 8,
      passwordsMatch: password === formData.confirmPassword
    };
    setValidations(validationResults);
    return Object.values(validationResults).every(Boolean);
  };

  const handlePasswordChange = (password: string) => {
    onUpdate({ ...formData, password });
    validatePassword(password);
  };

  const handleConfirmPasswordChange = (confirmPassword: string) => {
    onUpdate({ ...formData, confirmPassword });
    setValidations(prev => ({
      ...prev,
      passwordsMatch: formData.password === confirmPassword
    }));
  };

  const isFormValid = useMemo(() => {
    return Object.values(validations).every(Boolean);
  }, [validations]);

  return (
    <div className="space-y-6 max-w-form mx-auto">
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-primary mb-2">Create Your Account</h2>
        <p className="text-gray-600 mb-8">
          Your passphrase must contain at least 8 characters, including an uppercase letter,
          a number, and a special character. For better security, consider using a complete phrase.
        </p>



        <div className="space-y-6">
          {/* Username (Email) - Read Only */}
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">Username</label>
            <div className="relative">
              <input
                type="text"
                value={formData.email}
                className="input-base bg-gray-50"
                readOnly
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <InfoIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Your email address will be your username
            </p>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="input-base pr-10"
                placeholder="Enter your passphrase"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className={`flex items-center text-sm ${validations.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.hasMinLength ? <Check className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                At least 8 characters
              </div>
              <div className={`flex items-center text-sm ${validations.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.hasUppercase ? <Check className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                One uppercase letter
              </div>
              <div className={`flex items-center text-sm ${validations.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.hasNumber ? <Check className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                One number
              </div>
              <div className={`flex items-center text-sm ${validations.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.hasSpecial ? <Check className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                One special character
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="block text-sm font-medium text-primary mb-2">
              Confirm Passphrase
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className="input-base pr-10"
                placeholder="Confirm your passphrase"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && (
              <div className={`flex items-center text-sm mt-2 ${validations.passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {validations.passwordsMatch ? <Check className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                {validations.passwordsMatch ? 'Passphrases match' : 'Passphrases do not match'}
              </div>
            )}
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
          onClick={onNext}
          disabled={!isFormValid}
          className={`flex-1 py-4 rounded-lg font-medium text-lg transition-colors
            ${isFormValid 
              ? 'bg-accent text-white hover:bg-accent-hover' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AccountCreation;