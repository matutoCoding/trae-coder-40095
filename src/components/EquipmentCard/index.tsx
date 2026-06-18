import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import type { Equipment } from '@/types/equipment';
import { EQUIPMENT_CATEGORY_MAP } from '@/types/equipment';

interface EquipmentCardProps {
  equipment: Equipment;
  showActions?: boolean;
  onRent?: (equipment: Equipment) => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, showActions = false, onRent }) => {
  const categoryInfo = EQUIPMENT_CATEGORY_MAP[equipment.category];
  const isAvailable = equipment.availableStock > 0;

  const handleRent = (e) => {
    e.stopPropagation();
    if (isAvailable) {
      onRent?.(equipment);
    }
  };

  return (
    <View className={styles.equipmentCard}>
      <View className={styles.imageWrapper}>
        <Image
          className={styles.equipmentImage}
          src={equipment.imageUrl}
          mode="aspectFill"
          onError={(e) => console.error('[EquipmentCard] Image load error:', e)}
        />
        <View className={styles.categoryBadge}>
          <Text className={styles.categoryIcon}>{categoryInfo.icon}</Text>
        </View>
      </View>
      <View className={styles.content}>
        <Text className={styles.name}>{equipment.name}</Text>
        <Text className={styles.description}>{equipment.description}</Text>
        <View className={styles.infoRow}>
          <View className={styles.priceInfo}>
            <Text className={styles.price}>¥{equipment.price}</Text>
            <Text className={styles.priceUnit}>/次</Text>
          </View>
          <View
            className={classNames(styles.stockInfo, {
              [styles.lowStock]: equipment.availableStock < 5 && equipment.availableStock > 0,
              [styles.outOfStock]: !isAvailable
            })}
          >
            <Text className={styles.stockText}>
              库存 {equipment.availableStock}/{equipment.totalStock}
            </Text>
          </View>
        </View>
        {equipment.deposit > 0 && (
          <Text className={styles.deposit}>押金：¥{equipment.deposit}</Text>
        )}
        {showActions && (
          <View
            className={classNames(styles.rentBtn, { [styles.disabled]: !isAvailable })}
            onClick={handleRent}
          >
            <Text className={styles.rentBtnText}>
              {isAvailable ? '立即租赁' : '暂无库存'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default EquipmentCard;
