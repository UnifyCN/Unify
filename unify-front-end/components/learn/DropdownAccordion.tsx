import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import RichTextRenderer from '@/components/sanity/RichTextRenderer';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AccordionItem = {
  id: string;
  title: string;
  body: string | any[];
};

export default function DropdownAccordion({
  items,
}: {
  items: AccordionItem[];
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <View style={{ gap: 12 }}>
      {items.map(item => {
        const open = item.id === openId;
        return (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.header}
              onPress={() => toggle(item.id)}
            >
              <Text style={styles.headerText}>{item.title}</Text>
              <Feather
                name={open ? 'chevron-up' : 'chevron-down'}
                size={18}
                color='#111827'
              />
            </TouchableOpacity>
            {open && (
              <View style={styles.body}>
                {typeof item.body === 'string' ? (
                  <Text style={styles.bodyText}>{item.body}</Text>
                ) : (
                  <RichTextRenderer blocks={item.body} />
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#E6E6E6',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    backgroundColor: '#E6E6E6',
    borderRadius: 12,
    padding: 16,
  },
  bodyText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
});
