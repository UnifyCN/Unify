import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '@/components/BackHeader';
import LocationStep from '@/components/onboarding/LocationStep';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import { Theme } from '@/constants/Theme';
import { useSaveOnboardingProfile } from '@/hooks/onboarding/useSaveOnboardingProfile';
import { supabase } from '@/lib/supabase';

export default function RedoOnboardingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saveMutation = useSaveOnboardingProfile();

  const [city, setCity] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const validateStep = (): boolean => {
    const newErrors: Record<number, string> = {};

    if (!city) {
      newErrors[1] = 'Please select a city';
    }
    if (!province) {
      newErrors[1] = 'Please select a province';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateStep()) {
      return;
    }

    // Get user ID directly from Supabase auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('No authenticated user found:', authError);
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    try {
      await saveMutation.mutateAsync({
        userId: user.id,
        data: {
          city,
          province,
        },
      });

      Alert.alert('Success', 'Your location has been updated!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert(
        'Error',
        'Failed to update your location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const isLoading = saveMutation.isPending;

  return (
    <View style={styles.root}>
      <BackHeader title='Update Location' onBack={() => router.back()} />

      <OnboardingProgress currentStep={1} totalSteps={1} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LocationStep
          selectedCity={city}
          selectedProvince={province}
          onCityChange={setCity}
          onProvinceChange={setProvince}
          error={errors[1]}
        />
      </ScrollView>

      <View
        style={[styles.navContainer, { paddingBottom: 20 + insets.bottom }]}
      >
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Theme.white} />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save Location</Text>
              <Feather name='check' size={20} color={Theme.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 88,
  },
  navContainer: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.surfaceGray,
    backgroundColor: Theme.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Theme.primaryGatherRed,
    minHeight: 48,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.white,
  },
});
