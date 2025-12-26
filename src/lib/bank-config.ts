// Mexican banks configuration with brand colors
export interface BankConfig {
  name: string;
  shortName: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const MEXICAN_BANKS: Record<string, BankConfig> = {
  'BBVA México': {
    name: 'BBVA México',
    shortName: 'BBVA',
    bgColor: 'bg-[#004481]',
    textColor: 'text-white',
    borderColor: 'border-[#004481]',
  },
  'Santander México': {
    name: 'Santander México',
    shortName: 'Santander',
    bgColor: 'bg-[#EC0000]',
    textColor: 'text-white',
    borderColor: 'border-[#EC0000]',
  },
  'Banorte': {
    name: 'Banorte',
    shortName: 'Banorte',
    bgColor: 'bg-[#E30613]',
    textColor: 'text-white',
    borderColor: 'border-[#E30613]',
  },
  'HSBC México': {
    name: 'HSBC México',
    shortName: 'HSBC',
    bgColor: 'bg-[#DB0011]',
    textColor: 'text-white',
    borderColor: 'border-[#DB0011]',
  },
  'Citibanamex': {
    name: 'Citibanamex',
    shortName: 'Banamex',
    bgColor: 'bg-[#1E3C70]',
    textColor: 'text-white',
    borderColor: 'border-[#1E3C70]',
  },
  'Scotiabank': {
    name: 'Scotiabank',
    shortName: 'Scotia',
    bgColor: 'bg-[#EC111A]',
    textColor: 'text-white',
    borderColor: 'border-[#EC111A]',
  },
  'Banco Azteca': {
    name: 'Banco Azteca',
    shortName: 'Azteca',
    bgColor: 'bg-[#00A651]',
    textColor: 'text-white',
    borderColor: 'border-[#00A651]',
  },
  'Banco Inbursa': {
    name: 'Banco Inbursa',
    shortName: 'Inbursa',
    bgColor: 'bg-[#003366]',
    textColor: 'text-white',
    borderColor: 'border-[#003366]',
  },
  'BanCoppel': {
    name: 'BanCoppel',
    shortName: 'Coppel',
    bgColor: 'bg-[#FFD100]',
    textColor: 'text-black',
    borderColor: 'border-[#FFD100]',
  },
  'Banregio': {
    name: 'Banregio',
    shortName: 'Banregio',
    bgColor: 'bg-[#FF6B00]',
    textColor: 'text-white',
    borderColor: 'border-[#FF6B00]',
  },
  'Afirme': {
    name: 'Afirme',
    shortName: 'Afirme',
    bgColor: 'bg-[#00529B]',
    textColor: 'text-white',
    borderColor: 'border-[#00529B]',
  },
  'Banco del Bajío': {
    name: 'Banco del Bajío',
    shortName: 'BajÍo',
    bgColor: 'bg-[#005A30]',
    textColor: 'text-white',
    borderColor: 'border-[#005A30]',
  },
  'Banco Autofin': {
    name: 'Banco Autofin',
    shortName: 'Autofin',
    bgColor: 'bg-[#1A1A1A]',
    textColor: 'text-white',
    borderColor: 'border-[#1A1A1A]',
  },
  'Compartamos Banco': {
    name: 'Compartamos Banco',
    shortName: 'Compartamos',
    bgColor: 'bg-[#00A19A]',
    textColor: 'text-white',
    borderColor: 'border-[#00A19A]',
  },
  'Hey Banco': {
    name: 'Hey Banco',
    shortName: 'Hey',
    bgColor: 'bg-[#FF6B00]',
    textColor: 'text-white',
    borderColor: 'border-[#FF6B00]',
  },
  'Nu México': {
    name: 'Nu México',
    shortName: 'Nu',
    bgColor: 'bg-[#820AD1]',
    textColor: 'text-white',
    borderColor: 'border-[#820AD1]',
  },
  'Klar': {
    name: 'Klar',
    shortName: 'Klar',
    bgColor: 'bg-[#00D4AA]',
    textColor: 'text-black',
    borderColor: 'border-[#00D4AA]',
  },
  'Stori': {
    name: 'Stori',
    shortName: 'Stori',
    bgColor: 'bg-[#00C2FF]',
    textColor: 'text-black',
    borderColor: 'border-[#00C2FF]',
  },
};

export const BANK_NAMES = Object.keys(MEXICAN_BANKS);

export const getBankConfig = (bankName: string | null | undefined): BankConfig | null => {
  if (!bankName) return null;
  return MEXICAN_BANKS[bankName] || null;
};

// Default config for unknown banks
export const getDefaultBankConfig = (bankName: string): BankConfig => ({
  name: bankName,
  shortName: bankName.split(' ')[0],
  bgColor: 'bg-muted',
  textColor: 'text-foreground',
  borderColor: 'border-border',
});
