import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";


interface AlarmButtonProps {
    onPress: () => void;
    text?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    colour?: string;
}

export function AlarmButton({
onPress,
text,
icon,
colour
}: AlarmButtonProps)


return (
    <Pressable
        onPress={onPress}
    >

    </Pressable>
)