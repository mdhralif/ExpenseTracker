import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { databaseService, Expense } from '../services/DatabaseService';
import { settingsService, AppSettings } from '../services/SettingsService';

interface AppContextType {
  expenses: Expense[];
  settings: AppSettings;
  loading: boolean;
  refreshExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  updateExpense: (id: number, expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  searchExpenses: (query: string) => Promise<Expense[]>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
  logout: () => void;
  resetDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'USD',
    defaultCategory: 'Other',
    theme: 'light',
    biometricEnabled: false,
    pinEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Initialize database
      await databaseService.initializeDatabase();
      
      // Load settings
      const appSettings = await settingsService.getSettings();
      setSettings(appSettings);
      
      // Check authentication requirements
      if (appSettings.pinEnabled || appSettings.biometricEnabled) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        // Load expenses only if authenticated
        await loadExpenses();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const expenseList = await databaseService.getAllExpenses();
      setExpenses(expenseList);
    } catch (error) {
      console.error('Error loading expenses:', error);
      // If there's a schema error, try to reset the database
      if (error instanceof Error && error.message.includes('no such column: created_at')) {
        console.log('Database schema issue detected, attempting to reset...');
        try {
          await databaseService.resetDatabase();
          const expenseList = await databaseService.getAllExpenses();
          setExpenses(expenseList);
          console.log('Database reset successfully');
        } catch (resetError) {
          console.error('Error resetting database:', resetError);
        }
      }
    }
  };

  const refreshExpenses = async () => {
    await loadExpenses();
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    try {
      await databaseService.addExpense(expense);
      await refreshExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id: number, expense: Omit<Expense, 'id' | 'created_at'>) => {
    try {
      await databaseService.updateExpense(id, expense);
      await refreshExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await databaseService.deleteExpense(id);
      await refreshExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const searchExpenses = async (query: string): Promise<Expense[]> => {
    try {
      return await databaseService.searchExpenses(query);
    } catch (error) {
      console.error('Error searching expenses:', error);
      return [];
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await settingsService.updateSettings(newSettings);
      const updatedSettings = await settingsService.getSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const authenticate = async (): Promise<boolean> => {
    // This would normally handle PIN/biometric authentication
    // For demo purposes, we'll just set authenticated to true
    setIsAuthenticated(true);
    await loadExpenses();
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setExpenses([]);
  };

  const resetDatabase = async () => {
    try {
      await databaseService.resetDatabase();
      await refreshExpenses();
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    expenses,
    settings,
    loading,
    refreshExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    searchExpenses,
    updateSettings,
    isAuthenticated,
    authenticate,
    logout,
    resetDatabase,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
