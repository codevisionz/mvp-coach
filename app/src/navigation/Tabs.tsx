import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabsParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import JournalScreen from '../screens/JournalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import ChatStack from './ChatStack';

const Tab = createBottomTabNavigator<TabsParamList>();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarIcon: ({ focused, size, color }) => {
          const map: Record<keyof TabsParamList, string> = {
            Home: focused ? 'home' : 'home-outline',
            Journal: focused ? 'book' : 'book-outline',
            Chat: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          
          const icon = map[route.name] ?? 'ellipse';
          return <Ionicons name={icon as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: 'Journal' }} />
      <Tab.Screen name="Chat" component={ChatStack} options={{ title: 'Chat' }} />
      <Tab.Screen name="Profile" component={SettingsScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
