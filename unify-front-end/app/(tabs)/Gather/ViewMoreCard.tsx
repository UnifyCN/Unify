import { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

interface ViewMoreCardProps {
  onPress: () => void;
}

const ViewMoreCard = memo(({ onPress }: ViewMoreCardProps) => {
  return (
    <TouchableOpacity style={styles.viewMoreCard} onPress={onPress}>
      <View style={styles.viewMoreContent}>
        <Text style={styles.viewMoreText}>View More</Text>
        <Text style={styles.viewMoreSubtext}>Events</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  viewMoreCard: {
    width: 248,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  viewMoreContent: {
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewMoreSubtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default ViewMoreCard;