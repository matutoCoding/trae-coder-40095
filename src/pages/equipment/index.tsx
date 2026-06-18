import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import EquipmentCard from '@/components/EquipmentCard';
import { formatDateTime } from '@/utils/time';
import type { RentalRecord, EquipmentCategory } from '@/types/equipment';

const CATEGORIES: Array<{ key: EquipmentCategory | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'shoes', label: '攀岩鞋' },
  { key: 'harness', label: '安全带' },
  { key: 'rope', label: '绳索' },
  { key: 'helmet', label: '头盔' },
  { key: 'chalk', label: '镁粉袋' },
  { key: 'other', label: '其他' }
];

const TABS = [
  { key: 'rent', label: '装备租赁' },
  { key: 'my', label: '我的租赁' }
];

const EquipmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rent');
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | 'all'>('all');
  const [, forceTick] = useState(0);

  useDidShow(() => {
    forceTick((n) => n + 1);
  });

  const equipments = useEquipmentStore((s) => s.getEquipmentsByCategory(activeCategory));
  const myRentals = useEquipmentStore((s) => s.getMyRentals());
  const setCurrentUser = useEquipmentStore((s) => s.setCurrentUser);
  const returnEquipment = useEquipmentStore((s) => s.returnEquipment);

  const handleReturnEquipment = async (rentalId: string, equipmentName: string) => {
    Taro.showModal({
      title: '归还确认',
      content: `确认归还【${equipmentName}】？将自动计算租赁费用。`,
      success: async (res) => {
        if (res.confirm) {
          const result = await returnEquipment(rentalId);
          if (result.success) {
            Taro.showToast({ title: '归还成功', icon: 'success' });
            forceTick((n) => n + 1);
          } else {
            Taro.showToast({ title: result.error || '归还失败', icon: 'none' });
          }
        }
      }
    });
  };

  const renderRentalCard = (rental: RentalRecord, index: number) => {
    const canReturn = rental.status === 'rented' || rental.status === 'overdue';
    const showCost = rental.status === 'returned' || rental.status === 'cancelled';
    const isCancelled = rental.status === 'cancelled';
    const hasBooking = !!rental.bookingId;

    return (
      <View key={rental.id} className={styles.rentalCard} style={{ animationDelay: `${index * 50}ms` }}>
        <View className={styles.rentalHeader}>
          <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text className={styles.rentalName}>{rental.equipmentName}</Text>
            {isCancelled && (
              <View className={classNames(styles.sourceTag, styles.sourceCancel)}>
                <Text className={styles.sourceText}>取消释放</Text>
              </View>
            )}
            {rental.returnSource === 'checkin_return' && (
              <View className={classNames(styles.sourceTag, styles.sourceCheckin)}>
                <Text className={styles.sourceText}>到店归还</Text>
              </View>
            )}
          </View>
          <View className={classNames(styles.statusTag, styles[rental.status])}>
            <Text className={styles.statusText}>{rental.statusText}</Text>
          </View>
        </View>

        {hasBooking ? (
          <View className={styles.bookingRelation}>
            <Text className={styles.bookingIcon}>🧗</Text>
            <View className={styles.bookingInfo}>
              <Text className={styles.bookingRoute}>
                关联预约：{rental.bookingRouteName || '岩壁道'}
              </Text>
              <Text className={styles.bookingTime}>
                {rental.bookingDate ? `${rental.bookingDate} · ` : ''}
                {rental.bookingTimeRange || ''}
              </Text>
            </View>
          </View>
        ) : (
          <Text className={styles.noRelation}>· 单独租赁（未关联预约）</Text>
        )}

        <View className={styles.rentalInfo}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>数量</Text>
            <Text className={styles.infoValue}>x{rental.quantity}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>单价</Text>
            <Text className={styles.infoValue}>¥{rental.price}/时</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>押金</Text>
            <Text className={styles.infoValue}>¥{rental.deposit}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>租赁时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(rental.rentTime, 'MM-DD HH:mm')}</Text>
          </View>
        </View>

        {showCost && (
          <View className={styles.costRow}>
            <Text className={styles.costLabel}>
              {isCancelled ? '释放状态' : '租赁费用'}
            </Text>
            <Text className={styles.costValue}>
              {isCancelled ? '未产生费用' : `¥ ${(rental.totalCost || 0).toFixed(2)}`}
            </Text>
          </View>
        )}

        <View className={styles.rentalFooter}>
          <View className={styles.priceInfo}>
            {canReturn ? (
              <Text className={styles.price}>
                预估 ¥{rental.price * rental.quantity}
                <Text className={styles.priceUnit}>/时起</Text>
              </Text>
            ) : (
              <Text className={styles.priceUnit} style={{ fontSize: 24 }}>
                预计归还：{formatDateTime(rental.expectedReturnTime, 'MM-DD HH:mm')}
              </Text>
            )}
          </View>
          {canReturn && (
            <View
              className={styles.returnBtn}
              onClick={() => handleReturnEquipment(rental.id, rental.equipmentName)}
            >
              <Text className={styles.returnBtnText}>立即归还</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {TABS.map((tab) => (
          <View
            key={tab.key}
            className={classNames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.content}>
        {activeTab === 'rent' && (
          <>
            <View className={styles.content}>
              <View style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                {CATEGORIES.map((cat) => (
                  <View
                    key={cat.key}
                    className={classNames(
                      styles.statusTag,
                      activeCategory === cat.key ? styles.rented : {}
                    )}
                    style={{
                      background:
                        activeCategory === cat.key ? 'rgba(255, 107, 53, 0.12)' : '#F5F5F5',
                      color: activeCategory === cat.key ? '#FF6B35' : '#86909C',
                      padding: '10rpx 20rpx',
                      borderRadius: 999
                    }}
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    <Text className={styles.statusText}>{cat.label}</Text>
                  </View>
                ))}
              </View>

              <View className={styles.equipmentGrid}>
                {equipments.map((eq, index) => (
                  <EquipmentCard key={eq.id} equipment={eq} index={index} />
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'my' && (
          <View className={styles.myRentals}>
            {myRentals.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎒</Text>
                <Text className={styles.emptyText}>暂无租赁记录</Text>
              </View>
            ) : (
              myRentals.map((rental, index) => renderRentalCard(rental, index))
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default EquipmentPage;
