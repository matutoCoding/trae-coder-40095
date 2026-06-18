import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRouteStore } from '@/store/useRouteStore';
import { useTeamStore } from '@/store/useTeamStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { formatDate } from '@/utils/time';

const BookingConfirmPage: React.FC = () => {
  const router = useRouter();
  const routeId = router.params.routeId || '';
  const slotId = router.params.slotId || '';
  const date = router.params.date || new Date().toISOString().split('T')[0];

  const { getRouteById, getTimeSlots } = useRouteStore();
  const { getCurrentTeam, getRemainingQuota } = useTeamStore();
  const { createBooking } = useBookingStore();
  const { equipments } = useEquipmentStore();

  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const route = getRouteById(routeId);
  const timeSlots = getTimeSlots(routeId, date);
  const slot = timeSlots.find((s) => s.id === slotId);
  const currentTeam = getCurrentTeam();
  const remainingQuota = currentTeam ? getRemainingQuota(currentTeam.id) : 0;
  const teamTotalQuota = currentTeam?.totalQuota || 0;

  const selectedEquipmentList = useMemo(
    () => equipments.filter((e) => selectedEquipments.includes(e.id)),
    [equipments, selectedEquipments]
  );

  const equipmentTotalPrice = useMemo(() => {
    return selectedEquipmentList.reduce((sum, e) => sum + e.price, 0);
  }, [selectedEquipmentList]);

  const handleToggleEquipment = useCallback((equipmentId: string) => {
    setSelectedEquipments((prev) => {
      if (prev.includes(equipmentId)) {
        return prev.filter((id) => id !== equipmentId);
      }
      return [...prev, equipmentId];
    });
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    if (!route || !slot || !currentTeam) return;

    if (remainingQuota < 1) {
      Taro.showToast({ title: '团队额度不足', icon: 'none' });
      return;
    }

    setBookingLoading(true);
    try {
      const equipmentRentals = selectedEquipmentList.map((e) => ({
        equipmentId: e.id,
        equipmentName: e.name,
        quantity: 1,
        price: e.price
      }));

      const result = await createBooking({
        routeId: route.id,
        routeName: route.name,
        teamId: currentTeam.id,
        date,
        timeSlotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        equipmentRentals
      });

      if (result.success) {
        Taro.showToast({ title: '预约成功', icon: 'success' });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/booking/index' });
        }, 1500);
      } else {
        Taro.showToast({ title: result.error || '预约失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[BookingConfirm] Booking error:', error);
      Taro.showToast({ title: '预约失败', icon: 'none' });
    } finally {
      setBookingLoading(false);
    }
  }, [route, slot, currentTeam, date, remainingQuota, selectedEquipmentList, createBooking]);

  const goToEquipment = () => {
    Taro.showActionSheet({
      itemList: equipments.filter((e) => e.availableStock > 0).map((e) => `${e.name} ¥${e.price}/次`),
      success: (res) => {
        const availableEquipments = equipments.filter((e) => e.availableStock > 0);
        const equipment = availableEquipments[res.tapIndex];
        if (equipment) {
          handleToggleEquipment(equipment.id);
        }
      }
    });
  };

  if (!route || !slot) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>预约信息无效</Text>
        </View>
      </View>
    );
  }

  const afterBookingRemaining = remainingQuota - 1;
  const usagePercent = ((teamTotalQuota - afterBookingRemaining) / teamTotalQuota) * 100;

  return (
    <View className={styles.page}>
      <ScrollView scrollY enhanced showScrollbar={false} className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🧗</Text>
            岩壁道信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>岩壁道</Text>
            <Text className={classNames(styles.infoValue, styles.highlightValue)}>{route.name}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>日期</Text>
            <Text className={styles.infoValue}>{formatDate(date, 'YYYY年MM月DD日')}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时段</Text>
            <Text className={styles.infoValue}>
              {slot.startTime} - {slot.endTime}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>难度等级</Text>
            <Text className={styles.infoValue}>{route.levelText}</Text>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>👥</Text>
            团队信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>团队名称</Text>
            <Text className={styles.infoValue}>{currentTeam?.name || '-'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>本次扣减</Text>
            <Text className={classNames(styles.infoValue, styles.quotaValue)}>1 次额度</Text>
          </View>
          <View className={styles.quotaBar}>
            <View className={styles.quotaBarTitle}>
              <Text className={styles.quotaBarLabel}>预约后剩余</Text>
              <Text className={styles.quotaBarValue}>{afterBookingRemaining} / {teamTotalQuota} 次</Text>
            </View>
            <View className={styles.quotaBarProgress}>
              <View
                className={styles.quotaBarFill}
                style={{ width: `${usagePercent}%` }}
              />
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎒</Text>
            装备租赁
          </Text>
          {selectedEquipmentList.length > 0 ? (
            <View className={styles.equipmentList}>
              {selectedEquipmentList.map((equipment) => (
                <View key={equipment.id} className={styles.equipmentItem}>
                  <Text className={styles.equipmentName}>{equipment.name}</Text>
                  <Text className={styles.equipmentPrice}>¥{equipment.price}/次</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className={styles.tipText}>暂未选择装备，可在现场租赁</Text>
          )}
          <View className={styles.addEquipment} onClick={goToEquipment}>
            <Text className={styles.addIcon}>+</Text>
            <Text className={styles.addText}>添加装备</Text>
          </View>
        </View>

        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>额度扣减</Text>
            <Text className={styles.summaryValue}>1 次</Text>
          </View>
          {selectedEquipmentList.length > 0 && (
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>装备租赁</Text>
              <Text className={styles.summaryValue}>¥{equipmentTotalPrice}</Text>
            </View>
          )}
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>预计费用</Text>
            <Text className={styles.summaryTotal}>¥{equipmentTotalPrice}</Text>
          </View>
        </View>

        <Text className={styles.tipText}>
          💡 温馨提示：预约成功后请在开场前15分钟到店签到，超时未到预约将自动释放。
        </Text>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>装备费用</Text>
          <View>
            <Text className={styles.priceValue}>¥{equipmentTotalPrice}</Text>
            <Text className={styles.priceUnit}> + 1次额度</Text>
          </View>
        </View>
        <View
          className={classNames(styles.confirmBtn, { [styles.disabled]: bookingLoading })}
          onClick={!bookingLoading ? handleConfirmBooking : undefined}
        >
          <Text className={classNames(styles.btnText, { [styles.disabledText]: bookingLoading })}>
            {bookingLoading ? '预约中...' : '确认预约'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default BookingConfirmPage;
