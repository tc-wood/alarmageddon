import { StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSettings } from '@/app/context/SettingsContext';

export default function SettingsScreen() {
  const { alarmDistance, setAlarmDistance } = useSettings();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gear"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.settingContainer}>
          <ThemedText style={styles.settingTitle}>Alarm Distance</ThemedText>
          <ThemedText style={styles.settingValue}>
            {alarmDistance.toFixed(1)} m
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={alarmDistance}
            onValueChange={setAlarmDistance}
          />
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  settingContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  settingValue: {
    fontSize: 16,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
