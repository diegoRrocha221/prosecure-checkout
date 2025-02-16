export const COUNTRY_CONFIGS = {
  US: {
    mask: '+1 (000) 000-0000',
    format: (phone: string) => phone.replace(/\D/g, ''),
    validate: (phone: string) => phone.replace(/\D/g, '').length === 10,
    example: '(555) 555-5555'
  },
  CA: {
    mask: '+1 (000) 000-0000',
    format: (phone: string) => phone.replace(/\D/g, ''),
    validate: (phone: string) => phone.replace(/\D/g, '').length === 10,
    example: '(555) 555-5555'
  },
  AU: {
    mask: '+61 000 000 000',
    format: (phone: string) => phone.replace(/\D/g, ''),
    validate: (phone: string) => phone.replace(/\D/g, '').length === 9,
    example: '400 000 000'
  },
  BR: {
    mask: '+55 (00) 00000-0000',
    format: (phone: string) => phone.replace(/\D/g, ''),
    validate: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length === 11 || cleaned.length === 10;
    },
    example: '(11) 99999-9999'
  }
} as const;

export type CountryCode = keyof typeof COUNTRY_CONFIGS;