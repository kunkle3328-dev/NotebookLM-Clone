import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useSources } from '../../hooks/use-api';
import { useAppStore } from '../../stores/app-store';

export default function SourceDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { sourceId } = route.params as { sourceId: string };
  const currentProject = useAppStore((state) => state.currentProject);
  const { data: sources } = useSources(currentProject?.id || '');
  
  const source = sources?.find((s) => s.id === sourceId);

  if (!source) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Source not found</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {source.title}
        </Text>
        <IconButton
          icon="dots-vertical"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => {}}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <IconButton
              icon={
                source.type === 'pdf'
                  ? 'file-pdf-box'
                  : source.type === 'audio'
                  ? 'music-box'
                  : source.type === 'image'
                  ? 'image'
                  : source.type === 'youtube'
                  ? 'youtube'
                  : 'web'
              }
              size={20}
              iconColor={theme.colors.muted}
            />
            <Text style={styles.metadataText}>
              {source.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <IconButton icon="calendar" size={20} iconColor={theme.colors.muted} />
            <Text style={styles.metadataText}>
              Added {formatDate(source.createdAt)}
            </Text>
          </View>
          {source.url && (
            <View style={styles.metadataRow}>
              <IconButton icon="link" size={20} iconColor={theme.colors.muted} />
              <Text style={styles.metadataText} numberOfLines={1}>
                {source.url}
              </Text>
            </View>
          )}
        </View>

        {/* Content Preview */}
        {source.extractedText && (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Content</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>
                {source.extractedText}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            textColor={theme.colors.text}
            icon="export-variant"
          >
            Export
          </Button>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            textColor={theme.colors.error}
            icon="delete"
          >
            Delete
          </Button>
        </View>
      </ScrollView>
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
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  metadataContainer: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metadataText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.muted,
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  contentTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  contentBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  contentText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderColor: theme.colors.border,
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
