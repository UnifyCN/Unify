import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  NativeSyntheticEvent,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type EnrichedTextInputProps,
  OnChangeHtmlEvent,
  type OnChangeStateEvent,
  OnChangeTextEvent,
  type OnChangeSelectionEvent,
} from 'react-native-enriched';
import { useMutateCreatePost } from '@/hooks/posts/useCreatePost';
import GroupSelectionSheet from './GroupSelectionSheet';
import DestinationToggle from './DestinationToggle';
import { Theme } from '@/constants/Theme';
import BackHeader from '@/components/BackHeader';
import { useToast } from '@/context/ToastContext';
import { Group } from '@/types/groups';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DestinationType = '4u' | 'group';

interface CreatePostFormProps {
  preselectedGroup?: Group | null;
  onCancel: () => void;
  onSuccessNavigate: (payload: {
    postedToGroup: boolean;
    group?: Group | null;
  }) => void;
}

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

const RichTextInput = EnrichedTextInput as React.ComponentType<EnrichedTextInputProps>;

interface ToolbarButtonProps {
  icon: string;
  isActive?: boolean;
  isBlocked?: boolean;
  onPress: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
                                                       icon,
                                                       isActive,
                                                       isBlocked,
                                                       onPress,
                                                     }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={isBlocked}
    style={[
      styles.toolbarButton,
      isActive && styles.toolbarButtonActive,
      isBlocked && styles.toolbarButtonBlocked,
    ]}
  >
    <Text
      style={[
        styles.toolbarButtonText,
        isActive && styles.toolbarButtonTextActive,
        isBlocked && styles.toolbarButtonTextBlocked,
      ]}
    >
      {icon}
    </Text>
  </TouchableOpacity>
);

