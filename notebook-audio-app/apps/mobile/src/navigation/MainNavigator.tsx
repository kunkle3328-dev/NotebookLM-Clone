import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { RootStackParamList, MainTabParamList } from './types';

// Screens
import SourcesListScreen from '../screens/sources/SourcesListScreen';
import SourceDetailScreen from '../screens/sources/SourceDetailScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import StudioScreen from '../screens/studio/StudioScreen';
import PlayerScreen from '../screens/player/PlayerScreen';
import GenerationDetailScreen from '../screens/studio/GenerationDetailScreen';
import TemplateEditorModal from '../screens/studio/TemplateEditorModal';
import AddSourceSheet from '../screens/sources/AddSourceSheet';
import CopiedTextScreen from '../screens/sources/CopiedTextScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab icons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <IconButton
    icon={name}
    size={24}
    iconColor={focused ? theme.colors.accentBlue : theme.colors.muted}
  />
);

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.accentBlue,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="SourcesTab"
        component={SourcesStack}
        options={{
          tabBarLabel: 'Sources',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="book-open-variant" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chat" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="StudioTab"
        component={StudioStack}
        options={{
          tabBarLabel: 'Studio',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="creation" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Sources Stack
const SourcesStackNav = createNativeStackNavigator();
function SourcesStack() {
  return (
    <SourcesStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
      }}
    >
      <SourcesStackNav.Screen
        name="SourcesList"
        component={SourcesListScreen}
        options={{ headerShown: false }}
      />
      <SourcesStackNav.Screen
        name="SourceDetail"
        component={SourceDetailScreen}
        options={{ title: 'Source' }}
      />
    </SourcesStackNav.Navigator>
  );
}

// Chat Stack
const ChatStackNav = createNativeStackNavigator();
function ChatStack() {
  return (
    <ChatStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
      }}
    >
      <ChatStackNav.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
    </ChatStackNav.Navigator>
  );
}

// Studio Stack
const StudioStackNav = createNativeStackNavigator();
function StudioStack() {
  return (
    <StudioStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
      }}
    >
      <StudioStackNav.Screen
        name="StudioScreen"
        component={StudioScreen}
        options={{ headerShown: false }}
      />
      <StudioStackNav.Screen
        name="Player"
        component={PlayerScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <StudioStackNav.Screen
        name="GenerationDetail"
        component={GenerationDetailScreen}
        options={{ title: 'Generation' }}
      />
      <StudioStackNav.Screen
        name="TemplateEditor"
        component={TemplateEditorModal}
        options={{ 
          title: 'Edit Template',
          presentation: 'modal',
        }}
      />
    </StudioStackNav.Navigator>
  );
}

// Root Navigator
export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { color: theme.colors.text },
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddSource"
          component={AddSourceSheet}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CopiedText"
          component={CopiedTextScreen}
          options={{ title: 'Add Text' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
