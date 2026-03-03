import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useGenerations, useRegenerate } from '../../hooks/use-api';
import { useAppStore } from '../../stores/app-store';
import { Generation } from '@notebook/shared';

// Flashcard Viewer Component
const FlashcardsViewer = ({ data }: { data: any }) => (
  <View style={styles.viewerContainer}>
    {data?.flashcards?.map((card: any, index: number) => (
      <View key={index} style={styles.flashcard}>
        <View style={styles.flashcardFront}>
          <Text style={styles.flashcardNumber}>Card {index + 1}</Text>
          <Text style={styles.flashcardQuestion}>{card.question}</Text>
        </View>
        <View style={styles.flashcardDivider} />
        <View style={styles.flashcardBack}>
          <Text style={styles.flashcardAnswer}>{card.answer}</Text>
        </View>
      </View>
    ))}
  </View>
);

// Quiz Viewer Component
const QuizViewer = ({ data }: { data: any }) => {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [showResults, setShowResults] = React.useState<Record<number, boolean>>({});

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setShowResults((prev) => ({ ...prev, [questionIndex]: true }));
  };

  return (
    <View style={styles.viewerContainer}>
      {data?.questions?.map((q: any, qIndex: number) => (
        <View key={qIndex} style={styles.quizQuestion}>
          <Text style={styles.quizQuestionText}>
            {qIndex + 1}. {q.question}
          </Text>
          <View style={styles.quizOptions}>
            {q.options.map((option: string, oIndex: number) => {
              const isSelected = selectedAnswers[qIndex] === oIndex;
              const isCorrect = q.correctAnswer === oIndex;
              const showResult = showResults[qIndex];

              return (
                <TouchableOpacity
                  key={oIndex}
                  style={[
                    styles.quizOption,
                    showResult && isCorrect && styles.quizOptionCorrect,
                    showResult && isSelected && !isCorrect && styles.quizOptionWrong,
                    isSelected && !showResult && styles.quizOptionSelected,
                  ]}
                  onPress={() => handleSelect(qIndex, oIndex)}
                  disabled={showResult}
                >
                  <Text
                    style={[
                      styles.quizOptionText,
                      showResult && isCorrect && styles.quizOptionTextCorrect,
                      showResult && isSelected && !isCorrect && styles.quizOptionTextWrong,
                    ]}
                  >
                    {String.fromCharCode(65 + oIndex)}. {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {showResults[qIndex] && (
            <View style={styles.quizExplanation}>
              <Text style={styles.quizExplanationText}>{q.explanation}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

// Infographic Viewer Component
const InfographicViewer = ({ data }: { data: any }) => (
  <View style={styles.viewerContainer}>
    <View style={styles.infographicHeader}>
      <Text style={styles.infographicTitle}>{data?.title}</Text>
      <Text style={styles.infographicSubtitle}>{data?.subtitle}</Text>
    </View>
    {data?.sections?.map((section: any, index: number) => (
      <View key={index} style={styles.infographicSection}>
        <View
          style={[
            styles.infographicSectionIcon,
            { backgroundColor: section.color || theme.colors.accentBlue },
          ]}
        >
          <IconButton icon={section.icon || 'information'} size={20} iconColor={theme.colors.text} />
        </View>
        <View style={styles.infographicSectionContent}>
          <Text style={styles.infographicSectionTitle}>{section.title}</Text>
          <Text style={styles.infographicSectionText}>{section.content}</Text>
        </View>
      </View>
    ))}
  </View>
);

// Slide Deck Viewer Component
const SlideDeckViewer = ({ data }: { data: any }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slides = data?.slides || [];

  return (
    <View style={styles.viewerContainer}>
      <View style={styles.slideContainer}>
        <Text style={styles.slideTitle}>{slides[currentSlide]?.title}</Text>
        <Text style={styles.slideContent}>{slides[currentSlide]?.content}</Text>
        {slides[currentSlide]?.bulletPoints?.map((point: string, index: number) => (
          <View key={index} style={styles.slideBullet}>
            <Text style={styles.slideBulletText}>• {point}</Text>
          </View>
        ))}
      </View>
      <View style={styles.slideControls}>
        <IconButton
          icon="chevron-left"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
        />
        <Text style={styles.slideCounter}>
          {currentSlide + 1} / {slides.length}
        </Text>
        <IconButton
          icon="chevron-right"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
        />
      </View>
    </View>
  );
};

export default function GenerationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { generationId, type } = route.params as { generationId: string; type: string };
  const currentProject = useAppStore((state) => state.currentProject);
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack);

  const { data: generations } = useGenerations(currentProject?.id || '');
  const regenerate = useRegenerate();

  const generation = generations?.find((g: Generation) => g.id === generationId);

  if (!generation) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Generation not found</Text>
      </SafeAreaView>
    );
  }

  const handlePlay = () => {
    setCurrentTrack(generation);
    navigation.navigate('Player' as never, { generationId } as never);
  };

  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync(generationId);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    }
  };

  const renderViewer = () => {
    switch (type) {
      case 'flashcards':
        return <FlashcardsViewer data={generation.result} />;
      case 'quiz':
        return <QuizViewer data={generation.result} />;
      case 'infographic':
        return <InfographicViewer data={generation.result} />;
      case 'slide_deck':
        return <SlideDeckViewer data={generation.result} />;
      default:
        return (
          <View style={styles.placeholderViewer}>
            <Text style={styles.placeholderText}>
              View not available for this generation type
            </Text>
          </View>
        );
    }
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
          {generation.title}
        </Text>
        <IconButton
          icon="dots-vertical"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => {}}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              generation.status === 'completed' && styles.statusCompleted,
              generation.status === 'processing' && styles.statusProcessing,
              generation.status === 'failed' && styles.statusFailed,
            ]}
          >
            <Text style={styles.statusText}>
              {generation.status.charAt(0).toUpperCase() + generation.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Content Viewer */}
        {generation.status === 'completed' && renderViewer()}

        {generation.status === 'processing' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accentBlue} />
            <Text style={styles.loadingText}>Generating...</Text>
          </View>
        )}

        {generation.status === 'failed' && (
          <View style={styles.errorContainer}>
            <IconButton icon="alert-circle" size={48} iconColor={theme.colors.error} />
            <Text style={styles.errorText}>Generation failed</Text>
            <Text style={styles.errorSubtext}>{generation.error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      {generation.status === 'completed' && (
        <View style={styles.footer}>
          {type === 'audio_overview' && (
            <Button
              mode="contained"
              onPress={handlePlay}
              style={styles.actionButton}
              buttonColor={theme.colors.accentBlue}
              textColor={theme.colors.text}
              icon="play"
            >
              Play
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={handleRegenerate}
            loading={regenerate.isPending}
            style={styles.actionButton}
            textColor={theme.colors.text}
            icon="refresh"
          >
            Regenerate
          </Button>
        </View>
      )}
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
  statusContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
  },
  statusCompleted: {
    backgroundColor: theme.colors.success + '30',
  },
  statusProcessing: {
    backgroundColor: theme.colors.accentBlue + '30',
  },
  statusFailed: {
    backgroundColor: theme.colors.error + '30',
  },
  statusText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  viewerContainer: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  errorText: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.error,
    marginTop: theme.spacing.md,
  },
  errorSubtext: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flex: 1,
    borderColor: theme.colors.border,
  },
  // Flashcard styles
  flashcard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  flashcardFront: {
    padding: theme.spacing.lg,
  },
  flashcardNumber: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  flashcardQuestion: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  flashcardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  flashcardBack: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card2,
  },
  flashcardAnswer: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
  },
  // Quiz styles
  quizQuestion: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  quizQuestionText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quizOptions: {
    gap: theme.spacing.sm,
  },
  quizOption: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quizOptionSelected: {
    borderColor: theme.colors.accentBlue,
  },
  quizOptionCorrect: {
    backgroundColor: theme.colors.success + '30',
    borderColor: theme.colors.success,
  },
  quizOptionWrong: {
    backgroundColor: theme.colors.error + '30',
    borderColor: theme.colors.error,
  },
  quizOptionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  quizOptionTextCorrect: {
    color: theme.colors.success,
  },
  quizOptionTextWrong: {
    color: theme.colors.error,
  },
  quizExplanation: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card2,
    borderRadius: theme.borderRadius.md,
  },
  quizExplanationText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.muted,
  },
  // Infographic styles
  infographicHeader: {
    marginBottom: theme.spacing.lg,
  },
  infographicTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infographicSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
  },
  infographicSection: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infographicSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infographicSectionContent: {
    flex: 1,
  },
  infographicSectionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infographicSectionText: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.muted,
    lineHeight: theme.typography.bodySmall.lineHeight,
  },
  // Slide deck styles
  slideContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  slideTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  slideContent: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
    marginBottom: theme.spacing.md,
  },
  slideBullet: {
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  slideBulletText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  slideControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  slideCounter: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
  },
  placeholderViewer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  placeholderText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
  },
});
