import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../constants/theme';

interface BadgeProps {
    text?: string;
    variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'ai';
    size?: 'small' | 'medium' | 'large';
    icon?: keyof typeof Feather.glyphMap;
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'primary',
    size = 'medium',
    icon,
    style,
}) => {
    const getBackgroundColor = (): string => {
        switch (variant) {
            case 'secondary':
                return COLORS.secondary;
            case 'accent':
                return COLORS.accent;
            case 'success':
                return COLORS.success;
            case 'warning':
                return COLORS.warning;
            case 'ai':
                return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            default:
                return COLORS.primary;
        }
    };

    const getTextColor = (): string => {
        switch (variant) {
            case 'accent':
                return COLORS.textPrimary;
            default:
                return COLORS.textWhite;
        }
    };

    const getSize = () => {
        switch (size) {
            case 'small':
                return {
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: 2,
                    fontSize: FONT_SIZES.captionSmall,
                    iconSize: 10,
                };
            case 'large':
                return {
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.sm,
                    fontSize: FONT_SIZES.body,
                    iconSize: 16,
                };
            default:
                return {
                    paddingHorizontal: SPACING.sm + 2,
                    paddingVertical: 4,
                    fontSize: FONT_SIZES.caption,
                    iconSize: 12,
                };
        }
    };

    const sizeStyles = getSize();

    // Special AI gradient badge
    if (variant === 'ai') {
        return (
            <View
                style={[
                    styles.container,
                    {
                        paddingHorizontal: sizeStyles.paddingHorizontal,
                        paddingVertical: sizeStyles.paddingVertical,
                        backgroundColor: '#7C3AED',
                    },
                    style,
                ]}
            >
                <Feather name="zap" size={sizeStyles.iconSize} color={COLORS.textWhite} />
                {text && (
                    <Text
                        style={[
                            styles.text,
                            {
                                fontSize: sizeStyles.fontSize,
                                color: COLORS.textWhite,
                                marginLeft: 4,
                            },
                        ]}
                    >
                        {text}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                {
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                    paddingVertical: sizeStyles.paddingVertical,
                    backgroundColor: getBackgroundColor(),
                },
                style,
            ]}
        >
            {icon && (
                <Feather
                    name={icon}
                    size={sizeStyles.iconSize}
                    color={getTextColor()}
                    style={text ? { marginRight: 4 } : undefined}
                />
            )}
            {text && (
                <Text
                    style={[
                        styles.text,
                        {
                            fontSize: sizeStyles.fontSize,
                            color: getTextColor(),
                        },
                    ]}
                >
                    {text}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.round,
    },
    text: {
        fontWeight: '600',
    },
});

export default Badge;
