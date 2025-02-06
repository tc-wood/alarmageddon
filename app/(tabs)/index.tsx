import { Image, StyleSheet, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { Audio } from 'expo-av';
import { AlarmButton } from '@/components/alarm/AlarmButton';
import DateTimePicker from '@react-native-community/datetimepicker';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  })
});

interface AlarmState {
  isActive: boolean;
  initialLocation: Location.LocationObject | null;
  sound: Audio.Sound | null;
  scheduledTime: Date | null;
  selectedTime: Date;
  showPicker: boolean;
}



export default function HomeScreen() {
  const [state, setState] = useState<AlarmState>({
    isActive: false,
    initialLocation: null,
    sound: null,
    scheduledTime: null,
    selectedTime: new Date(),
    showPicker: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const [locationStatus, notificationStatus] = await Promise.all([
          Location.requestForegroundPermissionsAsync(),
          Notifications.requestPermissionsAsync()
        ]);
        
        if (locationStatus.status !== 'granted' || !notificationStatus.granted) {
          alert('Location and notification permissions are required');
        }
      } catch (error) {
        console.error('Permission error:', error);
      }
    })();
  }, []);

  useEffect(() => {
    return () => { state.sound?.unloadAsync(); };
  }, [state.sound]);

  // Location checking interval
  useEffect(() => {
    if (!state.isActive) return;
    const interval = setInterval(checkLocation, 5000);
    return () => clearInterval(interval);
  }, [state.isActive]);

  const scheduleAlarm = useCallback(async () => {
    try {
      const now = new Date();
      const scheduledTime = new Date();
      
      scheduledTime.setHours(state.selectedTime.getHours());
      scheduledTime.setMinutes(state.selectedTime.getMinutes());
      scheduledTime.setSeconds(0);
      
      if (scheduledTime.getTime() <= now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setState(prev => ({ ...prev, initialLocation: location, scheduledTime }));
      
      setTimeout(async () => {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/alarm.mp3'),
          { isLooping: true, shouldPlay: true }
        );
        
        setState(prev => ({ ...prev, sound, isActive: true }));
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Wake Up!",
            body: "Move to a different location to dismiss the alarm",
            sound: true,
          },
          trigger: null,
        });
      }, scheduledTime.getTime() - now.getTime());
    } catch (error) {
      console.error('Alarm error:', error);
      alert('Failed to set alarm');
    }
  }, [state.selectedTime]);

  const checkLocation = async () => {
    if (!state.initialLocation || !state.sound) return;
    
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const distance = calculateDistance(
        state.initialLocation.coords.latitude,
        state.initialLocation.coords.longitude,
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      if (distance > 0.5) {
        // First stop and unload the sound
        if (state.sound) {
          try {
            await state.sound.stopAsync();
            await state.sound.unloadAsync();
          } catch (error) {
            console.error('Sound cleanup error:', error);
          }
        }

        // Then cancel notifications and update state
        await Notifications.cancelAllScheduledNotificationsAsync();
        
        // Send dismissal notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Alarm Dismissed!",
            body: "You've successfully moved and dismissed the alarm",
            sound: true,
          },
          trigger: null,
        });

        // Finally update state
        setState(prev => ({
          ...prev,
          isActive: false,
          initialLocation: null,
          sound: null,
          scheduledTime: null
        }));
      }
    } catch (error) {
      console.error('Location check error:', error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <AlarmButton> </AlarmButton>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
