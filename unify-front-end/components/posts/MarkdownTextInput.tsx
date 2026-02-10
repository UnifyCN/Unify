import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
  RichText,
  useEditorBridge,
  useBridgeState,
} from '@10play/tentap-editor';
import { Theme } from '@/constants/Theme';

interface MarkdownTextInputProps {
  placeholder?: string;
  baseStyle?: any;
  maxLength?: number;
  showToolbar?: boolean;
  multiline?: boolean;
  onChangeText?: (text: string) => void;
  initialValue?: string;
}

export interface MarkdownTextInputRef {
  getText: () => Promise<string>;
  setText: (text: string) => void;
  clear: () => void;
}

const MarkdownTextInput = forwardRef<
  MarkdownTextInputRef,
  MarkdownTextInputProps
>(
  (
    {
      placeholder = '',
      baseStyle,
      maxLength,
      showToolbar = false,
      multiline = true,
      onChangeText,
      initialValue = '',
    },
    ref
  ) => {
    const editor = useEditorBridge({
      autofocus: false,
      avoidIosKeyboard: true,
      initialContent: initialValue,
    });

    const editorState = useBridgeState(editor);
    const isInitialMount = useRef(true);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getText: async () => {
        return editor ? await editor.getText() : '';
      },
      setText: (text: string) => {
        if (editor) {
          editor.setContent(text);
        }
      },
      clear: () => {
        if (editor) {
          editor.setContent('');
        }
      },
    }));

    // Listen to content changes
    useEffect(() => {
      if (!editor) return;

      const unsubscribe = editor._subscribeToEditorStateUpdate(async () => {
        // Skip the initial mount to avoid double-firing
        if (isInitialMount.current) {
          isInitialMount.current = false;
          return;
        }

        const text = await editor.getText();

        // Enforce max length
        if (maxLength && text.length > maxLength) {
          return;
        }

        onChangeText?.(text);
      });

      return unsubscribe;
    }, [editor, onChangeText, maxLength]);

    const toggleBold = () => {
      editor.toggleBold();
    };

    const toggleItalic = () => {
      editor.toggleItalic();
    };

    const toggleUnderline = () => {
      editor.toggleUnderline();
    };

    const toggleLink = () => {
      if (editorState.isLinkActive) {
        editor.setLink('');
      } else {
        editor.setLink('https://example.com');
      }
    };

    return (
      <View style={styles.container}>
        <RichText editor={editor} style={[styles.richText, baseStyle]} />

        {showToolbar && editor && (
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={toggleBold}
              style={[
                styles.toolbarButton,
                editorState.isBoldActive && styles.toolbarButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toolbarButtonText,
                  editorState.isBoldActive && styles.toolbarButtonTextActive,
                ]}
              >
                B
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleItalic}
              style={[
                styles.toolbarButton,
                editorState.isItalicActive && styles.toolbarButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toolbarButtonText,
                  styles.italicText,
                  editorState.isItalicActive && styles.toolbarButtonTextActive,
                ]}
              >
                I
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleUnderline}
              style={[
                styles.toolbarButton,
                editorState.isUnderlineActive && styles.toolbarButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toolbarButtonText,
                  styles.underlineText,
                  editorState.isUnderlineActive &&
                    styles.toolbarButtonTextActive,
                ]}
              >
                U
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleLink}
              style={[
                styles.toolbarButton,
                editorState.isLinkActive && styles.toolbarButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toolbarButtonText,
                  editorState.isLinkActive && styles.toolbarButtonTextActive,
                ]}
              >
                {editorState.isLinkActive ? '🔗✕' : '🔗'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  richText: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: Theme.surfaceGray + '30',
    borderTopWidth: 1,
    borderTopColor: Theme.surfaceGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  toolbarButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonActive: {
    backgroundColor: Theme.primaryGatherRed + '20',
  },
  toolbarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
  },
  toolbarButtonTextActive: {
    color: Theme.primaryGatherRed,
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
});

export default MarkdownTextInput;
