import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface ProgressBarProps {
    progress: number; // 0-100
    height?: number;
    backgroundColor?: string;
    progressColor?: string;
    showLabel?: boolean;
    labelPosition?: 'inside' | 'outside';
    style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 8,
    backgroundColor = COLORS.progressTrack,
    progressColor = COLORS.primary,
    showLabel = false,
    labelPosition = 'outside',
    style,
}) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <View style={[styles.container, style]}>
            <View
                style={[
                    styles.track,
                    {
                        height,
                        backgroundColor,
                        borderRadius: height / 2,
                    },
                ]}
            >
                <View
                    style={[
                        styles.progress,
                        {
                            width: `${clampedProgress}%`,
                            height: '100%',
                            backgroundColor: progressColor,
                            borderRadius: height / 2,
                        },
                    ]}
                />
                {showLabel && labelPosition === 'inside' && clampedProgress > 20 && (
                    <Text style={[styles.labelInside, { lineHeight: height }]}>
                        {Math.round(clampedProgress)}%
                    </Text>
                )}
            </View>
            {showLabel && labelPosition === 'outside' && (
                <Text style={styles.labelOutside}>{Math.round(clampedProgress)}%</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    track: {
        flex: 1,
        overflow: 'hidden',
    },
    progress: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    labelInside: {
        position: 'absolute',
        right: 8,
        color: COLORS.textWhite,
        fontSize: 10,
        fontWeight: '600',
    },
    labelOutside: {
        marginLeft: 8,
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ProgressBar;
