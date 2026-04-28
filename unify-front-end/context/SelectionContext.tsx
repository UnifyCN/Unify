import React, { createContext, use, useState, useCallback } from 'react';
import { Highlight } from '@/services/highlights/highlightService';

export type SelectionMode = 'idle' | 'selecting' | 'selected';

export interface WordPosition {
  blockKey: string;
  wordIndex: number;
  word: string;
  pageX: number;
  pageY: number;
}

export interface SelectionState {
  mode: SelectionMode;
  startWord: WordPosition | null;
  endWord: WordPosition | null;
  selectedText: string;
  allWords: string[];
  existingHighlight: Highlight | null;
}

interface SelectionContextType {
  selection: SelectionState;
  onWordLongPress: (
    word: WordPosition,
    existingHighlight: Highlight | null,
    allWords: string[]
  ) => void;
  onWordTap: (word: WordPosition) => void;
  clearSelection: () => void;
  setSelectedText: (text: string) => void;
}

const initialState: SelectionState = {
  mode: 'idle',
  startWord: null,
  endWord: null,
  selectedText: '',
  allWords: [],
  existingHighlight: null,
};

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<SelectionState>(initialState);

  const onWordLongPress = useCallback(
    (
      word: WordPosition,
      existingHighlight: Highlight | null,
      allWords: string[]
    ) => {
      setSelection({
        mode: 'selected',
        startWord: word,
        endWord: word,
        selectedText: word.word,
        allWords,
        existingHighlight,
      });
    },
    []
  );

  const onWordTap = useCallback((word: WordPosition) => {
    setSelection(prev => {
      if (prev.mode !== 'selected' || !prev.startWord) return prev;
      if (word.blockKey !== prev.startWord.blockKey) return prev;

      const newStart = Math.min(prev.startWord.wordIndex, word.wordIndex);
      const newEnd = Math.max(
        prev.endWord?.wordIndex ?? prev.startWord.wordIndex,
        word.wordIndex
      );

      // Recompute selected text from allWords
      const selectedWords = prev.allWords.slice(newStart, newEnd + 1);

      // Clear existingHighlight if the range no longer matches it
      const existingH = prev.existingHighlight;
      const highlightStillMatches =
        existingH &&
        prev.startWord.blockKey === word.blockKey &&
        newStart === existingH.start_word_index &&
        newEnd === existingH.end_word_index;

      return {
        ...prev,
        startWord:
          newStart === prev.startWord.wordIndex
            ? prev.startWord
            : { ...word, wordIndex: newStart },
        endWord: { ...word, wordIndex: newEnd },
        selectedText: selectedWords.join(' '),
        existingHighlight: highlightStillMatches ? existingH : null,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(initialState);
  }, []);

  const setSelectedText = useCallback((text: string) => {
    setSelection(prev => ({ ...prev, selectedText: text }));
  }, []);

  return (
    <SelectionContext
      value={{
        selection,
        onWordLongPress,
        onWordTap,
        clearSelection,
        setSelectedText,
      }}
    >
      {children}
    </SelectionContext>
  );
}

/**
 * Returns the selection context, or null if no SelectionProvider is present.
 * This allows SelectableText to render as plain text outside lesson pages.
 */
export function useSelectionOptional(): SelectionContextType | null {
  return use(SelectionContext) ?? null;
}

export function useSelection() {
  const context = use(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
