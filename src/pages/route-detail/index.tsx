import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRouteStore } from '@/store/useRouteStore';
import { useTeamStore } from '@/store/useTeamStore';
import { useBookingStore } from '@/store/useBookingStore';
import TimeSlotSelector from '@/components/TimeSlot';
import { getDateList } from '@/utils/time';
import { ROUTE_LEVEL_MAP } from '@/types/route';
import type { TimeSlot } from '@/types/route';

const RouteDetailPage: React.FC = () => {
  const router = useRouter();
  const routeId = router.params.id || '';

  const { getRouteById, getTimeSlots, selectedDate, setSelectedDate } = useRouteStore();
  const { getCurrentTeam, getRemainingQuota, checkSufficientQuota } = useTeamStore();
  const { createBooking, joinWaitlist } = useBookingStore();

  const [dateList] = useState(getDateList(7));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const route = getRouteById(routeId);
  const timeSlots = getTimeSlots(routeId, selectedDate);
  const currentTeam = getCurrentTeam();
  const remainingQuota = currentTeam ? getRemainingQuota(currentTeam.id) : 0;

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    if (slot.status === 'closed') return;
    setSelectedSlot(slot);
  }, []);

  const handleBook = useCallback(async () => {
    if (!selectedSlot || !route || !currentTeam) return;
    if (selectedSlot.status === 'full' || selectedSlot.status === 'waitlist') return;

    if (!checkSufficientQuota(currentTeam.id, 1)) {
      Taro.showToast({ title: '团队额度不足', icon: 'none' });
      return;
    }

    setBookingLoading(true);
    try {
      const result = await createBooking({
        routeId: route.id,
        routeName: route.name,
        teamId: currentTeam.id,
        date: selectedDate,
        timeSlotId: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
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
      console.error('[RouteDetail] Booking error:', error);
      Taro.showToast({ title: '预约失败', icon: 'none' });
    } finally {
      setBookingLoading(false);
    }
  }, [selectedSlot, route, currentTeam, selectedDate, createBooking, checkSufficientQuota]);

  const handleJoinWaitlist = useCallback(async () => {
    if (!selectedSlot || !route || !currentTeam) return;
    if (selectedSlot.status === 'available') return;

    if (!checkSufficientQuota(currentTeam.id, 1)) {
      Taro.showToast({ title: '团队额度不足', icon: 'none' });
      return;
    }

    setBookingLoading(true);
    try {
      const result = await joinWaitlist({
        routeId: route.id,
        routeName: route.name,
        teamId: currentTeam.id,
        date: selectedDate,
        timeSlotId: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });

      if (result.success) {
        Taro.showToast({ title: '已加入候补', icon: 'success' });
        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/waitlist/index' });
        }, 1500);
      } else {
        Taro.showToast({ title: result.error || '加入失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[RouteDetail] Waitlist error:', error);
      Taro.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      setBookingLoading(false);
    }
  }, [selectedSlot, route, currentTeam, selectedDate, joinWaitlist, checkSufficientQuota]);

  const canBook = selectedSlot && selectedSlot.status === 'available' && remainingQuota > 0;
  const canWaitlist = selectedSlot && (selectedSlot.status === 'full' || selectedSlot.status === 'waitlist') && remainingQuota > 0;

  if (!route) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🧗</Text>
          <Text className={styles.emptyText}>岩壁道不存在</Text>
        </View>
      </View>
    );
  }

  const levelInfo = ROUTE_LEVEL_MAP[route.level];

  return (
    <View className={styles.page}>
      <View className={styles.headerImage}>
        <Image
          className={styles.routeImage}
          src={route.imageUrl}
          mode="aspectFill"
          onError={(e) => console.error('[RouteDetail] Image error:', e)}
        />
        <View className={styles.levelBadge} style={{ backgroundColor: levelInfo.color }}>
          <Text className={styles.levelText}>{levelInfo.text}</Text>
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.routeName}>{route.name}</Text>
        <Text className={styles.routeDesc}>{route.description}</Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>{route.height}m</Text>
            <Text className={styles.infoLabel}>高度</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>{route.angle}°</Text>
            <Text className={styles.infoLabel}>角度</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoValue}>{route.holdCount}</Text>
            <Text className={styles.infoLabel}>握点数</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择日期</Text>
          <ScrollView scrollX enhanced showScrollbar={false} className={styles.dateSelector}>
            {dateList.map((item) => (
              <View
                key={item.date}
                className={classNames(styles.dateItem, {
                  [styles.active]: item.date === selectedDate
                })}
                onClick={() => setSelectedDate(item.date)}
              >
                <Text className={styles.dateDisplay}>{item.display}</Text>
                <Text className={styles.dateWeekday}>{item.weekday}</Text>
                {item.isToday && <Text className={styles.todayTag}>今天</Text>}
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择时段</Text>
          <View className={styles.slotSection}>
            <TimeSlotSelector
              slots={timeSlots}
              selectedSlotId={selectedSlot?.id}
              onSelect={handleSlotSelect}
            />
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.quotaInfo}>
          <Text className={styles.quotaLabel}>团队剩余额度</Text>
          <Text className={styles.quotaValue}>{remainingQuota} 次</Text>
          {selectedSlot && (
            <Text className={styles.selectedSlot}>
              {selectedSlot.startTime} - {selectedSlot.endTime}
            </Text>
          )}
        </View>
        {canBook && (
          <View
            className={classNames(styles.bookBtn, { [styles.disabled]: bookingLoading })}
            onClick={!bookingLoading ? handleBook : undefined}
          >
            <Text className={styles.btnText}>
              {bookingLoading ? '预约中...' : '立即预约'}
            </Text>
          </View>
        )}
        {canWaitlist && (
          <View
            className={classNames(styles.waitlistBtn, { [styles.disabled]: bookingLoading })}
            onClick={!bookingLoading ? handleJoinWaitlist : undefined}
          >
            <Text className={styles.btnText}>
              {bookingLoading ? '加入中...' : '候补排队'}
            </Text>
          </View>
        )}
        {!selectedSlot && (
          <View className={classNames(styles.bookBtn, styles.disabled)}>
            <Text className={classNames(styles.btnText, styles.disabledText)}>请选择时段</Text>
          </View>
        )}
        {selectedSlot && remainingQuota <= 0 && (
          <View className={classNames(styles.bookBtn, styles.disabled)}>
            <Text className={classNames(styles.btnText, styles.disabledText)}>额度不足</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RouteDetailPage;
