import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';
import { useCreateSource } from '../../hooks/use-api';

export default function CopiedTextScreen() {
  const navigation = useNavigation();
  const currentProject = useAppStore((state) => state.currentProject);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  
  const createSource = useCreateSource();

  const handleSave = async () => {
    if (!currentProject || !title.trim() || !text.trim()) return;

    try {
      await createSource.mutateAsync({
        projectId: currentProject.id,
        type: 'text',
        data: { title: title.trim(), text: text.trim() },
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save text:', error);
    }
  };

  const isValid = title.trim().length > 0 && text.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Add Text</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Enter a title..."
            placeholderTextColor={theme.colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Text Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Paste or type your text here..."
            placeholderTextColor={theme.colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{text.length} characters</Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isValid || createSource.isPending}
          loading={createSource.isPending}
          style={styles.saveButton}
          buttonColor={theme.colors.accentBlue}
          textColor={theme.colors.text}
        >
          Save Source
        </Button>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  titleInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    minHeight: 200,
    lineHeight: theme.typography.body.lineHeight,
  },
  charCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
  },
});
