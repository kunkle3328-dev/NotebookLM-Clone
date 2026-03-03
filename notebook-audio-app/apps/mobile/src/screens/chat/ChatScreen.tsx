import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';
import { useChatHistory, useSendMessage } from '../../hooks/use-api';
import { Message } from '@notebook/shared';

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content}
        </Text>
      </View>
      
      {/* Citations */}
      {!isUser && message.citations && message.citations.length > 0 && (
        <View style={styles.citationsContainer}>
          <Text style={styles.citationsLabel}>Sources used:</Text>
          <View style={styles.citationsList}>
            {message.citations.map((citation, index) => (
              <TouchableOpacity key={index} style={styles.citationChip}>
                <Text style={styles.citationText}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const SourceCountPill = ({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.sourcePill} onPress={onPress}>
    <Text style={styles.sourcePillText}>{count} sources</Text>
    <IconButton icon="chevron-down" size={16} iconColor={theme.colors.text} />
  </TouchableOpacity>
);

export default function ChatScreen() {
  const currentProject = useAppStore((state) => state.currentProject);
  const selectedSourceIds = useAppStore((state) => state.selectedSourceIds);
  const messages = useAppStore((state) => state.messages);
  const addMessage = useAppStore((state) => state.addMessage);
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const { data: chatHistory, isLoading } = useChatHistory(currentProject?.id || '');
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (chatHistory) {
      useAppStore.setState({ messages: chatHistory });
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentProject) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      projectId: currentProject.id,
      role: 'user',
      content: inputText.trim(),
      createdAt: new Date(),
    };

    addMessage(userMessage);
    setInputText('');

    try {
      const response = await sendMessage.mutateAsync({
        projectId: currentProject.id,
        message: inputText.trim(),
        selectedSourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        projectId: currentProject.id,
        role: 'assistant',
        content: response.data.data.reply,
        usedSourceIds: response.data.data.usedSourceIds,
        citations: response.data.data.citations,
        createdAt: new Date(),
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const sourceCount = selectedSourceIds.length > 0 
    ? selectedSourceIds.length 
    : (useAppStore.getState().sources.length);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <IconButton
          icon="dots-vertical"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => {}}
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconButton
              icon="chat"
              size={48}
              iconColor={theme.colors.muted}
            />
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptySubtitle}>
              Ask questions about your sources
            </Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <SourceCountPill
            count={sourceCount}
            onPress={() => {}}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={`Ask ${sourceCount} sources...`}
              placeholderTextColor={theme.colors.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <IconButton
                  icon="send"
                  size={20}
                  iconColor={inputText.trim() ? theme.colors.text : theme.colors.muted}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  messagesList: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  userBubble: {
    backgroundColor: theme.colors.accentBlue,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
  messageText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
  },
  userMessageText: {
    color: theme.colors.text,
  },
  citationsContainer: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  citationsLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginRight: theme.spacing.xs,
  },
  citationsList: {
    flexDirection: 'row',
  },
  citationChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  citationText: {
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: '600',
  },
  inputContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    paddingLeft: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sourcePillText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.card2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
});
