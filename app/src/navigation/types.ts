export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  Login: undefined;   // nur wenn direkt am Root, wir machen es aber im AuthStack
  Signup: undefined;
};

export type TabsParamList = {
  Home: undefined;
  Journal: undefined;
  Chat: undefined;  
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type ChatStackParamList = {
  Conversations: undefined;
  Chat: { conversationId?: string } | undefined;
};