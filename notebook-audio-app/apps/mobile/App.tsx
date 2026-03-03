import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { paperTheme } from './src/theme/paper-theme';
import MainNavigator from './src/navigation/MainNavigator';
import { useAppStore } from './src/stores/app-store';
import { api } from './src/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Initialize app - create/get device token and default project
function AppInitializer() {
  const setDeviceId = useAppStore((state) => state.setDeviceId);
  const setToken = useAppStore((state) => state.setToken);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const setSources = useAppStore((state) => state.setSources);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Create or get device token
        const deviceId = useAppStore.getState().deviceId;
        const tokenResponse = await api.auth.createToken(deviceId);
        
        if (tokenResponse.data.data) {
          setDeviceId(tokenResponse.data.data.deviceId);
          setToken(tokenResponse.data.data.token);
        }

        // Get or create default project
        const projectsResponse = await api.projects.list();
        const projects = projectsResponse.data.data;

        if (projects && projects.length > 0) {
          setCurrentProject(projects[0]);
          
          // Load sources for the project
          const sourcesResponse = await api.projects.sources(projects[0].id);
          setSources(sourcesResponse.data.data || []);
        } else {
          // Create default project
          const newProject = await api.projects.create({
            title: 'My First Notebook',
            description: 'A collection of sources for learning and research',
          });
          setCurrentProject(newProject.data.data);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initialize();
  }, []);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="light" />
          <AppInitializer />
          <MainNavigator />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
