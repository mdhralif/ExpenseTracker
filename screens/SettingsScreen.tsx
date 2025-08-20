import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { CURRENCIES, CATEGORIES, settingsService } from '../services/SettingsService';
import { databaseService } from '../services/DatabaseService';
import { getTheme } from '../utils/themes';

export default function SettingsScreen() {
  const { settings, updateSettings, expenses } = useApp();
  const theme = getTheme(settings.theme);
  const [isExporting, setIsExporting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCurrencyChange = async (currency: string) => {
    try {
      await updateSettings({ currency });
      Alert.alert('Success', 'Currency updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency');
    }
  };

  const showCurrencyPicker = () => {
    const options = CURRENCIES.map(currency => `${currency.symbol} ${currency.code}`);
    const cancelButtonIndex = options.length;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex,
          title: 'Select Currency',
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            const selectedCurrency = CURRENCIES[buttonIndex];
            handleCurrencyChange(selectedCurrency.code);
          }
        }
      );
    } else {
      Alert.alert(
        'Select Currency',
        '',
        [
          ...CURRENCIES.map((currency, index) => ({
            text: `${currency.symbol} ${currency.code}`,
            onPress: () => handleCurrencyChange(currency.code),
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleDefaultCategoryChange = async (category: string) => {
    try {
      await updateSettings({ defaultCategory: category });
      Alert.alert('Success', 'Default category updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update default category');
    }
  };

  const showCategoryPicker = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (category: string) => {
    setShowCategoryModal(false);
    setShowCustomInput(false);
    setCustomCategory('');
    await handleDefaultCategoryChange(category);
  };

  const handleCustomCategorySubmit = async () => {
    if (customCategory.trim()) {
      await handleCategorySelect(customCategory.trim());
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
            <TouchableOpacity 
              onPress={() => setShowCategoryModal(false)}
              style={styles.closeButton}
            >
              <AntDesign name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {!showCustomInput ? (
            <>
              <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      { backgroundColor: theme.inputBackground },
                      settings.defaultCategory === item && [
                        styles.selectedCategoryItem, 
                        { backgroundColor: theme.accent + '20', borderColor: theme.accent }
                      ]
                    ]}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: theme.text },
                      settings.defaultCategory === item && [
                        styles.selectedCategoryText, 
                        { color: theme.accent }
                      ]
                    ]}>
                      {item}
                    </Text>
                    {settings.defaultCategory === item && (
                      <AntDesign name="check" size={20} color={theme.accent} />
                    )}
                  </TouchableOpacity>
                )}
              />
              
              <TouchableOpacity
                style={[styles.customCategoryButton, { borderColor: theme.accent }]}
                onPress={() => setShowCustomInput(true)}
              >
                <AntDesign name="plus" size={20} color={theme.accent} />
                <Text style={[styles.customCategoryText, { color: theme.accent }]}>Add Custom Category</Text>
              </TouchableOpacity>
            </>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.customInputContainer}>
                  <Text style={[styles.customInputLabel, { color: theme.text }]}>Enter Custom Category:</Text>
                  <TextInput
                    style={[
                      styles.customTextInput,
                      { 
                        backgroundColor: theme.inputBackground, 
                        borderColor: theme.inputBorder,
                        color: theme.text
                      }
                    ]}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    placeholder="e.g., Pet Care, Hobbies"
                    placeholderTextColor={theme.textSecondary}
                    autoFocus={true}
                    maxLength={30}
                  />
                  <View style={styles.customInputButtons}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: theme.border }]}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomCategory('');
                      }}
                    >
                      <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: theme.accent },
                        !customCategory.trim() && styles.addButtonDisabled
                      ]}
                      onPress={handleCustomCategorySubmit}
                      disabled={!customCategory.trim()}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </View>
    </Modal>
  );

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    try {
      console.log('=== THEME CHANGE DEBUG ===');
      console.log('1. Current theme:', settings.theme);
      console.log('2. Attempting to change theme to:', theme);
      
      await updateSettings({ theme });
      
      console.log('3. Theme update call completed');
      console.log('4. New settings.theme should be:', theme);
      console.log('==========================');
      
      Alert.alert('Success', `${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied successfully!`);
    } catch (error) {
      console.error('Error updating theme:', error);
      Alert.alert('Error', 'Failed to update theme. Please try again.');
    }
  };

  const showThemePicker = () => {
    const themes = [
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' }
    ];
    const cancelButtonIndex = themes.length;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...themes.map(t => t.label), 'Cancel'],
          cancelButtonIndex,
          title: 'Select Theme',
        },
        (buttonIndex) => {
          if (buttonIndex < themes.length) {
            handleThemeChange(themes[buttonIndex].value as 'light' | 'dark');
          }
        }
      );
    } else {
      Alert.alert(
        'Select Theme',
        '',
        [
          ...themes.map((theme) => ({
            text: theme.label,
            onPress: () => handleThemeChange(theme.value as 'light' | 'dark'),
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      await settingsService.setBiometricEnabled(enabled);
      await updateSettings({ biometricEnabled: enabled });
      Alert.alert(
        'Success',
        `Biometric authentication ${enabled ? 'enabled' : 'disabled'}!`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handlePinToggle = async (enabled: boolean) => {
    if (enabled) {
      // In a real app, you'd show a PIN setup screen
      Alert.alert(
        'Set PIN',
        'PIN protection feature would show a PIN setup screen here.',
        [
          { text: 'Cancel' },
          {
            text: 'Set PIN',
            onPress: async () => {
              try {
                await settingsService.setPin('1234'); // Demo PIN
                await updateSettings({ pinEnabled: true });
                Alert.alert('Success', 'PIN protection enabled!');
              } catch (error) {
                Alert.alert('Error', 'Failed to set PIN');
              }
            },
          },
        ]
      );
    } else {
      try {
        await settingsService.setPinEnabled(false);
        await updateSettings({ pinEnabled: false });
        Alert.alert('Success', 'PIN protection disabled!');
      } catch (error) {
        Alert.alert('Error', 'Failed to disable PIN');
      }
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      if (expenses.length === 0) {
        Alert.alert('No Data', 'No expenses to export');
        return;
      }

      // Create CSV content
      const csvHeader = 'Title,Amount,Category,Date,Description\n';
      const csvRows = expenses
        .map(expense => 
          `"${expense.title}",${expense.amount},"${expense.category}","${expense.date}","${expense.description || ''}"`
        )
        .join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Share the data
      await Share.share({
        message: csvContent,
        title: 'Expense Data Export',
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your expenses. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: confirmClearData,
        },
      ]
    );
  };

  const confirmClearData = async () => {
    try {
      await databaseService.clearAllData();
      Alert.alert('Success', 'All data has been cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showChevron = true,
    isLast = false
  }: {
    icon: keyof typeof AntDesign.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow, 
        { borderBottomColor: theme.border },
        isLast && { borderBottomWidth: 0 }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
          <AntDesign name={icon} size={20} color={theme.accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && onPress && (
          <AntDesign name="right" size={16} color={theme.textSecondary} style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}></Text>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App Preferences</Text>
          
          <View style={[styles.card, { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <SettingRow
              icon="wallet"
              title="Currency"
              subtitle={`Current: ${settings.currency}`}
              onPress={showCurrencyPicker}
              rightComponent={
                <View style={[styles.valueContainer, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.valueText, { color: theme.textSecondary }]}>
                    {CURRENCIES.find(c => c.code === settings.currency)?.symbol} {settings.currency}
                  </Text>
                </View>
              }
            />

            <SettingRow
              icon="tags"
              title="Default Category"
              subtitle={`Current: ${settings.defaultCategory}`}
              onPress={showCategoryPicker}
              rightComponent={
                <View style={[styles.valueContainer, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.valueText, { color: theme.textSecondary }]}>{settings.defaultCategory}</Text>
                </View>
              }
            />

            <SettingRow
              icon="bulb1"
              title="Theme"
              subtitle={`Current: ${settings.theme}`}
              onPress={showThemePicker}
              rightComponent={
                <View style={[styles.valueContainer, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.valueText, { color: theme.textSecondary }]}>
                    {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
                  </Text>
                </View>
              }
              isLast={true}
            />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Security</Text>
          
          <View style={[styles.card, { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <SettingRow
              icon="Safety"
              title="Biometric Authentication"
              subtitle="Use fingerprint or face ID to secure app"
              rightComponent={
                <Switch
                  value={settings.biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={settings.biometricEnabled ? '#fff' : '#f4f3f4'}
                />
              }
              showChevron={false}
            />

            <SettingRow
              icon="lock"
              title="PIN Protection"
              subtitle="Require PIN to access app"
              rightComponent={
                <Switch
                  value={settings.pinEnabled}
                  onValueChange={handlePinToggle}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={settings.pinEnabled ? '#fff' : '#f4f3f4'}
                />
              }
              showChevron={false}
              isLast={true}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
          
          <View style={[styles.card, { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <SettingRow
              icon="download"
              title="Export Data"
              subtitle="Export your expenses as CSV"
              onPress={handleExportData}
              rightComponent={
                isExporting && <ActivityIndicator size="small" color="#007AFF" />
              }
            />

            <SettingRow
              icon="delete"
              title="Clear All Data"
              subtitle="Permanently delete all expenses"
              onPress={handleClearAllData}
              isLast={true}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          
          <View style={[styles.card, { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border,
            shadowColor: settings.theme === 'dark' ? 'transparent' : '#000',
          }]}>
            <SettingRow
              icon="info"
              title="App Version"
              subtitle="1.0.0"
              showChevron={false}
            />

            <SettingRow
              icon="database"
              title="Total Expenses"
              subtitle={`${expenses.length} expenses stored`}
              showChevron={false}
            />

            <SettingRow
              icon="team"
              title="Developer"
              subtitle="MD H R ALIF"
              showChevron={false}
              isLast={true}
            />
          </View>
        </View>
      </View>
      
      {/* Category Selection Modal */}
      {renderCategoryModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  selectedCategoryItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    flex: 1,
  },
  selectedCategoryText: {
    fontWeight: '600',
  },
  customCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  customCategoryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  customInputContainer: {
    padding: 20,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  customInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});