import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cachedProgressService } from '@/services/progress/cachedProgressService';

export default function ProgressCacheStatus() {
  const [cacheStatus, setCacheStatus] = React.useState<any>(null);

  React.useEffect(() => {
    const checkCache = async () => {
      try {
        const data = await cachedProgressService.getProgressData();
        setCacheStatus(data);
      } catch (error) {
        console.error('Error checking cache:', error);
      }
    };

    checkCache();
  }, []);

  if (!cacheStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading progress cache...</Text>
      </View>
    );
  }

  const totalModules = Object.keys(cacheStatus).length;
  const totalSubmodules = Object.values(cacheStatus).reduce(
    (acc: number, module: any) => acc + Object.keys(module).length,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress Cache Status:</Text>
      <Text style={styles.text}>• {totalModules} modules cached</Text>
      <Text style={styles.text}>• {totalSubmodules} submodules cached</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 12,
    color: '#333',
  },
});
