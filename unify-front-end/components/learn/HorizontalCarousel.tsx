import React, { useRef } from 'react';
import { View, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type Props = {
  data: React.ReactNode[];
  index: number;
  onIndexChange: (i: number) => void;
  itemWidth?: number;
  gap?: number;
};

export default function HorizontalCarousel({ data, index, onIndexChange, itemWidth, gap = 12 }: Props) {
  const listRef = useRef<FlatList>(null);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const w = e.nativeEvent.layoutMeasurement.width;
    const i = Math.round(x / w);
    if (i !== index) onIndexChange(i);
  };

  React.useEffect(() => {
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [index]);

  return (
    <FlatList
      ref={listRef}
      data={data}
      renderItem={({ item }) => <View style={{ width: '100%' }}>{item}</View>}
      keyExtractor={(_, i) => String(i)}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleMomentumEnd}
    />
  );
}
