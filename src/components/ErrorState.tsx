import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import Button from './Button';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    icon?: keyof typeof Feather.glyphMap;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
    message = 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối internet.', 
    onRetry,
    icon = 'wifi-off'
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Feather name={icon} size={48} color={COLORS.textLight} />
            </View>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <Button 
                    title="Thử lại" 
                    onPress={onRetry} 
                    variant="outline" 
                    style={styles.button}
                    icon={<Feather name="refresh-cw" size={16} color={COLORS.primary} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    iconContainer: {
        marginBottom: SPACING.lg,
        opacity: 0.5,
    },
    message: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    button: {
        minWidth: 150,
    },
});

export default ErrorState;
