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
import { AlarmStatus } from '@/components/alarm/AlarmStatus';
import DateTimePicker from '@react-native-community/datetimepicker';
import { calculateDistance } from '@/utils/location';

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
        if (state.sound) {
          try {
            await state.sound.stopAsync();
            await state.sound.unloadAsync();
          } catch (error) {
            console.error('Sound cleanup error:', error);
          }
        }

        await Notifications.cancelAllScheduledNotificationsAsync();
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Alarm Dismissed!",
            body: "You've successfully moved and dismissed the alarm",
            sound: true,
          },
          trigger: null,
        });

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

  const cancelAlarm = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setState(prev => ({ ...prev, scheduledTime: null }));
  };

  const renderAlarmStatus = () => {
    if (!state.isActive && !state.scheduledTime) {
      return (
        <ThemedView style={styles.buttonContainer}>
          {Platform.OS === 'android' && (
            <ThemedText style={styles.timeText}>
              {state.selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
          )}

          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={state.selectedTime}
              mode="time"
              is24Hour={true}
              onChange={(_, date) => {
                setState(prev => ({
                  ...prev,
                  selectedTime: date || prev.selectedTime
                }));
              }}
              style={[styles.picker, { transform: [{ scale: 1.3 }] }]}
            />
          ) : (
            <AlarmButton 
              onPress={() => setState(prev => ({ ...prev, showPicker: true }))}
              text="Select Time"
              icon="time-outline"
              size="large"
            />
          )}

          {Platform.OS === 'android' && state.showPicker && (
            <DateTimePicker
              value={state.selectedTime}
              mode="time"
              is24Hour={true}
              onChange={(_, date) => {
                setState(prev => ({
                  ...prev,
                  showPicker: false,
                  selectedTime: date || prev.selectedTime
                }));
              }}
            />
          )}

          <AlarmButton 
            onPress={scheduleAlarm}
            text="Start Alarm"
            variant="secondary"
          />
        </ThemedView>
      );
    }

    if (!state.isActive && state.scheduledTime) {
      return (
        <ThemedView style={styles.buttonContainer}>
          <AlarmStatus type="scheduled" time={state.scheduledTime} />
          <AlarmButton 
            onPress={cancelAlarm}
            text="Cancel Alarm"
            variant="danger"
          />
        </ThemedView>
      );
    }

    return <AlarmStatus type="active" />;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Alarmageddon</ThemedText>
      {renderAlarmStatus()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timeText: {
    fontSize: 24,
    marginTop: 10,
  },
  picker: {
    marginTop: 10,
  },
});
