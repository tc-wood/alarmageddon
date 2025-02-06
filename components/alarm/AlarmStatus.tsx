import { StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface AlarmStatusProps {
  type: 'scheduled' | 'active';
  time?: Date;
}

export function AlarmStatus({ type, time }: AlarmStatusProps) {
  return (
    <ThemedView style={[
      styles.container,
      type === 'scheduled' ? styles.scheduledContainer : styles.activeContainer
    ]}>
      <ThemedText type="subtitle">
        {type === 'scheduled' ? 'Alarm Scheduled!' : 'Alarm Active!'}
      </ThemedText>
      {type === 'scheduled' && time && (
        <ThemedText>
          Alarm will ring at {time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </ThemedText>
      )}
      {type === 'active' && (
        <ThemedText>Move to a different location to dismiss</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  scheduledContainer: {
    backgroundColor: '#00ff0030',
  },
  activeContainer: {
    backgroundColor: '#ff000030',
  },
}); 