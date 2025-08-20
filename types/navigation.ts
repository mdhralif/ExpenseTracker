import { StackNavigationProp } from '@react-navigation/stack';
import { Expense } from '../services/DatabaseService';

// Stack Navigator Type Definitions
export type ExpensesStackParamList = {
  ExpensesList: undefined;
  ExpenseDetails: { expenseId: number };
  EditExpense: { expense: Expense };
};

export type TabParamList = {
  Home: undefined;
  Add: undefined;
  Stats: undefined;
  Settings: undefined;
};

// Navigation Props
export type ExpensesScreenNavigationProp = StackNavigationProp<
  ExpensesStackParamList,
  'ExpensesList'
>;

export type ExpenseDetailsScreenNavigationProp = StackNavigationProp<
  ExpensesStackParamList,
  'ExpenseDetails'
>;

export type EditExpenseScreenNavigationProp = StackNavigationProp<
  ExpensesStackParamList,
  'EditExpense'
>;
