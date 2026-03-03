import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import { theme } from '../../theme';
import { useAppStore } from '../../stores/app-store';
import { useCreateSource, useSearchWeb } from '../../hooks/use-api';
import { WebSearchResult } from '@notebook/shared';

const SourceTypeButton = ({
  icon,
  label,
  onPress,
  color = theme.colors.accentBlue,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.typeButton} onPress={onPress}>
    <View style={[styles.typeIconContainer, { backgroundColor: color + '20' }]}>
      <IconButton icon={icon} size={28} iconColor={color} />
    </View>
    <Text style={styles.typeLabel}>{label}</Text>
  </TouchableOpacity>
);

const SearchResultItem = ({
  result,
  onPress,
}: {
  result: WebSearchResult;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.searchResult} onPress={onPress}>
    <View style={styles.searchResultHeader}>
      {result.favicon && (
        <Image source={{ uri: result.favicon }} style={styles.favicon} />
      )}
      <Text style={styles.searchResultSite}>{result.site}</Text>
    </View>
    <Text style={styles.searchResultTitle} numberOfLines={2}>
      {result.title}
    </Text>
    <Text style={styles.searchResultSnippet} numberOfLines={2}>
      {result.snippet}
    </Text>
  </TouchableOpacity>
);

export default function AddSourceSheet() {
  const navigation = useNavigation();
  const currentProject = useAppStore((state) => state.currentProject);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const createSource = useCreateSource();
  const searchWeb = useSearchWeb();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await searchWeb.mutateAsync(searchQuery);
      setSearchResults(response.data.data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddUrl = async (result: WebSearchResult) => {
    if (!currentProject) return;

    try {
      await createSource.mutateAsync({
        projectId: currentProject.id,
        type: 'url',
        data: { url: result.url, title: result.title },
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const handlePickDocument = async (type: 'pdf' | 'audio' | 'image') => {
    if (!currentProject) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'pdf' 
          ? 'application/pdf'
          : type === 'audio'
          ? 'audio/*'
          : 'image/*',
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);

      // TODO: Upload file using api.sources.uploadPdf/Audio/Image
      console.log('Selected file:', file);
      navigation.goBack();
    } catch (error) {
      console.error('Document pick failed:', error);
    }
  };

  const handleAddYoutube = () => {
    // TODO: Show YouTube URL input modal
    console.log('Add YouTube');
  };

  const handleAddText = () => {
    navigation.navigate('CopiedText' as never);
  };

  const handleAddWebsite = () => {
    // TODO: Show website URL input modal
    console.log('Add Website');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add a source</Text>
        <IconButton
          icon="close"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => navigation.goBack()}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          {/* Search Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Create audio overviews from your documents
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Find sources from the web"
                placeholderTextColor={theme.colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <IconButton
                  icon="send"
                  size={20}
                  iconColor={theme.colors.accentBlue}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Results */}
          {showSearchResults && (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Search Results</Text>
              {searchWeb.isPending ? (
                <ActivityIndicator color={theme.colors.accentBlue} />
              ) : (
                searchResults.map((result, index) => (
                  <SearchResultItem
                    key={index}
                    result={result}
                    onPress={() => handleAddUrl(result)}
                  />
                ))
              )}
            </View>
          )}

          {/* Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Or upload your files</Text>
            <View style={styles.typeGrid}>
              <SourceTypeButton
                icon="file-pdf-box"
                label="PDF"
                onPress={() => handlePickDocument('pdf')}
                color={theme.colors.error}
              />
              <SourceTypeButton
                icon="music-box"
                label="Audio"
                onPress={() => handlePickDocument('audio')}
                color={theme.colors.accentPurple}
              />
              <SourceTypeButton
                icon="image"
                label="Image"
                onPress={() => handlePickDocument('image')}
                color={theme.colors.accentGreen}
              />
              <SourceTypeButton
                icon="web"
                label="Website"
                onPress={handleAddWebsite}
                color={theme.colors.accentBlue}
              />
              <SourceTypeButton
                icon="youtube"
                label="YouTube"
                onPress={handleAddYoutube}
                color={theme.colors.error}
              />
              <SourceTypeButton
                icon="text-box"
                label="Copied text"
                onPress={handleAddText}
                color={theme.colors.muted}
              />
            </View>
          </View>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  keyboardView: {
    flex: 1,
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
  sectionSubtitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
  searchButton: {
    marginLeft: theme.spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.sm,
  },
  typeButton: {
    width: '33.33%',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeLabel: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text,
    textAlign: 'center',
  },
  searchResult: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  favicon: {
    width: 16,
    height: 16,
    marginRight: theme.spacing.xs,
  },
  searchResultSite: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.muted,
  },
  searchResultTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  searchResultSnippet: {
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.muted,
  },
});
