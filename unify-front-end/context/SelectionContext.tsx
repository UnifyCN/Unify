import React, { createContext, useContext, useState, useCallback } from 'react';

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
  existingHighlight: any | null;
}

interface SelectionContextType {
  selection: SelectionState;
  onWordLongPress: (word: WordPosition, existingHighlight: any | null, allWords: string[]) => void;
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

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<SelectionState>(initialState);

  const onWordLongPress = useCallback(
    (word: WordPosition, existingHighlight: any | null, allWords: string[]) => {
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

  const onWordTap = useCallback(
    (word: WordPosition) => {
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

        return {
          ...prev,
          startWord: newStart === prev.startWord.wordIndex
            ? prev.startWord
            : { ...word, wordIndex: newStart },
          endWord: { ...word, wordIndex: newEnd },
          selectedText: selectedWords.join(' '),
        };
      });
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelection(initialState);
  }, []);

  const setSelectedText = useCallback((text: string) => {
    setSelection(prev => ({ ...prev, selectedText: text }));
  }, []);

  return (
    <SelectionContext.Provider
      value={{ selection, onWordLongPress, onWordTap, clearSelection, setSelectedText }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
