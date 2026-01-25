// Hệ thống màu sắc (Color Palette) cho ứng dụng học tiếng Trung
export const COLORS = {
  // Màu chủ đạo - Đỏ Hán cổ hiện đại
  primary: '#E53935',
  primaryLight: '#FF6F60',
  primaryDark: '#AB000D',
  
  // Màu phụ - Xanh Dương dịu
  secondary: '#4A90E2',
  secondaryLight: '#7BB8FF',
  secondaryDark: '#0063B0',
  
  // Màu điểm nhấn - Vàng Ấm (cho streak, achievements)
  accent: '#FFD54F',
  accentLight: '#FFFF81',
  accentDark: '#C8A415',
  
  // Màu nền
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  
  // Màu văn bản
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  textWhite: '#FFFFFF',
  
  // Màu trạng thái
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Màu đường viền và chia cách
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Progress colors
  progressBackground: '#FFF3F3',
  progressTrack: '#FFE5E5',
} as const;

// Hệ thống phông chữ (Typography)
export const FONTS = {
  // Font chính cho tiếng Việt
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  
  // Font cho tiếng Trung
  chinese: 'PingFang-SC',
} as const;

// Cấp bậc kích thước chữ
export const FONT_SIZES = {
  // Tiêu đề lớn
  h1: 28,
  h2: 24,
  
  // Tiêu đề thẻ
  h3: 20,
  h4: 18,
  
  // Nội dung
  body: 16,
  bodySmall: 14,
  
  // Chú thích
  caption: 12,
  captionSmall: 10,
} as const;

// Bo góc (Border Radius)
export const BORDER_RADIUS = {
  // Cards lớn
  xl: 24,
  lg: 20,
  
  // Nút bấm và items nhỏ
  md: 12,
  sm: 8,
  xs: 4,
  
  // Hình tròn
  round: 999,
} as const;

// Khoảng cách (Spacing) - Hệ thống lưới 8px
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Đổ bóng (Shadows) - iOS style
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Screen dimensions constants
export const SCREEN = {
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.lg,
} as const;

export default {
  COLORS,
  FONTS,
  FONT_SIZES,
  BORDER_RADIUS,
  SPACING,
  SHADOWS,
  SCREEN,
};
