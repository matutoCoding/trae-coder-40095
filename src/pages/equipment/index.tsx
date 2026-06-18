import React, { useState, useMemo } from 'react';
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

  const rentalGroups = useMemo(() => {
    const groups: Array<{
      bookingId: string | null;
      routeName: string;
      date: string;
      timeRange: string;
      status: 'rented' | 'returned' | 'cancelled';
      statusText: string;
      returnSource?: 'checkin_return' | 'booking_cancel' | 'manual';
      rentals: RentalRecord[];
      totalCost: number;
    }> = [];

    const bookingMap = new Map<string | null, RentalRecord[]>();
    myRentals.forEach((rental) => {
      const key = rental.bookingId || null;
      if (!bookingMap.has(key)) {
        bookingMap.set(key, []);
      }
      bookingMap.get(key)!.push(rental);
    });

    bookingMap.forEach((rentals, bookingId) => {
      const firstRental = rentals[0];
      const allReturned = rentals.every((r) => r.status === 'returned');
      const allCancelled = rentals.every((r) => r.status === 'cancelled');
      const anyRented = rentals.some((r) => r.status === 'rented' || r.status === 'overdue');

      let status: 'rented' | 'returned' | 'cancelled' = 'rented';
      let statusText = '进行中';
      if (allCancelled) {
        status = 'cancelled';
        statusText = '已取消';
      } else if (allReturned) {
        status = 'returned';
        statusText = '已归还';
      } else if (anyRented) {
        status = 'rented';
        statusText = '进行中';
      }

      const totalCost = rentals.reduce((sum, r) => sum + (r.totalCost || 0), 0);

      groups.push({
        bookingId,
        routeName: firstRental.bookingRouteName || '单独租赁',
        date: firstRental.bookingDate || '',
        timeRange: firstRental.bookingTimeRange || '',
        status,
        statusText,
        returnSource: firstRental.returnSource,
        rentals,
        totalCost
      });
    });

    groups.sort((a, b) => {
      const aFirst = a.rentals[0];
      const bFirst = b.rentals[0];
      return new Date(bFirst.rentTime).getTime() - new Date(aFirst.rentTime).getTime();
    });

    return groups;
  }, [myRentals]);

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

  const getGroupStatusClass = (status: string) => {
    const map: Record<string, string> = {
      rented: styles.statusInProgress,
      returned: styles.statusReturned,
      cancelled: styles.statusCancelled
    };
    return map[status] || '';
  };

  const renderRentalGroup = (group: typeof rentalGroups[0], groupIndex: number) => {
    const hasRentedItems = group.rentals.some((r) => r.status === 'rented' || r.status === 'overdue');
    const allCancelled = group.status === 'cancelled';

    return (
      <View key={group.bookingId || `standalone-${groupIndex}`} className={styles.rentalGroup}>
        <View className={styles.rentalGroupHeader}>
          <Text className={styles.rentalGroupIcon}>🧗</Text>
          <View className={styles.rentalGroupInfo}>
            <Text className={styles.rentalGroupTitle}>
              {group.routeName}
              {group.returnSource === 'checkin_return' && (
                <Text className={classNames(styles.groupSourceTag, styles.sourceCheckin)}>到店归还</Text>
              )}
              {group.returnSource === 'booking_cancel' && (
                <Text className={classNames(styles.groupSourceTag, styles.sourceCancel)}>取消释放</Text>
              )}
            </Text>
            <Text className={styles.rentalGroupSubtitle}>
              {group.date ? `${group.date} · ` : ''}
              {group.timeRange || '单独租赁'}
            </Text>
          </View>
          <View className={classNames(styles.rentalGroupStatus, getGroupStatusClass(group.status))}>
            <Text>{group.statusText}</Text>
          </View>
        </View>

        <View className={styles.rentalGroupBody}>
          {group.rentals.map((rental) => (
            <View key={rental.id} className={styles.groupEquipItem}>
              <View className={styles.groupEquipInfo}>
                <Text className={styles.groupEquipName}>{rental.equipmentName}</Text>
                <Text className={styles.groupEquipMeta}>
                  x{rental.quantity} · ¥{rental.price}/时
                  {rental.deposit > 0 ? ` · 押金¥${rental.deposit}` : ''}
                </Text>
              </View>
              <Text
                className={classNames(
                  styles.groupEquipPrice,
                  allCancelled && styles.groupEquipPriceFree
                )}
              >
                {allCancelled ? '未产生费用' : `¥ ${(rental.totalCost || 0).toFixed(2)}`}
              </Text>
            </View>
          ))}
        </View>

        <View className={styles.rentalGroupFooter}>
          <View>
            <Text className={styles.groupTotalLabel}>
              {allCancelled ? '状态' : '租赁费用合计'}
            </Text>
          </View>
          <View className={styles.groupFooterMeta}>
            {hasRentedItems ? (
              <View
                className={styles.groupReturnBtn}
                onClick={() => {
                  const rented = group.rentals.filter(
                    (r) => r.status === 'rented' || r.status === 'overdue'
                  );
                  if (rented.length === 1) {
                    handleReturnEquipment(rented[0].id, rented[0].equipmentName);
                  } else {
                    Taro.showToast({ title: '请逐件归还装备', icon: 'none' });
                  }
                }}
              >
                <Text>立即归还</Text>
              </View>
            ) : (
              <>
                <Text
                  className={classNames(
                    styles.groupTotalValue,
                    allCancelled && styles.groupTotalValueFree
                  )}
                >
                  {allCancelled ? '已取消释放' : `¥ ${group.totalCost.toFixed(2)}`}
                </Text>
                <Text className={styles.groupFooterTime}>
                  {group.rentals[0].returnTime
                    ? `归还于 ${formatDateTime(group.rentals[0].returnTime, 'MM-DD HH:mm')}`
                    : `租赁于 ${formatDateTime(group.rentals[0].rentTime, 'MM-DD HH:mm')}`}
                </Text>
              </>
            )}
          </View>
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
            {rentalGroups.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎒</Text>
                <Text className={styles.emptyText}>暂无租赁记录</Text>
              </View>
            ) : (
              rentalGroups.map((group, index) => renderRentalGroup(group, index))
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default EquipmentPage;
