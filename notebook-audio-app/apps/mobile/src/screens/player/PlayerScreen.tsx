import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';
import { useGenerations } from '../../hooks/use-api';
import { Generation } from '@notebook/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WAVEFORM_WIDTH = SCREEN_WIDTH - 80;
const WAVEFORM_HEIGHT = 120;

// Animated Waveform Component
const Waveform = ({
  data,
  progress,
  isPlaying,
}: {
  data: number[];
  progress: number;
  isPlaying: boolean;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animatedValue.stopAnimation();
    }
  }, [isPlaying]);

  const generatePath = (values: number[], offset: number = 0) => {
    const barWidth = WAVEFORM_WIDTH / values.length;
    const maxBarHeight = WAVEFORM_HEIGHT / 2 - 10;
    
    let path = '';
    values.forEach((value, index) => {
      const x = index * barWidth + barWidth / 2;
      const height = Math.max(4, value * maxBarHeight * (1 + offset * 0.3));
      
      // Top bar
      path += `M ${x - 2} ${WAVEFORM_HEIGHT / 2 - height} `;
      path += `L ${x + 2} ${WAVEFORM_HEIGHT / 2 - height} `;
      path += `L ${x + 2} ${WAVEFORM_HEIGHT / 2} `;
      path += `L ${x - 2} ${WAVEFORM_HEIGHT / 2} Z `;
      
      // Bottom bar
      path += `M ${x - 2} ${WAVEFORM_HEIGHT / 2} `;
      path += `L ${x + 2} ${WAVEFORM_HEIGHT / 2} `;
      path += `L ${x + 2} ${WAVEFORM_HEIGHT / 2 + height} `;
      path += `L ${x - 2} ${WAVEFORM_HEIGHT / 2 + height} Z `;
    });
    
    return path;
  };

  const progressIndex = Math.floor(progress * data.length);
  const playedData = data.slice(0, progressIndex);
  const remainingData = data.slice(progressIndex);

  return (
    <View style={styles.waveformContainer}>
      <Svg width={WAVEFORM_WIDTH} height={WAVEFORM_HEIGHT}>
        {/* Played portion - Blue */}
        <Path
          d={generatePath(playedData)}
          fill={theme.colors.accentBlue}
        />
        {/* Remaining portion - Green */}
        <Path
          d={generatePath(remainingData, 0.5)}
          fill={theme.colors.accentGreen}
          translateX={progressIndex * (WAVEFORM_WIDTH / data.length)}
        />
      </Svg>
    </View>
  );
};

// Speed Selector
const SpeedButton = ({
  speed,
  selected,
  onPress,
}: {
  speed: number;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.speedButton, selected && styles.speedButtonSelected]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.speedButtonText,
        selected && styles.speedButtonTextSelected,
      ]}
    >
      {speed}x
    </Text>
  </TouchableOpacity>
);

export default function PlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { generationId } = route.params as { generationId: string };
  
  const currentProject = useAppStore((state) => state.currentProject);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const playbackSpeed = useAppStore((state) => state.playbackSpeed);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const setPlaybackSpeed = useAppStore((state) => state.setPlaybackSpeed);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [liked, setLiked] = useState<boolean | null>(null);

  const { data: generations } = useGenerations(currentProject?.id || '');
  const generation = generations?.find((g: Generation) => g.id === generationId);

  useEffect(() => {
    if (generation?.assets?.waveformUrl) {
      // Load waveform data
      fetch(generation.assets.waveformUrl)
        .then((res) => res.json())
        .then((data) => setWaveformData(data))
        .catch((err) => console.error('Failed to load waveform:', err));
    }

    if (generation?.metadata?.duration) {
      setDuration(generation.metadata.duration);
    }
  }, [generation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playbackSpeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + seconds)));
  };

  const handleDownload = async () => {
    if (!generation?.assets?.audioUrl) return;
    
    try {
      const filename = generation.title.replace(/[^a-z0-9]/gi, '_') + '.mp3';
      const downloadPath = FileSystem.documentDirectory + filename;
      
      await FileSystem.downloadAsync(generation.assets.audioUrl, downloadPath);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadPath);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  if (!generation) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Generation not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {generation.title}
        </Text>
        <IconButton
          icon="download"
          size={24}
          iconColor={theme.colors.text}
          onPress={handleDownload}
        />
      </View>

      {/* Waveform */}
      <View style={styles.waveformSection}>
        {waveformData.length > 0 ? (
          <Waveform
            data={waveformData}
            progress={progress}
            isPlaying={isPlaying}
          />
        ) : (
          <View style={styles.waveformPlaceholder}>
            <Text style={styles.waveformPlaceholderText}>
              No waveform available
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        {/* Speed & Rating */}
        <View style={styles.topControls}>
          <View style={styles.speedControls}>
            {[0.5, 1, 1.5, 2].map((speed) => (
              <SpeedButton
                key={speed}
                speed={speed}
                selected={playbackSpeed === speed}
                onPress={() => setPlaybackSpeed(speed)}
              />
            ))}
          </View>
          <View style={styles.ratingControls}>
            <TouchableOpacity
              style={[styles.ratingButton, liked === true && styles.ratingButtonActive]}
              onPress={() => setLiked(liked === true ? null : true)}
            >
              <IconButton
                icon={liked === true ? 'thumb-up' : 'thumb-up-outline'}
                size={24}
                iconColor={liked === true ? theme.colors.accentBlue : theme.colors.muted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, liked === false && styles.ratingButtonActive]}
              onPress={() => setLiked(liked === false ? null : false)}
            >
              <IconButton
                icon={liked === false ? 'thumb-down' : 'thumb-down-outline'}
                size={24}
                iconColor={liked === false ? theme.colors.error : theme.colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrubber */}
        <View style={styles.scrubberContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Transport Controls */}
        <View style={styles.transportControls}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSkip(-10)}
          >
            <Text style={styles.skipButtonText}>-10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <IconButton
              icon={isPlaying ? 'pause' : 'play'}
              size={32}
              iconColor={theme.colors.bg}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSkip(10)}
          >
            <Text style={styles.skipButtonText}>+10s</Text>
          </TouchableOpacity>
        </View>
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
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  waveformSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    width: WAVEFORM_WIDTH,
    height: WAVEFORM_HEIGHT,
  },
  waveformPlaceholder: {
    width: WAVEFORM_WIDTH,
    height: WAVEFORM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
  },
  waveformPlaceholderText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.muted,
  },
  controlsSection: {
    padding: theme.spacing.lg,
    paddingBottom: 50,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  speedControls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  speedButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
  },
  speedButtonSelected: {
    backgroundColor: theme.colors.accentBlue,
  },
  speedButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    fontWeight: '500',
  },
  speedButtonTextSelected: {
    color: theme.colors.text,
  },
  ratingControls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: theme.colors.card2,
  },
  scrubberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timeText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
    width: 45,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.card,
    borderRadius: 2,
    marginHorizontal: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accentBlue,
    borderRadius: 2,
  },
  transportControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  skipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
