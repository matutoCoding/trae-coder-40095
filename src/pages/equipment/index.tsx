import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import EquipmentCard from '@/components/EquipmentCard';
import { formatDateTime } from '@/utils/time';
import type { Equipment, RentalStatus } from '@/types/equipment';
import { RENTAL_STATUS_MAP } from '@/types/equipment';

const tabs = [
  { key: 'all', text: '全部装备' },
  { key: 'rented', text: '我的租赁' }
];

const EquipmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { equipments, getMyRentals, rentEquipment, returnEquipment } = useEquipmentStore();
  const myRentals = getMyRentals();
  const activeRentals = myRentals.filter((r) => r.status === 'rented' || r.status === 'overdue');

  const handleRent = useCallback(
    async (equipment: Equipment) => {
      const result = await Taro.showModal({
        title: '确认租赁',
        content: `确定要租赁 ${equipment.name} 吗？\n租金：¥${equipment.price}/次\n押金：¥${equipment.deposit}`,
        confirmColor: '#FF6B35'
      });

      if (result.confirm) {
        const res = await rentEquipment({ equipmentId: equipment.id, quantity: 1 });
        if (res.success) {
          Taro.showToast({ title: '租赁成功', icon: 'success' });
        } else {
          Taro.showToast({ title: res.error || '租赁失败', icon: 'none' });
        }
      }
    },
    [rentEquipment]
  );

  const handleReturn = useCallback(
    async (rentalId: string) => {
      const result = await Taro.showModal({
        title: '确认归还',
        content: '确定要归还装备吗？',
        confirmColor: '#2EC4B6'
      });

      if (result.confirm) {
        const res = await returnEquipment(rentalId);
        if (res.success) {
          Taro.showToast({ title: '归还成功', icon: 'success' });
        } else {
          Taro.showToast({ title: res.error || '归还失败', icon: 'none' });
        }
      }
    },
    [returnEquipment]
  );

  const getStatusClass = (status: RentalStatus): string => {
    const map: Record<RentalStatus, string> = {
      rented: styles.rented,
      returned: styles.returned,
      overdue: styles.overdue,
      lost: styles.overdue
    };
    return map[status] || styles.rented;
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classNames(styles.tabItem, { [styles.active]: tab.key === activeTab })}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.text}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY enhanced showScrollbar={false} className={styles.content}>
        {activeTab === 'rented' ? (
          <View className={styles.myRentals}>
            {activeRentals.length > 0 ? (
              activeRentals.map((rental) => (
                <View key={rental.id} className={styles.rentalCard}>
                  <View className={styles.rentalHeader}>
                    <Text className={styles.rentalName}>{rental.equipmentName}</Text>
                    <View
                      className={classNames(styles.statusTag, getStatusClass(rental.status))}
                    >
                      <Text className={styles.statusText}>
                        {RENTAL_STATUS_MAP[rental.status].text}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.rentalInfo}>
                    <View className={styles.infoItem}>
                      <Text className={styles.infoLabel}>数量</Text>
                      <Text className={styles.infoValue}>x{rental.quantity}</Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.infoLabel}>租赁时间</Text>
                      <Text className={styles.infoValue}>
                        {formatDateTime(rental.rentTime, 'MM-DD HH:mm')}
                      </Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.infoLabel}>预计归还</Text>
                      <Text className={styles.infoValue}>
                        {formatDateTime(rental.expectedReturnTime, 'MM-DD HH:mm')}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.rentalFooter}>
                    <View className={styles.priceInfo}>
                      <Text className={styles.price}>¥{rental.price * rental.quantity}</Text>
                      <Text className={styles.priceUnit}>/次</Text>
                    </View>
                    {rental.status === 'rented' || rental.status === 'overdue' ? (
                      <View className={styles.returnBtn} onClick={() => handleReturn(rental.id)}>
                        <Text className={styles.returnBtnText}>归还</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎒</Text>
                <Text className={styles.emptyText}>暂无租赁中的装备</Text>
              </View>
            )}
          </View>
        ) : (
          <View className={styles.equipmentGrid}>
            {equipments.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                showActions
                onRent={handleRent}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default EquipmentPage;
