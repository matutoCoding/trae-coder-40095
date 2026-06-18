import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface QuotaBarProps {
  used: number;
  total: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const QuotaBar: React.FC<QuotaBarProps> = ({
  used,
  total,
  showText = true,
  size = 'md',
  color
}) => {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const remaining = total - used;

  const getStatusColor = () => {
    if (color) return color;
    if (percentage >= 90) return '#F53F3F';
    if (percentage >= 70) return '#FF7D00';
    return '#9B59B6';
  };

  const statusColor = getStatusColor();

  return (
    <View className={styles.container}>
      {showText && (
        <View className={styles.header}>
          <Text className={styles.label}>团队额度</Text>
          <View className={styles.quotaInfo}>
            <Text className={styles.remainingNumber} style={{ color: statusColor }}>
              {remaining}
            </Text>
            <Text className={styles.totalText}> / {total} 次</Text>
          </View>
        </View>
      )}
      <View className={classnames(styles.bar, styles[size])}>
        <View
          className={styles.progress}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}dd 100%)`
          }}
        />
      </View>
      {showText && (
        <View className={styles.footer}>
          <Text className={styles.usedText}>已用 {used} 次</Text>
          <Text className={styles.percentText}>{percentage.toFixed(0)}%</Text>
        </View>
      )}
    </View>
  );
};

export default QuotaBar;
