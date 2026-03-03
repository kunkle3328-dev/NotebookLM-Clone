import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';
import { useGenerations, useCreateGeneration } from '../../hooks/use-api';
import { Generation, GenerationType, GenerationSettings } from '@notebook/shared';
import GenerationConfigSheet from './GenerationConfigSheet';

const GENERATION_TYPES: {
  type: GenerationType;
  name: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    type: 'audio_overview',
    name: 'Audio Overview',
    icon: 'headphones',
    color: theme.colors.accentBlue,
    description: 'Two hosts discuss your sources',
  },
  {
    type: 'video_overview',
    name: 'Video Overview',
    icon: 'video',
    color: theme.colors.accentPurple,
    description: 'Visual story with narration',
  },
  {
    type: 'flashcards',
    name: 'Flashcards',
    icon: 'cards',
    color: theme.colors.accentGreen,
    description: 'Study cards for quick review',
  },
  {
    type: 'quiz',
    name: 'Quiz',
    icon: 'help-circle',
    color: theme.colors.accentOrange,
    description: 'Test your knowledge',
  },
  {
    type: 'infographic',
    name: 'Infographic',
    icon: 'chart-bar',
    color: theme.colors.error,
    description: 'Visual summary of key points',
  },
  {
    type: 'slide_deck',
    name: 'Slide Deck',
    icon: 'presentation',
    color: theme.colors.accentBlue,
    description: 'Presentation-ready slides',
  },
];

const GenerationTile = ({
  type,
  onPress,
  onEdit,
}: {
  type: (typeof GENERATION_TYPES)[0];
  onPress: () => void;
  onEdit: () => void;
}) => (
  <TouchableOpacity style={styles.tile} onPress={onPress}>
    <View style={[styles.tileIconContainer, { backgroundColor: type.color + '20' }]}>
      <IconButton icon={type.icon} size={28} iconColor={type.color} />
    </View>
    <View style={styles.tileContent}>
      <Text style={styles.tileTitle}>{type.name}</Text>
      <Text style={styles.tileDescription}>{type.description}</Text>
    </View>
    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
      <IconButton icon="pencil" size={18} iconColor={theme.colors.muted} />
    </TouchableOpacity>
  </TouchableOpacity>
);

const GenerationItem = ({
  generation,
  onPress,
  onPlay,
}: {
  generation: Generation;
  onPress: () => void;
  onPlay: () => void;
}) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const iconMap: Record<string, string> = {
    audio_overview: 'headphones',
    video_overview: 'video',
    flashcards: 'cards',
    quiz: 'help-circle',
    infographic: 'chart-bar',
    slide_deck: 'presentation',
  };

  return (
    <TouchableOpacity style={styles.generationItem} onPress={onPress}>
      <View style={styles.generationIcon}>
        <IconButton
          icon={iconMap[generation.type] || 'file-document'}
          size={24}
          iconColor={theme.colors.accentBlue}
        />
      </View>
      <View style={styles.generationContent}>
        <Text style={styles.generationTitle} numberOfLines={1}>
          {generation.title}
        </Text>
        <Text style={styles.generationSubtitle}>
          {generation.metadata?.duration ? formatDuration(generation.metadata.duration) : ''}
          {generation.metadata?.sourceCount ? ` • ${generation.metadata.sourceCount} sources` : ''}
          {` • ${formatDate(generation.createdAt)}`}
        </Text>
      </View>
      <View style={styles.generationActions}>
        <TouchableOpacity style={styles.actionButton}>
          <IconButton icon="dots-vertical" size={20} iconColor={theme.colors.muted} />
        </TouchableOpacity>
        {generation.type === 'audio_overview' && generation.status === 'completed' && (
          <TouchableOpacity style={styles.playButton} onPress={onPlay}>
            <IconButton icon="play" size={20} iconColor={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function StudioScreen() {
  const navigation = useNavigation();
  const currentProject = useAppStore((state) => state.currentProject);
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack);
  
  const [selectedType, setSelectedType] = useState<GenerationType | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [editingType, setEditingType] = useState<GenerationType | null>(null);

  const { data: generations, isLoading } = useGenerations(currentProject?.id || '');
  const createGeneration = useCreateGeneration();

  const handleTilePress = (type: GenerationType) => {
    setSelectedType(type);
    setShowConfig(true);
  };

  const handleEditPress = (type: GenerationType) => {
    setEditingType(type);
    navigation.navigate('TemplateEditor' as never, { generationType: type } as never);
  };

  const handleGenerate = async (settings: GenerationSettings) => {
    if (!currentProject || !selectedType) return;

    try {
      await createGeneration.mutateAsync({
        projectId: currentProject.id,
        type: selectedType,
        title: `${GENERATION_TYPES.find(t => t.type === selectedType)?.name} - ${new Date().toLocaleDateString()}`,
        settings,
      });
      setShowConfig(false);
    } catch (error) {
      console.error('Failed to create generation:', error);
    }
  };

  const handlePlay = (generation: Generation) => {
    setCurrentTrack(generation);
    navigation.navigate('Player' as never, { generationId: generation.id } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Studio</Text>
        <IconButton
          icon="dots-vertical"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => {}}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Generate New Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate new</Text>
          <View style={styles.tilesContainer}>
            {GENERATION_TYPES.map((type) => (
              <GenerationTile
                key={type.type}
                type={type}
                onPress={() => handleTilePress(type.type)}
                onEdit={() => handleEditPress(type.type)}
              />
            ))}
          </View>
        </View>

        {/* Generated Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated media</Text>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.accentBlue} />
          ) : (
            generations?.map((generation: Generation) => (
              <GenerationItem
                key={generation.id}
                generation={generation}
                onPress={() => 
                  navigation.navigate('GenerationDetail' as never, { 
                    generationId: generation.id,
                    type: generation.type,
                  } as never)
                }
                onPlay={() => handlePlay(generation)}
              />
            ))
          )}
          {!isLoading && (!generations || generations.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No generations yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first audio overview or other content
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Config Sheet */}
      <GenerationConfigSheet
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        onGenerate={handleGenerate}
        generationType={selectedType}
        isLoading={createGeneration.isPending}
      />
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tilesContainer: {
    gap: theme.spacing.sm,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  tileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  tileTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tileDescription: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginTop: 2,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  generationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  generationIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generationContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  generationTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  generationSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginTop: 2,
  },
  generationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: theme.spacing.xs,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
  },
  emptySubtext: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
});
