import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Theme } from '@/constants/Theme';

interface MonthPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  minimumDate = new Date(new Date().getFullYear() - 20, 0),
  maximumDate = new Date(new Date().getFullYear() + 10, 11),
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    value?.getFullYear() ?? new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    value?.getMonth() ?? new Date().getMonth()
  );

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const generateYears = () => {
    const startYear = minimumDate.getFullYear();
    const endYear = maximumDate.getFullYear();
    const years = [];
    for (let i = endYear; i >= startYear; i--) {
      years.push(i);
    }
    return years;
  };

  const years = generateYears();

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onChange(newDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowPicker(true)}
      >
        <Text style={{ color: value ? Theme.black : Theme.textInput }}>
          {value
            ? value.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })
            : 'Select month and year'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Select Month and Year</Text>
            </View>

            <View style={styles.scrollContainer}>
              {/* Month Selector */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Month</Text>
                <ScrollView style={styles.scrollList}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.item,
                        selectedMonth === index && styles.selectedItem,
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          selectedMonth === index && styles.selectedItemText,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Selector */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Year</Text>
                <ScrollView style={styles.scrollList}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.item,
                        selectedYear === year && styles.selectedItem,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          selectedYear === year && styles.selectedItemText,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dateInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    backgroundColor: Theme.white,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: Theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surfaceGray,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.black,
    textAlign: 'center',
  },
  scrollContainer: {
    flexDirection: 'row',
    height: 300,
  },
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Theme.surfaceGray,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textInput,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surfaceGray,
  },
  scrollList: {
    flex: 1,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surfaceGray,
  },
  selectedItem: {
    backgroundColor: '#FFF5F3',
  },
  itemText: {
    fontSize: 16,
    color: Theme.black,
    textAlign: 'center',
  },
  selectedItemText: {
    fontWeight: '700',
    color: Theme.primaryGatherRed,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.surfaceGray,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Theme.surfaceGray,
  },
  confirmButton: {
    backgroundColor: Theme.primaryGatherRed,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.white,
  },
});

export default MonthPicker;
