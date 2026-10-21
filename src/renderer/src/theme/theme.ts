// Centralized Theme and Color Token Manager

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemeTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryDark: string;
  primaryText: string;
  primaryBorder: string;
  primaryAccent: string;
  shades: ColorShades;
}

// Convert Hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate tonal shades
export function generateShades(baseHex: string): ColorShades {
  const { h, s } = hexToHsl(baseHex);
  // Adaptive saturation boost for lower lightness
  const sat = Math.max(s, 20);

  return {
    50: hslToHex(h, Math.round(sat * 0.4), 98),
    100: hslToHex(h, Math.round(sat * 0.6), 95),
    200: hslToHex(h, sat, 92),
    300: hslToHex(h, sat, 82),
    400: hslToHex(h, sat, 70),
    500: hslToHex(h, sat, 56),
    600: hslToHex(h, sat, 44),
    700: hslToHex(h, sat, 34),
    800: hslToHex(h, sat, 24),
    900: hslToHex(h, sat, 15),
    950: hslToHex(h, sat, 8),
  };
}

export function createThemeTokens(primaryHex: string): ThemeTokens {
  const normalizedHex = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`;
  const shades = generateShades(normalizedHex);
  const { h, s, l } = hexToHsl(normalizedHex);

  const isLight = l > 65;
  const primaryText = isLight ? shades[900] : '#FFFFFF';
  const primaryHover = isLight ? shades[300] : shades[600];
  const primaryActive = isLight ? shades[400] : shades[700];
  const primaryBorder = isLight ? shades[300] : shades[400];
  const primaryDark = shades[800];
  const primaryLight = shades[100];
  const primaryAccent = hslToHex(h, Math.min(100, Math.max(50, s * 1.5)), 42);

  return {
    primary: normalizedHex,
    primaryHover,
    primaryActive,
    primaryLight,
    primaryDark,
    primaryText,
    primaryBorder,
    primaryAccent,
    shades,
  };
}

// Apply CSS variables to root
export function applyTheme(primaryHex: string = '#F5EFE1'): ThemeTokens {
  const tokens = createThemeTokens(primaryHex);
  const root = document.documentElement;

  root.style.setProperty('--color-primary', tokens.primary);
  root.style.setProperty('--color-primary-hover', tokens.primaryHover);
  root.style.setProperty('--color-primary-active', tokens.primaryActive);
  root.style.setProperty('--color-primary-light', tokens.primaryLight);
  root.style.setProperty('--color-primary-dark', tokens.primaryDark);
  root.style.setProperty('--color-primary-text', tokens.primaryText);
  root.style.setProperty('--color-primary-border', tokens.primaryBorder);
  root.style.setProperty('--color-primary-accent', tokens.primaryAccent);

  // Surface and Neutral tokens for light mode
  root.style.setProperty('--color-surface', '#FFFFFF');
  root.style.setProperty('--color-surface-subtle', '#FBFBF9');
  root.style.setProperty('--color-surface-card', '#FFFFFF');
  root.style.setProperty('--color-border', '#E5E7EB');
  root.style.setProperty('--color-border-subtle', '#F0F0EE');

  // Inject numeric shades
  Object.entries(tokens.shades).forEach(([key, value]) => {
    root.style.setProperty(`--color-primary-${key}`, value);
  });

  return tokens;
}
