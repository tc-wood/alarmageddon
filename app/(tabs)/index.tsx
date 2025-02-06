import { useState, useEffect, useCallback } from "react";
import { StyleSheet, Platform, Image } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AlarmButton } from "@/components/alarm/AlarmButton";
import { AlarmStatus } from "@/components/alarm/AlarmStatus";
import { calculateDistance } from "@/utils/location";
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useSettings } from '@/app/context/SettingsContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

interface AlarmState {
  isActive: boolean;
  initialLocation: Location.LocationObject | null;
  sound: Audio.Sound | null;
  scheduledTime: Date | null;
  selectedTime: Date;
  showPicker: boolean;
}

export default function AlarmScreen() {
  const { alarmDistance } = useSettings();
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
          Notifications.requestPermissionsAsync(),
        ]);

        if (
          locationStatus.status !== "granted" ||
          !notificationStatus.granted
        ) {
          alert("Location and notification permissions are required");
        }
      } catch (error) {
        console.error("Permission error:", error);
      }
    })();
  }, []);

  const cleanupSound = async (sound: Audio.Sound | null) => {
    if (!sound) return;

    try {
      try {
        await sound.stopAsync();
      } catch (error) {}

      try {
        await sound.unloadAsync();
      } catch (error) {}
    } catch (error) {
      console.error("Sound cleanup error:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    return () => {
      isMounted = false;
      if (state.sound) {
        void cleanupSound(state.sound);
      }
    };
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
        accuracy: Location.Accuracy.High,
      });

      setState((prev) => ({
        ...prev,
        initialLocation: location,
        scheduledTime,
      }));

      const timeUntilAlarm = scheduledTime.getTime() - now.getTime();
      setTimeout(async () => {
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/alarm.mp3"),
          { isLooping: true, shouldPlay: true }
        );

        await Notifications.cancelAllScheduledNotificationsAsync();
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to move!",
            body: "Move to a different location to dismiss the alarm.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            repeats: false,
          },
        });

        setState((prev) => ({ ...prev, sound, isActive: true }));
      }, timeUntilAlarm);
    } catch (error) {
      console.error("Alarm error:", error);
      alert("Failed to set alarm");
    }
  }, [state.selectedTime]);

  const checkLocation = async () => {
    if (!state.initialLocation || !state.sound) return;

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const distance = calculateDistance(
        state.initialLocation.coords.latitude,
        state.initialLocation.coords.longitude,
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      if (distance > alarmDistance) {
        await cleanupSound(state.sound);

        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Alarm Dismissed!",
            body: "You've successfully moved and dismissed the alarm",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            repeats: false,
          },
        });

        setState((prev) => ({
          ...prev,
          isActive: false,
          initialLocation: null,
          sound: null,
          scheduledTime: null,
        }));
      }
    } catch (error) {
      console.error("Location check error:", error);
    }
  };

  const cancelAlarm = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setState((prev) => ({ ...prev, scheduledTime: null }));
  };

  const renderAlarmStatus = () => {
    if (!state.isActive && !state.scheduledTime) {
      return (
        <ThemedView style={styles.buttonContainer}>
          {Platform.OS === "android" && (
            <ThemedText style={styles.timeText}>
              {state.selectedTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </ThemedText>
          )}

          {Platform.OS === "ios" ? (
            <DateTimePicker
              value={state.selectedTime}
              mode="time"
              is24Hour={true}
              onChange={(_, date) => {
                setState((prev) => ({
                  ...prev,
                  selectedTime: date || prev.selectedTime,
                }));
              }}
              style={[styles.picker, { transform: [{ scale: 1.3 }] }]}
            />
          ) : (
            <AlarmButton
              onPress={() =>
                setState((prev) => ({ ...prev, showPicker: true }))
              }
              text="Select Time"
              icon="time-outline"
              size="large"
            />
          )}

          {Platform.OS === "android" && state.showPicker && (
            <DateTimePicker
              value={state.selectedTime}
              mode="time"
              is24Hour={true}
              onChange={(_, date) => {
                setState((prev) => ({
                  ...prev,
                  showPicker: false,
                  selectedTime: date || prev.selectedTime,
                }));
              }}
            />
          )}

          <AlarmButton
            onPress={scheduleAlarm}
            text="Start Alarm"
            variant="secondary"
            textStyle={styles.startButtonText}
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

  const renderAlarmContent = () => {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" lightColor="black" darkColor="#f5b3a4">Alarmageddon</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle} lightColor="#black" darkColor="white">
            An increasingly-annoying alarm that only shuts up when you get up.
          </ThemedText>
        </ThemedView>
        {renderAlarmStatus()}
      </ThemedView>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#f09580", dark: "#f09580" }}
      headerImage={
        <ThemedView style={styles.headerImageContainer}>
          <ThemedView style={[styles.imageWrapper, { backgroundColor: 'transparent' }]}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={[styles.headerImage, { opacity: 0.8 }]}
              resizeMode="contain"
            />
          </ThemedView>
        </ThemedView>
      }>
      {renderAlarmContent()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  timeText: {
    fontSize: 24,
    marginTop: 10,
  },
  picker: {
    marginTop: 10,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerImageContainer: {
    position: 'absolute',
    bottom: -90,
    left: -35,
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    width: 310,
    height: 310,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 16,
  },
});
