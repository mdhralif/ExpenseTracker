import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AntDesign from '@expo/vector-icons/AntDesign';

import { AppProvider, useApp } from './context/AppContext';
import { getTheme } from './utils/themes';
import ExpensesScreen from './screens/ExpensesScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import StatsScreen from './screens/StatsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ExpenseDetailsScreen from './screens/ExpenseDetailsScreen';
import EditExpenseScreen from './screens/EditExpenseScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Expenses
function ExpensesStack() {
  const { settings } = useApp();
  const theme = getTheme(settings.theme);
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          color: theme.text,
        },
      }}
    >
      <Stack.Screen 
        name="ExpensesList" 
        component={ExpensesScreen} 
      />
      <Stack.Screen 
        name="ExpenseDetails" 
        component={ExpenseDetailsScreen} 
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="EditExpense" 
        component={EditExpenseScreen} 
        options={{ 
          headerShown: true, 
          title: '',
          headerStyle: {
            backgroundColor: theme.cardBackground,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
  const { settings } = useApp();
  const theme = getTheme(settings.theme);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof AntDesign.glyphMap;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Add') {
            iconName = 'plus';
          } else if (route.name === 'Stats') {
            iconName = 'barschart';
          } else if (route.name === 'Settings') {
            iconName = 'setting';
          } else {
            iconName = 'home';
          }

          return <AntDesign name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={ExpensesStack} />
      <Tab.Screen name="Add" component={AddExpenseScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <TabNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AppProvider>
  );
}
