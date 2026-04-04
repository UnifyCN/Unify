import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import {
  CANADIAN_CITIES,
  CANADIAN_PROVINCES,
  getProvinceForCity,
} from '@/constants/LocationData';

interface LocationStepProps {
  selectedCity: string | null;
  selectedProvince: string | null;
  onCityChange: (city: string) => void;
  onProvinceChange: (province: string) => void;
  error?: string;
}

export default function LocationStep({
  selectedCity,
  selectedProvince,
  onCityChange,
  onProvinceChange,
  error,
}: LocationStepProps) {
  const [showCityModal, setShowCityModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');
  const [customCity, setCustomCity] = useState<string | null>(null);

  const isOtherCity = selectedCity && !CANADIAN_CITIES.includes(selectedCity);

  // Get province for selected city if it's a pre-defined city
  const autoFilledProvince = selectedCity
    ? getProvinceForCity(selectedCity)
    : null;
  const displayProvince = autoFilledProvince || selectedProvince;

  const filteredCities = selectedCity === 'other'
    ? ['other', ...CANADIAN_CITIES.filter(city =>
        city.toLowerCase().includes(citySearchQuery.toLowerCase())
      )]
    : CANADIAN_CITIES.filter(city =>
        city.toLowerCase().includes(citySearchQuery.toLowerCase())
      );

  const filteredProvinces = CANADIAN_PROVINCES.filter(province =>
    province.toLowerCase().includes(provinceSearchQuery.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    if (city === 'other') {
      onCityChange('other');
      setCustomCity('');
    } else {
      onCityChange(city);
      setCustomCity(null);
      // Auto-fill province if available
      const province = getProvinceForCity(city);
      if (province) {
        onProvinceChange(province);
      }
    }
    setShowCityModal(false);
    setCitySearchQuery('');
  };

  const handleCustomCityChange = (text: string) => {
    setCustomCity(text);
    if (text.trim()) {
      onCityChange(text.trim());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Where are you located in Canada?</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* City Dropdown */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.label}>City</Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            selectedCity && styles.dropdownActive,
            error && styles.dropdownError,
          ]}
          onPress={() => setShowCityModal(true)}
        >
          <Text
            style={[
              styles.dropdownText,
              !selectedCity && styles.placeholderText,
            ]}
          >
            {selectedCity === 'other'
              ? 'Other (specify below)'
              : selectedCity || 'Select a city'}
          </Text>
          <Feather name='chevron-down' size={20} color={Theme.textInput} />
        </TouchableOpacity>
      </View>

      {/* Custom City Input (when "Other" is selected) */}
      {selectedCity === 'other' && (
        <View style={styles.fieldWrapper}>
          <TextInput
            style={styles.customInput}
            placeholder='Enter your city'
            value={customCity || ''}
            onChangeText={handleCustomCityChange}
            placeholderTextColor={Theme.textInput}
          />
        </View>
      )}

      {/* Province Dropdown */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.label}>Province</Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            displayProvince && styles.dropdownActive,
            autoFilledProvince && styles.dropdownAutoFilled,
            error && styles.dropdownError,
          ]}
          onPress={() => setShowProvinceModal(true)}
          disabled={!!autoFilledProvince}
        >
          <Text
            style={[
              styles.dropdownText,
              !displayProvince && styles.placeholderText,
              autoFilledProvince && styles.autoFilledText,
            ]}
          >
            {displayProvince || 'Select a province'}
          </Text>
          {!autoFilledProvince && (
            <Feather name='chevron-down' size={20} color={Theme.textInput} />
          )}
          {autoFilledProvince && (
            <Text style={styles.autoFilledBadge}>Auto-filled</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* City Modal */}
      <Modal
        visible={showCityModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Feather name='x' size={24} color={Theme.black} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder='Search cities...'
              value={citySearchQuery}
              onChangeText={setCitySearchQuery}
              placeholderTextColor={Theme.textInput}
            />

            <FlatList
              data={filteredCities}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedCity === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleCitySelect(item)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedCity === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item === 'other' ? 'Other (specify)' : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Province Modal */}
      {!autoFilledProvince && (
        <Modal
          visible={showProvinceModal}
          transparent
          animationType='slide'
          onRequestClose={() => setShowProvinceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Province</Text>
                <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                  <Feather name='x' size={24} color={Theme.black} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder='Search provinces...'
                value={provinceSearchQuery}
                onChangeText={setProvinceSearchQuery}
                placeholderTextColor={Theme.textInput}
              />

              <FlatList
                data={filteredProvinces}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      displayProvince === item && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      onProvinceChange(item);
                      setShowProvinceModal(false);
                      setProvinceSearchQuery('');
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        displayProvince === item &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
  },
  fieldWrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    backgroundColor: Theme.white,
  },
  dropdownActive: {
    borderColor: Theme.primaryGatherRed,
    backgroundColor: '#FFF5F3',
  },
  dropdownAutoFilled: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
  },
  dropdownError: {
    borderColor: '#DC2626',
  },
  dropdownText: {
    fontSize: 16,
    color: Theme.black,
    flex: 1,
  },
  placeholderText: {
    color: Theme.textInput,
  },
  autoFilledText: {
    color: '#0EA5E9',
  },
  autoFilledBadge: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  customInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    backgroundColor: Theme.white,
    fontSize: 16,
    color: Theme.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.borderInfoText,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
  },
  searchInput: {
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    fontSize: 16,
    color: Theme.black,
  },
  modalOption: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.borderInfoText,
  },
  modalOptionSelected: {
    backgroundColor: '#FFF5F3',
  },
  modalOptionText: {
    fontSize: 16,
    color: Theme.black,
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: Theme.primaryGatherRed,
  },
});
