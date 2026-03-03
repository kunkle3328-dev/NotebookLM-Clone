import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Text, IconButton, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';
import { useSources } from '../../hooks/use-api';
import { Source } from '@notebook/shared';

const SourceIcon = ({ type, faviconUrl }: { type: string; faviconUrl?: string }) => {
  if (faviconUrl) {
    return <Image source={{ uri: faviconUrl }} style={styles.sourceIcon} />;
  }

  const iconMap: Record<string, string> = {
    pdf: 'file-pdf-box',
    audio: 'music-box',
    image: 'image',
    website: 'web',
    youtube: 'youtube',
    copied_text: 'text-box',
  };

  return (
    <View style={styles.sourceIconContainer}>
      <IconButton
        icon={iconMap[type] || 'file-document'}
        size={24}
        iconColor={theme.colors.accentBlue}
      />
    </View>
  );
};

const SourceItem = ({ source, onPress }: { source: Source; onPress: () => void }) => {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.sourceItem} onPress={onPress}>
      <SourceIcon type={source.type} faviconUrl={source.faviconUrl} />
      <View style={styles.sourceContent}>
        <Text style={styles.sourceTitle} numberOfLines={1}>
          {source.title}
        </Text>
        <Text style={styles.sourceSubtitle}>
          {source.type.replace('_', ' ')} • {formatDate(source.createdAt)}
        </Text>
      </View>
      <IconButton icon="chevron-right" size={20} iconColor={theme.colors.muted} />
    </TouchableOpacity>
  );
};

export default function SourcesListScreen() {
  const navigation = useNavigation();
  const currentProject = useAppStore((state) => state.currentProject);
  const { data: sources, isLoading, refetch } = useSources(currentProject?.id || '');

  const handleAddSource = () => {
    navigation.navigate('AddSource' as never);
  };

  const handleSourcePress = (source: Source) => {
    navigation.navigate('SourceDetail' as never, { sourceId: source.id } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {currentProject?.title || 'My Notebook'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {sources?.length || 0} sources
          </Text>
        </View>
        <IconButton
          icon="dots-vertical"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => {}}
        />
      </View>

      {/* Summary (optional) */}
      {currentProject?.description && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>{currentProject.description}</Text>
        </View>
      )}

      {/* Sources List */}
      <FlatList
        data={sources || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SourceItem source={item} onPress={() => handleSourcePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.accentBlue} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconButton
              icon="book-open-variant"
              size={48}
              iconColor={theme.colors.muted}
            />
            <Text style={styles.emptyTitle}>No sources yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first source to get started
            </Text>
          </View>
        }
      />

      {/* Bottom Add Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cameraButton}>
          <IconButton icon="camera" size={24} iconColor={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSource}>
          <IconButton icon="plus" size={24} iconColor={theme.colors.bg} />
          <Text style={styles.addButtonText}>Add a source</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.muted,
    marginTop: 4,
  },
  summaryContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  summaryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
    lineHeight: theme.typography.body.lineHeight,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  sourceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
  },
  sourceContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  sourceTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sourceSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
    paddingTop: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    height: 56,
  },
  addButtonText: {
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    color: theme.colors.bg,
    marginLeft: -8,
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
