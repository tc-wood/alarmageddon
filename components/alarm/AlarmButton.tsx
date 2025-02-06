import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";

interface AlarmButtonProps {
    onPress: () => void;
    text: string;
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'normal' | 'large';
  }
  
  export function AlarmButton({ 
    onPress, 
    text, 
    icon, 
    color = 'red',
    variant = 'primary',
    size = 'normal'
  }: AlarmButtonProps) {
    const getStyle = () => {
      const baseStyle = {
        ...styles[variant === 'secondary' ? 'startButton' : 
                  variant === 'danger' ? 'cancelButton' : 'button'],
        ...(size === 'large' ? styles.large : {})
      };
      return baseStyle;
    };
  
    return (
      <Pressable 
        onPress={onPress}
        style={getStyle()}
        android_ripple={{ color: 'rgba(255, 0, 0, 0.3)' }}
      >
        {icon && <Ionicons name={icon} size={80} color={color} />}
        <ThemedText>{text}</ThemedText>
      </Pressable>
    );
  }
  
  const styles = StyleSheet.create({
    button: {
      padding: 20,
      borderRadius: 80,
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      width: 160,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startButton: {
        width: '100%',
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderRadius: 10,
        alignItems: 'center',
      },
      cancelButton: {
        width: '100%',
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: 10,
        alignItems: 'center',
      },
      large: {
        width: 200,
        height: 200,
        borderRadius: 100,
      },
})