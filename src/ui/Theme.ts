export const Colors = {
  // Bolivia flag palette + Andean accents
  primary: '#FFD400', // amarillo vibrante (bandera)
  secondary: '#007A33', // verde bandera (alto contraste sobre claros)
  success: '#22C55E',
  warning: '#FF7F00', // naranja festivo
  danger: '#DC143C', // rojo bandera
  accentBlue: '#0F47AF',
  accentPurple: '#6A0DAD',

  // Surfaces
  bg: '#E9F5FF', // fondo claro (mejor contraste)
  surface: '#FFFFFF', // tarjetas
  surfaceAlt: '#F6FAFF',
  border: '#C8D9F2',

  // Text
  text: '#0F172A',
  textMuted: '#475569',
  textOnPrimary: '#1F1300',

  // Accessibility helpers
  focus: '#1D4ED8',
  outline: '#94A3B8',
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
};

export const Typography = {
  title: { fontSize: 28, fontWeight: '900' as const, color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textMuted },
  label: { fontSize: 14, color: Colors.textMuted },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};
