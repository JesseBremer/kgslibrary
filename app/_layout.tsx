import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { databaseService } from '../services/database';

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await databaseService.initialize();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1c1c1e',
        },
        headerTintColor: '#fff',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="book/[isbn]" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Book Details'
        }} 
      />
    </Stack>
  );
}