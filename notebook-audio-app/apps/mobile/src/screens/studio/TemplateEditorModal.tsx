import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';

export default function TemplateEditorModal() {
  const route = useRoute();
  const navigation = useNavigation();
  const { generationType } = route.params as { generationType: string };
  const currentProject = useAppStore((state) => state.currentProject);

  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing template
    if (currentProject) {
      // TODO: Fetch template from API
      setName(generationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
  }, [currentProject, generationType]);

  const handleSave = async () => {
    if (!currentProject) return;

    setIsLoading(true);
    try {
      // TODO: Save template via API
      console.log('Saving template:', { name, instructions, systemPrompt });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // TODO: Reset to default template
    setInstructions('');
    setSystemPrompt('');
  };

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
        <Text style={styles.headerTitle}>Edit Template</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Template Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Template Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter template name"
            placeholderTextColor={theme.colors.muted}
          />
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.label}>Instructions</Text>
          <Text style={styles.helperText}>
            Describe what you want the AI to generate
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g., Create an engaging podcast-style discussion..."
            placeholderTextColor={theme.colors.muted}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* System Prompt */}
        <View style={styles.section}>
          <Text style={styles.label}>System Prompt</Text>
          <Text style={styles.helperText}>
            Advanced: Control the AI's behavior and persona
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            placeholder="You are an expert content creator..."
            placeholderTextColor={theme.colors.muted}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Reset Button */}
        <Button
          mode="outlined"
          onPress={handleReset}
          style={styles.resetButton}
          textColor={theme.colors.muted}
          icon="refresh"
        >
          Reset to Default
        </Button>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          buttonColor={theme.colors.accentBlue}
          textColor={theme.colors.text}
        >
          Save Template
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
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
  textArea: {
    minHeight: 120,
    lineHeight: theme.typography.body.lineHeight,
  },
  resetButton: {
    margin: theme.spacing.lg,
    borderColor: theme.colors.border,
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
