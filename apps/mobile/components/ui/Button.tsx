import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.card;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return '#ffffff';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 12, paddingVertical: 8 };
      case 'medium':
        return { paddingHorizontal: 16, paddingVertical: 12 };
      case 'large':
        return { paddingHorizontal: 24, paddingVertical: 16 };
      default:
        return { paddingHorizontal: 16, paddingVertical: 12 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.primary,
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
