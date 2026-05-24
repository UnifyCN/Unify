import React, { memo } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import RenderHtml, { MixedStyleDeclaration } from 'react-native-render-html';
import { Theme } from '@/constants/Theme';
import { useTranslateContent } from '@/hooks/posts/useTranslateContent';

const TRANSLATED_TAG_STYLES: Record<string, MixedStyleDeclaration> = {
  body: { fontSize: 16, lineHeight: 22, color: Theme.black },
  a: { color: '#f68b26', textDecorationLine: 'underline' },
  strong: { fontWeight: '700' },
  b: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  del: { textDecorationLine: 'line-through' },
  strike: { textDecorationLine: 'line-through' },
};

interface TranslateButtonProps {
  content: string;
  contentWidth: number;
  isHtml?: boolean;
}

export const TranslateButton = memo(
  ({ content, contentWidth, isHtml = true }: TranslateButtonProps) => {
    const { t, i18n } = useTranslation();
    const {
      translatedText,
      isTranslating,
      isShowingTranslation,
      error,
      translate,
    } = useTranslateContent(content);

    if (!content.trim() || i18n.language === 'en') {
      return null;
    }

    const buttonLabel = isTranslating
      ? t('common.translating')
      : error
        ? t('common.translationFailed')
        : isShowingTranslation
          ? t('common.hideTranslation')
          : t('common.seeTranslation');

    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={translate}
          disabled={isTranslating}
          style={styles.button}
          hitSlop={8}
        >
          {isTranslating && (
            <ActivityIndicator
              size={12}
              color={Theme.textPostTime}
              style={styles.spinner}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              error && styles.errorText,
            ]}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>

        {isShowingTranslation && translatedText && (
          <View style={styles.translationContainer}>
            {isHtml ? (
              <RenderHtml
                contentWidth={contentWidth}
                source={{ html: translatedText }}
                tagsStyles={TRANSLATED_TAG_STYLES}
              />
            ) : (
              <Text style={styles.translatedPlainText}>{translatedText}</Text>
            )}
            <Text style={styles.attribution}>{t('common.translatedBy')}</Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  spinner: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.textPostTime,
  },
  errorText: {
    color: Theme.destructive,
  },
  translationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  translatedPlainText: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.black,
  },
  attribution: {
    fontSize: 12,
    color: Theme.textPostTime,
    marginTop: 4,
  },
});
