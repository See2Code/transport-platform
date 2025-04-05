interface Country {
  code: string;
  name: string;
  prefix: string;
}

export const countries: Country[] = [
  { code: 'SK', name: 'Slovensko', prefix: '+421' },
  { code: 'CZ', name: 'Česká republika', prefix: '+420' },
  { code: 'HU', name: 'Maďarsko', prefix: '+36' },
  { code: 'PL', name: 'Poľsko', prefix: '+48' },
  { code: 'AT', name: 'Rakúsko', prefix: '+43' },
  { code: 'DE', name: 'Nemecko', prefix: '+49' },
  { code: 'IT', name: 'Taliansko', prefix: '+39' },
  { code: 'FR', name: 'Francúzsko', prefix: '+33' },
  { code: 'ES', name: 'Španielsko', prefix: '+34' },
  { code: 'PT', name: 'Portugalsko', prefix: '+351' },
  { code: 'BE', name: 'Belgicko', prefix: '+32' },
  { code: 'NL', name: 'Holandsko', prefix: '+31' },
  { code: 'LU', name: 'Luxembursko', prefix: '+352' },
  { code: 'GB', name: 'Veľká Británia', prefix: '+44' },
  { code: 'IE', name: 'Írsko', prefix: '+353' },
  { code: 'DK', name: 'Dánsko', prefix: '+45' },
  { code: 'SE', name: 'Švédsko', prefix: '+46' },
  { code: 'FI', name: 'Fínsko', prefix: '+358' },
  { code: 'EE', name: 'Estónsko', prefix: '+372' },
  { code: 'LV', name: 'Lotyšsko', prefix: '+371' },
  { code: 'LT', name: 'Litva', prefix: '+370' },
  { code: 'RO', name: 'Rumunsko', prefix: '+40' },
  { code: 'BG', name: 'Bulharsko', prefix: '+359' },
  { code: 'HR', name: 'Chorvátsko', prefix: '+385' },
  { code: 'SI', name: 'Slovinsko', prefix: '+386' },
  { code: 'GR', name: 'Grécko', prefix: '+30' },
  { code: 'MT', name: 'Malta', prefix: '+356' },
  { code: 'CY', name: 'Cyprus', prefix: '+357' },
  { code: 'UA', name: 'Ukrajina', prefix: '+380' },
  { code: 'RS', name: 'Srbsko', prefix: '+381' },
  { code: 'ME', name: 'Čierna Hora', prefix: '+382' },
  { code: 'AL', name: 'Albánsko', prefix: '+355' },
  { code: 'MK', name: 'Severné Macedónsko', prefix: '+389' },
  { code: 'BA', name: 'Bosna a Hercegovina', prefix: '+387' },
  { code: 'CH', name: 'Švajčiarsko', prefix: '+41' },
  { code: 'NO', name: 'Nórsko', prefix: '+47' },
  { code: 'IS', name: 'Island', prefix: '+354' },
  { code: 'TR', name: 'Turecko', prefix: '+90' },
  { code: 'BY', name: 'Bielorusko', prefix: '+375' },
  { code: 'MD', name: 'Moldavsko', prefix: '+373' }
];

export type { Country }; 