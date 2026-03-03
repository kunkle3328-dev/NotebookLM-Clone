export type RootStackParamList = {
  MainTabs: undefined;
  SourceDetail: { sourceId: string };
  Player: { generationId: string };
  GenerationDetail: { generationId: string; type: string };
  TemplateEditor: { generationType: string };
  AddSource: undefined;
  CopiedText: undefined;
};

export type MainTabParamList = {
  SourcesTab: undefined;
  ChatTab: undefined;
  StudioTab: undefined;
};

export type SourcesStackParamList = {
  SourcesList: undefined;
  SourceDetail: { sourceId: string };
};

export type ChatStackParamList = {
  ChatScreen: undefined;
};

export type StudioStackParamList = {
  StudioScreen: undefined;
  Player: { generationId: string };
  GenerationDetail: { generationId: string; type: string };
  TemplateEditor: { generationType: string };
};
