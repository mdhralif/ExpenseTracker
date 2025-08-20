import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useApp } from '../context/AppContext';
import { Expense } from '../services/DatabaseService';
import { settingsService } from '../services/SettingsService';
import { ExpensesScreenNavigationProp } from '../types/navigation';
import { getTheme } from '../utils/themes';

const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const { expenses, loading, refreshExpenses, deleteExpense, searchExpenses, settings } = useApp();
  const theme = getTheme(settings.theme);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredExpenses(expenses);
    }
  }, [expenses, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshExpenses();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchExpenses(searchQuery);
      setFilteredExpenses(results);
    } else {
      setFilteredExpenses(expenses);
    }
  };

  const handleExpensePress = (expense: Expense) => {
    if (expense.id) {
      navigation.navigate('ExpenseDetails', { expenseId: expense.id });
    }
  };

  const handleSwipeDelete = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (expense.id) {
              deleteExpense(expense.id);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return settingsService.formatAmount(amount, settings.currency);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: keyof typeof AntDesign.glyphMap } = {
      // Food & Dining
      'Food & Dining': 'apple1',
      'Groceries': 'shoppingcart',
      
      // Transportation
      'Transportation': 'car',
      'Gas & Fuel': 'car',
      
      // Entertainment
      'Entertainment': 'videocamera',
      'Movies & Shows': 'playcircleo',
      
      // Shopping
      'Shopping': 'shoppingcart',
      'Clothing': 'skin',
      'Electronics': 'mobile1',
      
      // Bills & Utilities
      'Bills & Utilities': 'filetext1',
      'Rent': 'home',
      'Internet & Phone': 'wifi',
      
      // Healthcare
      'Healthcare': 'medicinebox',
      'Insurance': 'Safety',
      
      // Education
      'Education': 'book',
      'Books': 'book',
      
      // Travel
      'Travel': 'earth',
      'Hotels': 'home',
      
      // Sports & Fitness
      'Sports & Fitness': 'Trophy',
      
      // Beauty & Personal Care
      'Beauty & Personal Care': 'heart',
      
      // Home & Garden
      'Home & Garden': 'home',
      
      // Gifts & Donations
      'Gifts & Donations': 'gift',
      
      // Business
      'Business': 'laptop',
      
      // Financial
      'Taxes': 'filetext1',
      'Investments': 'linechart',
      
      // Legacy categories (for backward compatibility)
      'Food': 'apple1',
      'Bills': 'filetext1',
      'Other': 'ellipsis1',
    };
    return iconMap[category] || 'ellipsis1';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      // Food & Dining
      'Food & Dining': '#FF6B6B',
      'Groceries': '#FF8E53',
      
      // Transportation
      'Transportation': '#4ECDC4',
      'Gas & Fuel': '#45B7D1',
      
      // Entertainment
      'Entertainment': '#45B7D1',
      'Movies & Shows': '#5D5FEF',
      
      // Shopping
      'Shopping': '#96CEB4',
      'Clothing': '#FECA57',
      'Electronics': '#5F27CD',
      
      // Bills & Utilities
      'Bills & Utilities': '#FFEAA7',
      'Rent': '#FD79A8',
      'Internet & Phone': '#00B894',
      
      // Healthcare
      'Healthcare': '#DDA0DD',
      'Insurance': '#A29BFE',
      
      // Education
      'Education': '#98D8C8',
      'Books': '#55A3FF',
      
      // Travel
      'Travel': '#FF7675',
      'Hotels': '#FDCB6E',
      
      // Sports & Fitness
      'Sports & Fitness': '#6C5CE7',
      
      // Beauty & Personal Care
      'Beauty & Personal Care': '#FD79A8',
      
      // Home & Garden
      'Home & Garden': '#00B894',
      
      // Gifts & Donations
      'Gifts & Donations': '#E17055',
      
      // Business
      'Business': '#636E72',
      
      // Financial
      'Taxes': '#2D3436',
      'Investments': '#00CEC9',
      
      // Legacy categories (for backward compatibility)
      'Food': '#FF6B6B',
      'Bills': '#FFEAA7',
      'Other': '#F7DC6F',
    };
    return colorMap[category] || '#F7DC6F';
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={[
        styles.expenseItem, 
        { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
        }
      ]}
      onPress={() => handleExpensePress(item)}
      onLongPress={() => handleSwipeDelete(item)}
    >
      <View style={styles.expenseContent}>
        <View style={[
          styles.categoryIcon, 
          { backgroundColor: getCategoryColor(item.category) + '20' }
        ]}>
          <AntDesign
            name={getCategoryIcon(item.category)}
            size={20}
            color={getCategoryColor(item.category)}
          />
        </View>
        
        <View style={styles.expenseDetails}>
          <Text style={[styles.expenseTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.expenseCategory, { color: theme.textSecondary }]}>{item.category}</Text>
          <Text style={[styles.expenseDate, { color: theme.textSecondary }]}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.expenseAmount}>
          <Text style={[styles.amountText, { color: theme.text }]}>{formatAmount(item.amount)}</Text>
          <AntDesign name="right" size={16} color={theme.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name="inbox" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Expenses Found</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery ? 'Try a different search term' : 'Add your first expense to get started'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
        }
      ]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Your Expenses</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <AntDesign name="search1" size={24} color={theme.accent} />
          </TouchableOpacity>
        </View>
        
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
            <TextInput
              style={[styles.searchInput, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search expenses..."
              placeholderTextColor={theme.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearch}
                onPress={() => setSearchQuery('')}
              >
                <AntDesign name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {filteredExpenses.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryText, { color: theme.accent }]}>
              Total: {formatAmount(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
            </Text>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderExpenseItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={filteredExpenses.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Constants.statusBarHeight + 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  clearSearch: {
    padding: 8,
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '600',
  },
  countText: {
    fontSize: 14,
  },
  expenseItem: {
    marginHorizontal: 6,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 14,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default ExpensesScreen;
