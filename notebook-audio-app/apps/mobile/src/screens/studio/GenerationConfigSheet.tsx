import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Text, IconButton, Button, ActivityIndicator } from 'react-native-paper';

import { theme } from '../../theme';
import { GenerationType, GenerationSettings, AudienceType, LengthType, ToneType } from '@notebook/shared';

interface GenerationConfigSheetProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (settings: GenerationSettings) => void;
  generationType: GenerationType | null;
  isLoading: boolean;
}

const AUDIENCE_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'student', label: 'Student' },
  { value: 'exec', label: 'Executive' },
  { value: 'technical', label: 'Technical' },
];

const LENGTH_OPTIONS: { value: LengthType; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

const TONE_OPTIONS: { value: ToneType; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'lively', label: 'Lively' },
  { value: 'serious', label: 'Serious' },
];

const OptionButton = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.optionButton,
      selected && styles.optionButtonSelected,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.optionButtonText,
        selected && styles.optionButtonTextSelected,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function GenerationConfigSheet({
  visible,
  onClose,
  onGenerate,
  generationType,
  isLoading,
}: GenerationConfigSheetProps) {
  const [settings, setSettings] = useState<GenerationSettings>({
    audience: 'general',
    length: 'medium',
    tone: 'neutral',
    useAllSources: true,
    customInstructions: '',
  });

  const updateSetting = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    onGenerate(settings);
  };

  const getTypeLabel = () => {
    if (!generationType) return '';
    return generationType
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const showLengthOption = generationType === 'audio_overview' || generationType === 'video_overview';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{getTypeLabel()}</Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.text}
              onPress={onClose}
            />
          </View>

          <ScrollView style={styles.content}>
            {/* Audience */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Audience</Text>
              <View style={styles.optionsRow}>
                {AUDIENCE_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    label={option.label}
                    selected={settings.audience === option.value}
                    onPress={() => updateSetting('audience', option.value)}
                  />
                ))}
              </View>
            </View>

            {/* Length (only for audio/video) */}
            {showLengthOption && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Length</Text>
                <View style={styles.optionsRow}>
                  {LENGTH_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      label={option.label}
                      selected={settings.length === option.value}
                      onPress={() => updateSetting('length', option.value)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Tone */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tone</Text>
              <View style={styles.optionsRow}>
                {TONE_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    label={option.label}
                    selected={settings.tone === option.value}
                    onPress={() => updateSetting('tone', option.value)}
                  />
                ))}
              </View>
            </View>

            {/* Use All Sources Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <Text style={styles.sectionLabel}>Use all sources</Text>
                <Switch
                  value={settings.useAllSources}
                  onValueChange={(value) => updateSetting('useAllSources', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.accentBlue }}
                  thumbColor={settings.useAllSources ? theme.colors.text : theme.colors.muted}
                />
              </View>
            </View>

            {/* Custom Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Custom Instructions (Optional)</Text>
              <View style={styles.textInputContainer}>
                <Text
                  style={styles.textInput}
                  // Using a simple text input would go here
                >
                  {settings.customInstructions || 'Add any specific instructions...'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleGenerate}
              loading={isLoading}
              disabled={isLoading}
              style={styles.generateButton}
              buttonColor={theme.colors.accentBlue}
              textColor={theme.colors.text}
            >
              Generate
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.accentBlue,
    borderColor: theme.colors.accentBlue,
  },
  optionButtonText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text,
  },
  optionButtonTextSelected: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInputContainer: {
    backgroundColor: theme.colors.card2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minHeight: 80,
  },
  textInput: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  generateButton: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
  },
});
