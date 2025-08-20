import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AntDesign } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Expense } from '../services/DatabaseService';
import { CATEGORIES } from '../services/SettingsService';
import { getTheme } from '../utils/themes';

const EditExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateExpense, settings } = useApp();
  const theme = getTheme(settings.theme);
  
  const { expense } = route.params as { expense: Expense };

  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(new Date(expense.date));
  const [description, setDescription] = useState(expense.description || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid positive amount';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (date > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showCategoryPicker = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
    setShowCustomInput(false);
    setCustomCategory('');
    // Clear category error if it exists
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      handleCategorySelect(customCategory.trim());
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const updatedExpense = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        description: description.trim(),
      };

      if (expense.id) {
        await updateExpense(expense.id, updatedExpense);
        Alert.alert('Success', 'Expense updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}>Edit Expense</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
          <TextInput
            style={[
              styles.input, 
              errors.title && styles.inputError,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text
              }
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter expense title"
            placeholderTextColor={theme.textSecondary}
          />
          {errors.title && <Text style={[styles.errorText, { color: theme.error }]}>{errors.title}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Amount ({settings.currency}) *</Text>
          <TextInput
            style={[
              styles.input, 
              errors.amount && styles.inputError,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text
              }
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
          {errors.amount && <Text style={[styles.errorText, { color: theme.error }]}>{errors.amount}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Category *</Text>
          <TouchableOpacity
            style={[
              styles.categorySelector, 
              { 
                backgroundColor: theme.inputBackground, 
                borderColor: theme.inputBorder 
              },
              errors.category && styles.inputError
            ]}
            onPress={showCategoryPicker}
          >
            <Text style={[styles.categorySelectorText, { color: theme.text }]}>{category}</Text>
            <AntDesign name="down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          {errors.category && <Text style={[styles.errorText, { color: theme.error }]}>{errors.category}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
          <TouchableOpacity
            style={[
              styles.dateButton, 
              { 
                backgroundColor: theme.inputBackground, 
                borderColor: theme.inputBorder 
              },
              errors.date && styles.inputError
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(date)}</Text>
            <AntDesign name="calendar" size={20} color={theme.accent} />
          </TouchableOpacity>
          {errors.date && <Text style={[styles.errorText, { color: theme.error }]}>{errors.date}</Text>}
        </View>

        {showDatePicker && Platform.OS === 'ios' && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={[styles.datePickerModal, { backgroundColor: theme.modalOverlay }]}>
              <View style={[styles.datePickerContainer, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.datePickerHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Date</Text>
                  <TouchableOpacity
                    style={[styles.datePickerDone, { backgroundColor: theme.accent }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  textColor={theme.accent}
                />
              </View>
            </View>
          </Modal>
        )}
        
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="date"
            display="calendar"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[
              styles.input, 
              styles.textArea,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text
              }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.cancelButton,
              { 
                backgroundColor: theme.cardBackground, 
                borderColor: theme.border 
              }
            ]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, { backgroundColor: theme.accent }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <AntDesign name="save" size={16} color="white" />
                <Text style={styles.submitButtonText}>Update</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Modal */}
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
                        { 
                          backgroundColor: category === item ? theme.accent + '20' : 'transparent',
                          borderBottomColor: theme.border
                        }
                      ]}
                      onPress={() => handleCategorySelect(item)}
                    >
                      <Text style={[
                        styles.categoryText,
                        { color: category === item ? theme.accent : theme.text }
                      ]}>
                        {item}
                      </Text>
                      {category === item && (
                        <AntDesign name="check" size={20} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={[styles.customCategoryButton, { borderTopColor: theme.border }]}
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
                  contentContainerStyle={styles.customInputContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
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
                    returnKeyType="done"
                    onSubmitEditing={handleCustomCategorySubmit}
                  />
                  <View style={styles.customInputButtons}>
                    <TouchableOpacity
                      style={[
                        styles.cancelModalButton,
                        { 
                          backgroundColor: theme.cardBackground, 
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomCategory('');
                      }}
                    >
                      <Text style={[styles.cancelModalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
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
                </ScrollView>
              </KeyboardAvoidingView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    // backgroundColor handled by theme
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Category selector styles
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  categorySelectorText: {
    fontSize: 16,
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
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
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  customCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  customInputContainer: {
    padding: 20,
    minHeight: 200,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  cancelModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelModalButtonText: {
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
  // Date picker modal styles
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerDone: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datePickerDoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditExpenseScreen;
