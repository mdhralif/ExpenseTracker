import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { databaseService, ExpenseStats } from '../services/DatabaseService';
import { settingsService } from '../services/SettingsService';
import { getTheme } from '../utils/themes';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { expenses, settings } = useApp();
  const theme = getTheme(settings.theme);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStats();
  }, [expenses]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const expenseStats = await databaseService.getExpenseStats();
      setStats(expenseStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return settingsService.formatAmount(amount, settings.currency);
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      Food: '#FF6B6B',
      Transportation: '#4ECDC4',
      Entertainment: '#45B7D1',
      Shopping: '#96CEB4',
      Bills: '#FFEAA7',
      Healthcare: '#DDA0DD',
      Education: '#98D8C8',
      Other: '#F7DC6F',
    };
    return colorMap[category] || '#F7DC6F';
  };

  const getTopCategories = () => {
    if (!stats) return [];
    
    return Object.entries(stats.categorySums)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getRecentTrends = () => {
    if (!stats) return [];
    
    return stats.monthlyData.slice(0, 6);
  };

  const calculatePercentage = (amount: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading statistics...</Text>
      </View>
    );
  }

  if (!stats || stats.totalExpenses === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <AntDesign name="piechart" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Data Available</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Add some expenses to see your statistics
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}></Text>

        {/* Total Overview */}
        <View style={[styles.overviewCard, { 
          backgroundColor: theme.accent,
          borderColor: theme.border,
          shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <Text style={[styles.cardTitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>Total Spending</Text>
          <Text style={[styles.totalAmount, { color: 'white' }]}>{formatAmount(stats.totalExpenses)}</Text>
          <Text style={[styles.totalCount, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Category Breakdown */}
        <View style={[styles.card, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Spending by Category</Text>
          {getTopCategories().map(([category, amount], index) => {
            const percentage = calculatePercentage(amount, stats.totalExpenses);
            return (
              <View key={category} style={[styles.categoryItem, { borderBottomColor: theme.border }]}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(category) }
                    ]}
                  />
                  <Text style={[styles.categoryName, { color: theme.text }]}>{category}</Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>{formatAmount(amount)}</Text>
                  <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Monthly Trends */}
        <View style={[styles.card, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Recent Months</Text>
          {getRecentTrends().map((monthData, index) => {
            const monthName = new Date(monthData.month + '-01').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long'
            });
            const maxAmount = Math.max(...stats.monthlyData.map(m => m.total));
            const percentage = calculatePercentage(monthData.total, maxAmount);
            
            return (
              <View key={monthData.month} style={styles.monthItem}>
                <View style={styles.monthInfo}>
                  <Text style={[styles.monthName, { color: theme.text }]}>{monthName}</Text>
                  <Text style={[styles.monthAmount, { color: theme.accent }]}>{formatAmount(monthData.total)}</Text>
                </View>
                <View style={[styles.monthBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.monthBarFill,
                      { width: `${percentage}%`, backgroundColor: theme.accent }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={[styles.quickStatCard, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <AntDesign name="calculator" size={24} color={theme.accent} />
            <Text style={[styles.quickStatValue, { color: theme.text }]}>
              {formatAmount(stats.totalExpenses / expenses.length)}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Average per Expense</Text>
          </View>

          <View style={[styles.quickStatCard, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <AntDesign name="tags" size={24} color="#FF6B6B" />
            <Text style={[styles.quickStatValue, { color: theme.text }]}>
              {Object.keys(stats.categorySums).length}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Categories Used</Text>
          </View>
        </View>

        {/* Top Category */}
        {getTopCategories().length > 0 && (
          <View style={[styles.card, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Top Spending Category</Text>
            <View style={styles.topCategoryContainer}>
              <View
                style={[
                  styles.topCategoryIcon,
                  { backgroundColor: getCategoryColor(getTopCategories()[0][0]) }
                ]}
              >
                <AntDesign name="star" size={24} color="white" />
              </View>
              <View style={styles.topCategoryInfo}>
                <Text style={[styles.topCategoryName, { color: theme.text }]}>{getTopCategories()[0][0]}</Text>
                <Text style={[styles.topCategoryAmount, { color: theme.accent }]}>
                  {formatAmount(getTopCategories()[0][1])}
                </Text>
                <Text style={[styles.topCategoryPercentage, { color: theme.textSecondary }]}>
                  {calculatePercentage(getTopCategories()[0][1], stats.totalExpenses)}% of total spending
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  overviewCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 14,
  },
  monthItem: {
    marginBottom: 16,
  },
  monthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthName: {
    fontSize: 16,
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  monthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 0.48,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  quickStatLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  topCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCategoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topCategoryInfo: {
    flex: 1,
  },
  topCategoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topCategoryAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  topCategoryPercentage: {
    fontSize: 14,
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
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
