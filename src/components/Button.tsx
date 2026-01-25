import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES, SHADOWS } from '../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    iconPosition = 'right',
    disabled = false,
    loading = false,
    style,
    textStyle,
    fullWidth = false,
}) => {
    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BORDER_RADIUS.md,
        };

        // Size styles
        switch (size) {
            case 'small':
                baseStyle.paddingHorizontal = SPACING.md;
                baseStyle.paddingVertical = SPACING.sm;
                break;
            case 'large':
                baseStyle.paddingHorizontal = SPACING.xl;
                baseStyle.paddingVertical = SPACING.md + 4;
                break;
            default:
                baseStyle.paddingHorizontal = SPACING.lg;
                baseStyle.paddingVertical = SPACING.md;
        }

        // Variant styles
        switch (variant) {
            case 'secondary':
                baseStyle.backgroundColor = COLORS.secondary;
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 1.5;
                baseStyle.borderColor = COLORS.primary;
                break;
            case 'ghost':
                baseStyle.backgroundColor = 'transparent';
                break;
            default:
                baseStyle.backgroundColor = COLORS.primary;
                Object.assign(baseStyle, SHADOWS.small);
        }

        if (disabled) {
            baseStyle.opacity = 0.5;
        }

        if (fullWidth) {
            baseStyle.width = '100%';
        }

        return baseStyle;
    };

    const getTextStyle = (): TextStyle => {
        const baseTextStyle: TextStyle = {
            fontWeight: '600',
        };

        // Size styles
        switch (size) {
            case 'small':
                baseTextStyle.fontSize = FONT_SIZES.bodySmall;
                break;
            case 'large':
                baseTextStyle.fontSize = FONT_SIZES.body;
                break;
            default:
                baseTextStyle.fontSize = FONT_SIZES.body;
        }

        // Variant styles
        switch (variant) {
            case 'outline':
            case 'ghost':
                baseTextStyle.color = COLORS.primary;
                break;
            default:
                baseTextStyle.color = COLORS.textWhite;
        }

        return baseTextStyle;
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.textWhite} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <>{icon}</>}
                    <Text style={[getTextStyle(), textStyle, icon ? { marginLeft: iconPosition === 'left' ? SPACING.sm : 0, marginRight: iconPosition === 'right' ? SPACING.sm : 0 } : undefined]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && <>{icon}</>}
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
