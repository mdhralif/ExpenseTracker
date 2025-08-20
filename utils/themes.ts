export interface Theme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  cardBackground: string;
  modalOverlay: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  inputBackground: string;
  inputBorder: string;
}

export const lightTheme: Theme = {
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#007AFF',
  border: '#e0e0e0',
  cardBackground: '#ffffff',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  accent: '#5856d6',
  success: '#34c759',
  warning: '#ff9500',
  error: '#ff3b30',
  inputBackground: '#ffffff',
  inputBorder: '#d1d1d6',
};

export const darkTheme: Theme = {
  background: '#0d1117',        // Deep dark blue-gray (GitHub dark)
  surface: '#161b22',           // Slightly lighter surface
  text: '#f0f6fc',              // Soft white for primary text
  textSecondary: '#7d8590',     // Muted gray for secondary text
  primary: '#58a6ff',           // Professional blue accent
  border: '#30363d',            // Subtle borders
  cardBackground: '#21262d',    // Card background slightly different from surface
  modalOverlay: 'rgba(1, 4, 9, 0.8)', // Dark blue overlay
  accent: '#a5a5f7',            // Soft purple accent
  success: '#238636',           // Dark mode green
  warning: '#d29922',           // Dark mode orange
  error: '#f85149',             // Dark mode red
  inputBackground: '#0d1117',   // Input background matches main background
  inputBorder: '#30363d',       // Subtle input borders
};

export const getTheme = (themeType: 'light' | 'dark'): Theme => {
  return themeType === 'dark' ? darkTheme : lightTheme;
};
