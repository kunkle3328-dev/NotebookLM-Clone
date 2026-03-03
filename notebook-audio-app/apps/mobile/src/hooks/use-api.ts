import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAppStore } from '../stores/app-store';

// Projects
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.projects.list();
      return response.data.data;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await api.projects.get(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Sources
export const useSources = (projectId: string) => {
  return useQuery({
    queryKey: ['sources', projectId],
    queryFn: async () => {
      const response = await api.projects.sources(projectId);
      return response.data.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      type,
      data,
    }: {
      projectId: string;
      type: string;
      data: any;
    }) => {
      switch (type) {
        case 'url':
          return api.sources.createUrl(projectId, data);
        case 'youtube':
          return api.sources.createYoutube(projectId, data);
        case 'text':
          return api.sources.createText(projectId, data);
        default:
          throw new Error(`Unknown source type: ${type}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sources', variables.projectId] });
    },
  });
};

export const useSearchWeb = () => {
  return useMutation({
    mutationFn: (query: string) => api.sources.searchWeb(query),
  });
};

// Chat
export const useChatHistory = (projectId: string) => {
  return useQuery({
    queryKey: ['messages', projectId],
    queryFn: async () => {
      const response = await api.chat.history(projectId);
      return response.data.data;
    },
    enabled: !!projectId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      message: string;
      selectedSourceIds?: string[];
    }) => api.chat.send(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.projectId] });
    },
  });
};

// Generations
export const useGenerations = (projectId: string) => {
  return useQuery({
    queryKey: ['generations', projectId],
    queryFn: async () => {
      const response = await api.projects.generations(projectId);
      return response.data.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateGeneration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      type: string;
      title: string;
      settings: any;
    }) => api.generations.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generations', variables.projectId] });
    },
  });
};

export const useRateGeneration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      liked,
      feedback,
    }: {
      id: string;
      liked: boolean;
      feedback?: string;
    }) => api.generations.rate(id, { liked, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
    },
  });
};

export const useRegenerate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.generations.regenerate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
    },
  });
};
