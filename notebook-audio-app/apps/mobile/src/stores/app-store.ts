import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { Project, Source, Generation, Message } from '@notebook/shared';

const storage = new MMKV();

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

interface AppState {
  // Auth
  token: string | null;
  deviceId: string | null;
  setToken: (token: string | null) => void;
  setDeviceId: (deviceId: string | null) => void;

  // Current Project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Sources
  sources: Source[];
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  removeSource: (id: string) => void;

  // Generations
  generations: Generation[];
  setGenerations: (generations: Generation[]) => void;
  addGeneration: (generation: Generation) => void;
  updateGeneration: (id: string, updates: Partial<Generation>) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  // Player
  currentTrack: Generation | null;
  isPlaying: boolean;
  playbackSpeed: number;
  setCurrentTrack: (track: Generation | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  // UI
  selectedSourceIds: string[];
  setSelectedSourceIds: (ids: string[]) => void;
  toggleSourceSelection: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      deviceId: null,
      setToken: (token) => set({ token }),
      setDeviceId: (deviceId) => set({ deviceId }),

      // Current Project
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      // Sources
      sources: [],
      setSources: (sources) => set({ sources }),
      addSource: (source) => set((state) => ({ 
        sources: [source, ...state.sources] 
      })),
      removeSource: (id) => set((state) => ({ 
        sources: state.sources.filter((s) => s.id !== id) 
      })),

      // Generations
      generations: [],
      setGenerations: (generations) => set({ generations }),
      addGeneration: (generation) => set((state) => ({ 
        generations: [generation, ...state.generations] 
      })),
      updateGeneration: (id, updates) => set((state) => ({
        generations: state.generations.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      })),

      // Messages
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),
      clearMessages: () => set({ messages: [] }),

      // Player
      currentTrack: null,
      isPlaying: false,
      playbackSpeed: 1.0,
      setCurrentTrack: (track) => set({ currentTrack: track }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      // UI
      selectedSourceIds: [],
      setSelectedSourceIds: (ids) => set({ selectedSourceIds: ids }),
      toggleSourceSelection: (id) => set((state) => ({
        selectedSourceIds: state.selectedSourceIds.includes(id)
          ? state.selectedSourceIds.filter((sid) => sid !== id)
          : [...state.selectedSourceIds, id],
      })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        token: state.token,
        deviceId: state.deviceId,
        currentProject: state.currentProject,
        playbackSpeed: state.playbackSpeed,
      }),
    }
  )
);
