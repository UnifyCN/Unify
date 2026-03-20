import React, { useCallback, useMemo, useRef } from 'react';
import { Text, View, StyleSheet, Linking } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useSelection } from '@/context/SelectionContext';
import { Highlight } from '@/services/highlights/highlightService';

interface SelectableTextProps {
  /** Portable Text span children (from block.children) */
  spans: any[];
  /** Combined markDefs (props + block-level) */
  allMarkDefs: any[];
  /** The Portable Text block key — used to scope selection to a single block */
  blockKey: string;
  /** Persisted highlights for this block */
  highlights: Highlight[];
  /** Base text style (from RichTextRenderer) */
  style?: any;
  /** Merged styles object from RichTextRenderer for decorator resolution */
  mergedStyles?: any;
}

interface StyledWord {
  word: string;
  styles: any[];
  linkHref?: string;
}

/**
 * Takes Portable Text span children and flattens them into per-word items
 * that preserve inline styling (bold, italic, code, links).
 */
export function flattenSpansToWords(
  spans: any[],
  allMarkDefs: any[],
  mergedStyles?: any
): StyledWord[] {
  if (!spans || !Array.isArray(spans)) return [];

  const styledWords: StyledWord[] = [];

  for (const child of spans) {
    if (child._type !== 'span') continue;

    const text = child.text || '';
    if (!text.trim()) continue;

    const wordStyles: any[] = [];
    let linkHref: string | undefined;

    if (child.marks) {
      for (const mark of child.marks) {
        if (typeof mark === 'string') {
          const markDef = allMarkDefs.find((def: any) => def._key === mark);
          if (markDef && markDef._type === 'link') {
            linkHref = markDef.href;
          }
          switch (mark) {
            case 'strong':
              wordStyles.push(mergedStyles?.strong || { fontWeight: '700' });
              break;
            case 'em':
              wordStyles.push({ fontStyle: 'italic' as const });
              break;
            case 'code':
              wordStyles.push({
                fontFamily: 'monospace',
                backgroundColor: '#F3F4F6',
                paddingHorizontal: 4,
                borderRadius: 2,
              });
              break;
            case 'underline':
              wordStyles.push({ textDecorationLine: 'underline' as const });
              break;
            case 'strike-through':
              wordStyles.push({ textDecorationLine: 'line-through' as const });
              break;
          }
        } else if (typeof mark === 'object' && mark !== null) {
          const markType = mark._type;
          if (markType === 'link') {
            linkHref = mark.href || mark.value?.href;
          }
          const markKey = mark._key;
          if (markKey && !linkHref) {
            const markDef = allMarkDefs.find((def: any) => def._key === markKey);
            if (markDef && markDef._type === 'link') {
              linkHref = markDef.href;
            }
          }
        }
      }
    }

    // Split text into words, preserving each word individually
    const words = text.split(/(\s+)/);
    for (const segment of words) {
      if (segment.trim().length > 0) {
        styledWords.push({ word: segment, styles: wordStyles, linkHref });
      }
    }
  }

  return styledWords;
}

/**
 * Checks if a word index is within any highlight range for this block.
 */
function findHighlightForWord(
  wordIndex: number,
  highlights: Highlight[]
): Highlight | null {
  for (const h of highlights) {
    if (wordIndex >= h.start_word_index && wordIndex <= h.end_word_index) {
      return h;
    }
  }
  return null;
}

export default function SelectableText({
  spans,
  allMarkDefs,
  blockKey,
  highlights,
  style,
  mergedStyles,
}: SelectableTextProps) {
  const { selection, onWordLongPress, onWordTap, setSelectedText } = useSelection();
  const wordRefs = useRef<{ [key: number]: View | null }>({});

  const styledWords = useMemo(
    () => flattenSpansToWords(spans, allMarkDefs, mergedStyles),
    [spans, allMarkDefs, mergedStyles]
  );

  const plainWords = useMemo(
    () => styledWords.map(sw => sw.word),
    [styledWords]
  );

  const isWordInSelection = useCallback(
    (wordIndex: number): boolean => {
      if (selection.mode !== 'selected' || !selection.startWord || !selection.endWord) return false;
      if (selection.startWord.blockKey !== blockKey) return false;
      const start = Math.min(selection.startWord.wordIndex, selection.endWord.wordIndex);
      const end = Math.max(selection.startWord.wordIndex, selection.endWord.wordIndex);
      return wordIndex >= start && wordIndex <= end;
    },
    [selection, blockKey]
  );

  const handleLongPress = useCallback(
    (wordIndex: number, word: string) => {
      const ref = wordRefs.current[wordIndex];
      if (!ref) return;

      ref.measureInWindow((x, y) => {
        const existingHighlight = findHighlightForWord(wordIndex, highlights);
        onWordLongPress(
          { blockKey, wordIndex, word, pageX: x, pageY: y },
          existingHighlight,
          plainWords
        );
      });
    },
    [blockKey, highlights, onWordLongPress, plainWords]
  );

  const handleTap = useCallback(
    (wordIndex: number, word: string) => {
      if (selection.mode !== 'selected') return;
      if (selection.startWord?.blockKey !== blockKey) return;

      const ref = wordRefs.current[wordIndex];
      if (!ref) return;

      ref.measureInWindow((x, y) => {
        onWordTap({ blockKey, wordIndex, word, pageX: x, pageY: y });

        const start = Math.min(selection.startWord!.wordIndex, wordIndex);
        const end = Math.max(
          selection.endWord?.wordIndex ?? selection.startWord!.wordIndex,
          wordIndex
        );
        const selectedWords = plainWords.slice(start, end + 1);
        setSelectedText(selectedWords.join(' '));
      });
    },
    [selection, blockKey, onWordTap, setSelectedText, plainWords]
  );

  return (
    <Text style={style}>
      {styledWords.map((sw, index) => {
        const highlight = findHighlightForWord(index, highlights);
        const isSelected = isWordInSelection(index);

        const wordStyle = [
          ...sw.styles,
          highlight ? styles.highlighted : undefined,
          isSelected ? styles.activeSelection : undefined,
          sw.linkHref ? styles.link : undefined,
        ].filter(Boolean);

        const wordElement = (
          <Text key={`${blockKey}-w-${index}`}>
            <View
              ref={(ref) => { wordRefs.current[index] = ref; }}
              collapsable={false}
            >
              <Text
                style={wordStyle.length > 0 ? wordStyle : undefined}
                onLongPress={() => handleLongPress(index, sw.word)}
                onPress={() => {
                  if (sw.linkHref && selection.mode !== 'selected') {
                    Linking.openURL(sw.linkHref);
                  } else {
                    handleTap(index, sw.word);
                  }
                }}
                suppressHighlighting
              >
                {sw.word}
              </Text>
            </View>
            {index < styledWords.length - 1 ? ' ' : ''}
          </Text>
        );

        return wordElement;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlighted: {
    backgroundColor: Theme.highlightYellow,
    borderRadius: 2,
  },
  activeSelection: {
    backgroundColor: Theme.highlightYellowActive,
    borderRadius: 2,
  },
  link: {
    color: '#5182C7',
    textDecorationLine: 'underline',
  },
});
