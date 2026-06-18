import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import BookingCard from '@/components/BookingCard';
import { formatDate } from '@/utils/time';
import type { BookingStatus } from '@/types/booking';

const tabs: Array<{ key: BookingStatus | 'all'; text: string }> = [
  { key: 'all', text: '全部' },
  { key: 'confirmed', text: '待使用' },
  { key: 'checkedIn', text: '进行中' },
  { key: 'completed', text: '已完成' }
];

const BookingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const {
    getMyBookings,
    getMyWaitlistItems,
    cancelBooking,
    checkInBooking,
    cancelWaitlist
  } = useBookingStore();

  const myBookings = getMyBookings();
  const myWaitlist = getMyWaitlistItems();

  const filteredBookings = myBookings.filter((booking) => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const handleCancelBooking = useCallback(
    async (bookingId: string) => {
      const result = await Taro.showModal({
        title: '取消预约',
        content: '确定要取消这个预约吗？取消后额度将退还。',
        confirmColor: '#FF6B35'
      });

      if (result.confirm) {
        const res = await cancelBooking(bookingId);
        if (res.success) {
          Taro.showToast({ title: '取消成功', icon: 'success' });
        } else {
          Taro.showToast({ title: res.error || '取消失败', icon: 'none' });
        }
      }
    },
    [cancelBooking]
  );

  const handleCheckIn = useCallback(
    async (bookingId: string) => {
      const result = await Taro.showModal({
        title: '确认签到',
        content: '请确保您已到店，确认签到吗？',
        confirmColor: '#FF6B35'
      });

      if (result.confirm) {
        const res = await checkInBooking(bookingId);
        if (res.success) {
          Taro.showToast({ title: '签到成功', icon: 'success' });
        } else {
          Taro.showToast({ title: res.error || '签到失败', icon: 'none' });
        }
      }
    },
    [checkInBooking]
  );

  const handleCancelWaitlist = useCallback(
    async (waitlistId: string) => {
      const result = await Taro.showModal({
        title: '取消候补',
        content: '确定要取消候补排队吗？',
        confirmColor: '#FF6B35'
      });

      if (result.confirm) {
        const res = await cancelWaitlist(waitlistId);
        if (res.success) {
          Taro.showToast({ title: '已取消候补', icon: 'success' });
        } else {
          Taro.showToast({ title: res.error || '操作失败', icon: 'none' });
        }
      }
    },
    [cancelWaitlist]
  );

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
        {myWaitlist.length > 0 && (
          <View className={styles.waitlistSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>候补排队中</Text>
              <Text className={styles.sectionCount}>{myWaitlist.length} 个</Text>
            </View>
            {myWaitlist.map((item) => (
              <View key={item.id} className={styles.waitlistCard}>
                <View className={styles.waitlistHeader}>
                  <Text className={styles.waitlistRoute}>{item.routeName}</Text>
                  <View className={styles.positionBadge}>
                    <Text className={styles.positionText}>第 {item.position} 位</Text>
                  </View>
                </View>
                <View className={styles.waitlistInfo}>
                  <Text className={styles.waitlistDate}>
                    {formatDate(item.date, 'MM月DD日')}
                  </Text>
                  <Text className={styles.waitlistTime}>
                    {item.startTime} - {item.endTime}
                  </Text>
                </View>
                <View className={styles.waitlistActions}>
                  <View
                    className={classNames(styles.actionBtn, styles.secondaryBtn)}
                    onClick={() => handleCancelWaitlist(item.id)}
                  >
                    <Text className={styles.btnSecondaryText}>取消候补</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancelBooking}
              onCheckIn={handleCheckIn}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无预约记录</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default BookingPage;