export default function CreatePostForm({
                                         preselectedGroup,
                                         onCancel,
                                         onSuccessNavigate,
                                       }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [destination, setDestination] = useState<DestinationType>('4u');
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(null);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);

  const contentInputRef = useRef<EnrichedTextInputInstance>(null);
  const insets = useSafeAreaInsets();

  const { showToast } = useToast();
  const createPostMutation = useMutateCreatePost();

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  useEffect(() => {
    if (preselectedGroup) {
      setSelectedGroup(preselectedGroup);
      setDestination('group');
    } else {
      setSelectedGroup(null);
      setDestination('4u');
    }
  }, [preselectedGroup]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setContentHtml('');
    setSelectedGroup(null);
    setDestination('4u');
    setShowGroupSelector(false);
    setStylesState(null);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setSelection(null);
  };

  const handleSubmit = () => {
    if (!trimmedTitle || !trimmedContent) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }
    if (destination === 'group' && !selectedGroup) {
      Alert.alert('Error', 'Please select a group to post to');
      return;
    }
    createPostMutation.mutate(
      {
        title: trimmedTitle,
        content: contentHtml || trimmedContent,
        group_id: destination === '4u' ? null : String(selectedGroup?.id),
      },
      {
        onSuccess: () => {
          const postedToGroup = destination === 'group' && selectedGroup;
          const toastMessage = postedToGroup
            ? `Posted to ${selectedGroup.name}`
            : 'Posted to For You';
          const groupToNavigate = selectedGroup;
          resetForm();
          showToast(toastMessage);
          onSuccessNavigate({
            postedToGroup: Boolean(postedToGroup),
            group: groupToNavigate,
          });
        },
        onError: _ => {
          Alert.alert('Error', 'Failed to create post. Please try again.');
        },
      }
    );
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setDestination('group');
    setShowGroupSelector(false);
  };

  const handleDestinationChange = (newDestination: DestinationType) => {
    setDestination(newDestination);
    if (newDestination === '4u') {
      setSelectedGroup(null);
    } else {
      setShowGroupSelector(true);
    }
  };

  const handleClearGroup = () => {
    setSelectedGroup(null);
    setDestination('4u');
  };

  const handleContentTextChange = (e: NativeSyntheticEvent<OnChangeTextEvent>) => {
    const textValue = (e.nativeEvent as any).text || '';
    setContent(textValue);
  };

  const handleContentHtmlChange = (e: NativeSyntheticEvent<OnChangeHtmlEvent>) => {
    const htmlValue = (e.nativeEvent as any).html || '';
    setContentHtml(htmlValue);
  };

  const handleContentStateChange = (e: NativeSyntheticEvent<OnChangeStateEvent>) => {
    setStylesState(e.nativeEvent);
  };

  const handleSelectionChange = (e: NativeSyntheticEvent<OnChangeSelectionEvent>) => {
    const { start, end, text } = e.nativeEvent as any;
    setSelection({ start, end, text: text || '' });
  };

  const handleToggleBold = () => contentInputRef.current?.toggleBold();
  const handleToggleItalic = () => contentInputRef.current?.toggleItalic();
  const handleToggleUnderline = () => contentInputRef.current?.toggleUnderline();
  const handleToggleStrikethrough = () => contentInputRef.current?.toggleStrikeThrough();

  const handleLinkButtonPress = () => {
    // Pre-fill link text with current selection if any
    setLinkText(selection?.text || '');
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }
    const url = linkUrl.trim().startsWith('http')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    contentInputRef.current?.setLink(
      selection?.start ?? 0,
      selection?.end ?? 0,
      linkText.trim() || selection?.text || url,
      url
    );

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackHeader
        title=''
        backIcon='x'
        onBack={handleCancel}
        rightButton={
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.postButton,
              (!trimmedTitle || !trimmedContent) && styles.disabledButton,
            ]}
            disabled={
              !trimmedTitle || !trimmedContent || createPostMutation.isPending
            }
          >
            {createPostMutation.isPending ? (
              <ActivityIndicator size='small' color='white' />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.scrollContent}
      >
        <DestinationToggle
          destination={destination}
          selectedGroup={selectedGroup}
          onDestinationChange={handleDestinationChange}
          onClearGroup={handleClearGroup}
        />

        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder='Title'
            placeholderTextColor={Theme.textAlternateGray}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={TITLE_MAX_LENGTH}
          />
          <Text
            style={[
              styles.charCount,
              title.length > TITLE_MAX_LENGTH * 0.9 && styles.charCountWarning,
            ]}
          >
            {title.length}/{TITLE_MAX_LENGTH}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.contentContainer}>
          <RichTextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="What's on your mind?"
            placeholderTextColor={Theme.textAlternateGray}
            onChangeText={handleContentTextChange}
            onChangeHtml={handleContentHtmlChange}
            onChangeState={handleContentStateChange}
            onChangeSelection={handleSelectionChange}
          />
          <Text
            style={[
              styles.charCount,
              content.length > CONTENT_MAX_LENGTH * 0.9 && styles.charCountWarning,
            ]}
          >
            {content.length}/{CONTENT_MAX_LENGTH}
          </Text>
        </View>
      </ScrollView>

      {/* Toolbar sticks above keyboard */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom || 8 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
          keyboardShouldPersistTaps='handled'
        >
          <ToolbarButton
            icon='B'
            isActive={stylesState?.bold?.isActive}
            isBlocked={stylesState?.bold?.isBlocking}
            onPress={handleToggleBold}
          />
          <ToolbarButton
            icon='I'
            isActive={stylesState?.italic?.isActive}
            isBlocked={stylesState?.italic?.isBlocking}
            onPress={handleToggleItalic}
          />
          <ToolbarButton
            icon='U'
            isActive={stylesState?.underline?.isActive}
            isBlocked={stylesState?.underline?.isBlocking}
            onPress={handleToggleUnderline}
          />
          <ToolbarButton
            icon='S'
            isActive={stylesState?.strikeThrough?.isActive}
            isBlocked={stylesState?.strikeThrough?.isBlocking}
            onPress={handleToggleStrikethrough}
          />
          <View style={styles.toolbarDivider} />
          <ToolbarButton
            icon='🔗'
            isActive={false}
            onPress={handleLinkButtonPress}
          />
        </ScrollView>
      </View>

      {/* Link insertion modal */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowLinkModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLinkModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={() => {}} // prevent overlay dismiss when tapping card
          >
            <Text style={styles.modalTitle}>Insert Link</Text>

            <Text style={styles.modalLabel}>Display text</Text>
            <TextInput
              style={styles.modalInput}
              placeholder='Link text (optional)'
              placeholderTextColor={Theme.textAlternateGray}
              value={linkText}
              onChangeText={setLinkText}
              autoCapitalize='none'
            />

            <Text style={styles.modalLabel}>URL</Text>
            <TextInput
              style={styles.modalInput}
              placeholder='https://example.com'
              placeholderTextColor={Theme.textAlternateGray}
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize='none'
              keyboardType='url'
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLinkModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalInsertButton,
                  !linkUrl.trim() && styles.disabledButton,
                ]}
                onPress={handleInsertLink}
                disabled={!linkUrl.trim()}
              >
                <Text style={styles.modalInsertText}>Insert</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <GroupSelectionSheet
        visible={showGroupSelector}
        onClose={() => setShowGroupSelector(false)}
        onGroupSelect={handleGroupSelect}
        useModal={Platform.OS !== 'ios'}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  postButton: {
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 9,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: Theme.disabledGatherRed,
  },
  postButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
  },
  titleContainer: {
    marginTop: 8,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: '600',
    color: Theme.black,
    paddingTop: 24,
    paddingBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.surfaceGray,
    marginVertical: 16,
  },
  toolbar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Theme.surfaceGray,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonActive: {
    backgroundColor: Theme.primaryGatherRed,
  },
  toolbarButtonBlocked: {
    opacity: 0.3,
  },
  toolbarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.black,
  },
  toolbarButtonTextActive: {
    color: 'white',
  },
  toolbarButtonTextBlocked: {
    color: Theme.textAlternateGray,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: Theme.surfaceGray,
    marginHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
    minHeight: 200,
  },
  contentInput: {
    fontSize: 16,
    color: Theme.black,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: Theme.textAlternateGray,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  charCountWarning: {
    color: Theme.primaryGatherRed,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.textAlternateGray,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Theme.surfaceGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Theme.black,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.surfaceGray,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: Theme.textAlternateGray,
  },
  modalInsertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Theme.primaryGatherRed,
    alignItems: 'center',
  },
  modalInsertText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
});