import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type Props<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  style?: ViewStyle;
};

/**
 * Two-or-more-option toggle. Used at the top of Learn to switch between
 * Articles (existing CMS-driven content) and Resources (partner directory).
 */
export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: Props<T>) {
  return (
    <View style={[styles.container, style]}>
      {options.map(option => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.85}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
            accessibilityRole='button'
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#878787',
  },
  labelActive: {
    color: '#000000',
    fontWeight: '600',
  },
});
