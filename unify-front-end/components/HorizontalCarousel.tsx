import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface HorizontalCarouselProps<T> {
  title: string;
  titleStyle?: any;
  data: T[];
  isLoading: boolean;
  maxItems?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderLoadingSkeleton: () => React.ReactNode;
  renderEmptyState: () => React.ReactNode;
  renderViewMore?: () => React.ReactNode;
  onViewMore?: () => void;
  showViewMore?: boolean;
  style?: any;
  scrollViewStyle?: any;
  contentContainerStyle?: any;
  itemKeyExtractor?: (item: T, index: number) => string | number;
}

export function HorizontalCarousel<T>({
  title,
  titleStyle,
  data,
  isLoading,
  maxItems = 3,
  renderItem,
  renderLoadingSkeleton,
  renderEmptyState,
  renderViewMore,
  onViewMore,
  showViewMore = true,
  style,
  scrollViewStyle,
  contentContainerStyle,
  itemKeyExtractor,
}: HorizontalCarouselProps<T>) {
  const dataArray = data || [];
  const displayItems = dataArray.slice(0, maxItems);
  const hasMoreItems = dataArray.length > maxItems;

  return (
    <View style={style}>
      <View style={styles.header}>
        <Text style={[styles.headerText, titleStyle]}>{title}</Text>
        {showViewMore && onViewMore && (
          <TouchableOpacity onPress={onViewMore}>
            <Feather name='chevron-right' size={24} color='#000' />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.carousel, scrollViewStyle]}
        contentContainerStyle={[
          styles.carouselContent,
          dataArray.length === 0 && !isLoading && styles.carouselContentEmpty,
          contentContainerStyle,
        ]}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            {Array.from({ length: 2 }).map((_, index) => (
              <React.Fragment key={`skeleton-${index}`}>
                {renderLoadingSkeleton()}
              </React.Fragment>
            ))}
          </View>
        )}
        {!isLoading && dataArray.length === 0 && (
          <View style={styles.emptyContainer}>{renderEmptyState()}</View>
        )}
        {!isLoading && dataArray.length > 0 && (
          <>
            {displayItems.map((item, index) => {
              const key = itemKeyExtractor
                ? itemKeyExtractor(item, index)
                : index;
              return (
                <React.Fragment key={key}>
                  {renderItem(item, index)}
                </React.Fragment>
              );
            })}
            {hasMoreItems && renderViewMore && <>{renderViewMore()}</>}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  carousel: {
    marginBottom: 20,
  },
  carouselContent: {
    paddingHorizontal: 0,
    paddingBottom: 6,
    gap: 12,
  },
  carouselContentEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    width: '100%',
  },
  emptyContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
