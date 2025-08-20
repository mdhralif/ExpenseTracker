import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface AppSettings {
  currency: string;
  defaultCategory: string;
  theme: 'light' | 'dark';
  biometricEnabled: boolean;
  pinEnabled: boolean;
}

export const CATEGORIES = [
  'Food & Dining',
  'Groceries', 
  'Transportation',
  'Gas & Fuel',
  'Entertainment',
  'Movies & Shows',
  'Shopping',
  'Clothing',
  'Electronics',
  'Bills & Utilities',
  'Rent',
  'Internet & Phone',
  'Healthcare',
  'Insurance',
  'Education',
  'Books',
  'Travel',
  'Hotels',
  'Sports & Fitness',
  'Beauty & Personal Care',
  'Home & Garden',
  'Gifts & Donations',
  'Business',
  'Taxes',
  'Investments',
  'Other'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

class SettingsService {
  private readonly SETTINGS_KEY = 'app_settings';
  private readonly PIN_KEY = 'user_pin';
  
  private defaultSettings: AppSettings = {
    currency: 'USD',
    defaultCategory: 'Other',
    theme: 'light',
    biometricEnabled: false,
    pinEnabled: false,
  };

  async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        return { ...this.defaultSettings, ...settings };
      }
      return this.defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async setCurrency(currency: string): Promise<void> {
    await this.updateSettings({ currency });
  }

  async setDefaultCategory(category: string): Promise<void> {
    await this.updateSettings({ defaultCategory: category });
  }

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.updateSettings({ theme });
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await this.updateSettings({ biometricEnabled: enabled });
      if (!enabled) {
        // Clear biometric data if disabled
        await SecureStore.deleteItemAsync('biometric_enabled');
      } else {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
      }
    } catch (error) {
      console.error('Error setting biometric preference:', error);
      throw error;
    }
  }

  async setPinEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ pinEnabled: enabled });
    if (!enabled) {
      await this.clearPin();
    }
  }

  async setPin(pin: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.PIN_KEY, pin);
      await this.setPinEnabled(true);
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw error;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const storedPin = await SecureStore.getItemAsync(this.PIN_KEY);
      return storedPin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  async clearPin(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.PIN_KEY);
    } catch (error) {
      console.error('Error clearing PIN:', error);
    }
  }

  async hasPin(): Promise<boolean> {
    try {
      const pin = await SecureStore.getItemAsync(this.PIN_KEY);
      return pin !== null;
    } catch (error) {
      return false;
    }
  }

  async clearAllSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SETTINGS_KEY);
      await this.clearPin();
      await SecureStore.deleteItemAsync('biometric_enabled');
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
  }

  getCurrencySymbol(currencyCode: string): string {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
  }

  formatAmount(amount: number, currencyCode: string): string {
    const symbol = this.getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export const settingsService = new SettingsService();
