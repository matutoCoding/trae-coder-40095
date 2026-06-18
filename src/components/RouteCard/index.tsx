import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import type { Route } from '@/types/route';
import { ROUTE_LEVEL_MAP } from '@/types/route';

interface RouteCardProps {
  route: Route;
  availableSlots?: number;
  totalSlots?: number;
  onClick?: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, availableSlots, totalSlots, onClick }) => {
  const levelInfo = ROUTE_LEVEL_MAP[route.level];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/route-detail/index?id=${route.id}`
      });
    }
  };

  return (
    <View className={styles.routeCard} onClick={handleClick}>
      <View className={styles.imageWrapper}>
        <Image
          className={styles.routeImage}
          src={route.imageUrl}
          mode="aspectFill"
          onError={(e) => console.error('[RouteCard] Image load error:', e)}
        />
        <View className={styles.levelBadge} style={{ backgroundColor: levelInfo.color }}>
          <Text className={styles.levelText}>{levelInfo.text}</Text>
        </View>
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.routeName}>{route.name}</Text>
          <View className={styles.colorDot} style={{ backgroundColor: route.color }} />
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoText}>高度 {route.height}m</Text>
          <Text className={styles.infoDivider}>·</Text>
          <Text className={styles.infoText}>角度 {route.angle}°</Text>
          <Text className={styles.infoDivider}>·</Text>
          <Text className={styles.infoText}>{route.holdCount}个点</Text>
        </View>
        {availableSlots !== undefined && totalSlots !== undefined && (
          <View className={styles.slotInfo}>
            <View className={styles.slotBar}>
              <View
                className={styles.slotProgress}
                style={{ width: `${((totalSlots - availableSlots) / totalSlots) * 100}%` }}
              />
            </View>
            <Text className={styles.slotText}>
              剩余 {availableSlots} / {totalSlots} 个时段可约
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RouteCard;
