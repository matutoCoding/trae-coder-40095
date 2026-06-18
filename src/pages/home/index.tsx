import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRouteStore } from '@/store/useRouteStore';
import { useTeamStore } from '@/store/useTeamStore';
import { useBookingStore } from '@/store/useBookingStore';
import RouteCard from '@/components/RouteCard';
import { getDateList, getTodayDisplay } from '@/utils/time';

const HomePage: React.FC = () => {
  const { routes, selectedDate, setSelectedDate, getScheduleByDate } = useRouteStore();
  const { getCurrentTeam, getRemainingQuota } = useTeamStore();
  const { autoReleaseExpiredBookings } = useBookingStore();
  const [dateList] = useState(getDateList(7));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentTeam = getCurrentTeam();
  const remainingQuota = currentTeam ? getRemainingQuota(currentTeam.id) : 0;
  const usedQuota = currentTeam?.usedQuota || 0;
  const totalQuota = currentTeam?.totalQuota || 0;

  useEffect(() => {
    autoReleaseExpiredBookings();
    const timer = setInterval(() => {
      autoReleaseExpiredBookings();
    }, 60000);
    return () => clearInterval(timer);
  }, [autoReleaseExpiredBookings]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      autoReleaseExpiredBookings();
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, [autoReleaseExpiredBookings]);

  useEffect(() => {
    Taro.onPullDownRefresh(handleRefresh);
    return () => {
      Taro.offPullDownRefresh(handleRefresh);
    };
  }, [handleRefresh]);

  const getAvailableSlotCount = (routeId: string): { available: number; total: number } => {
    const schedules = getScheduleByDate(selectedDate);
    const schedule = schedules.find((s) => s.routeId === routeId);
    if (!schedule) return { available: 0, total: 0 };
    const available = schedule.timeSlots.filter(
      (s) => s.status === 'available'
    ).length;
    return { available, total: schedule.timeSlots.length };
  };

  const goToTeamDetail = () => {
    Taro.switchTab({ url: '/pages/team/index' });
  };

  const goToBooking = () => {
    Taro.switchTab({ url: '/pages/booking/index' });
  };

  const goToWaitlist = () => {
    Taro.navigateTo({ url: '/pages/waitlist/index' });
  };

  const goToEquipment = () => {
    Taro.switchTab({ url: '/pages/equipment/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.welcomeRow}>
          <View>
            <Text className={styles.welcomeText}>你好，攀岩人 🧗</Text>
            <Text className={styles.subText}>{getTodayDisplay()}，开启今日训练</Text>
          </View>
          <View className={styles.noticeBtn}>
            <Text className={styles.noticeIcon}>🔔</Text>
            <View className={styles.noticeDot} />
          </View>
        </View>
      </View>

      <View className={styles.quotaCard} onClick={goToTeamDetail}>
        <View className={styles.quotaHeader}>
          <Text className={styles.teamName}>{currentTeam?.name || '我的团队'}</Text>
          <View className={styles.quotaBadge}>
            <Text className={styles.quotaBadgeText}>团队额度</Text>
          </View>
        </View>
        <View className={styles.quotaDisplay}>
          <Text className={styles.remainingNumber}>{remainingQuota}</Text>
          <Text className={styles.totalText}> / {totalQuota} 次</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${(usedQuota / totalQuota) * 100}%` }}
          />
        </View>
        <View className={styles.quotaFooter}>
          <Text className={styles.usedText}>已使用 {usedQuota} 次</Text>
          <Text className={styles.detailLink}>查看详情 →</Text>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.dateSection}>
          <Text className={styles.sectionTitle}>选择日期</Text>
          <ScrollView scrollX enhanced showScrollbar={false} className={styles.dateScroll}>
            <View className={styles.dateList}>
              {dateList.map((item) => (
                <View
                  key={item.date}
                  className={classNames(styles.dateItem, {
                    [styles.active]: item.date === selectedDate
                  })}
                  onClick={() => handleDateSelect(item.date)}
                >
                  <Text className={styles.dateDisplay}>{item.display}</Text>
                  <Text className={styles.dateWeekday}>{item.weekday}</Text>
                  {item.isToday && <Text className={styles.todayTag}>今天</Text>}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className={styles.quickActions}>
          <View className={styles.actionGrid}>
            <View className={styles.actionItem} onClick={goToBooking}>
              <Text className={styles.actionIcon}>📅</Text>
              <Text className={styles.actionText}>我的预约</Text>
            </View>
            <View className={styles.actionItem} onClick={goToWaitlist}>
              <Text className={styles.actionIcon}>⏳</Text>
              <Text className={styles.actionText}>候补排队</Text>
            </View>
            <View className={styles.actionItem} onClick={goToEquipment}>
              <Text className={styles.actionIcon}>🧗</Text>
              <Text className={styles.actionText}>装备租赁</Text>
            </View>
            <View className={styles.actionItem} onClick={goToTeamDetail}>
              <Text className={styles.actionIcon}>👥</Text>
              <Text className={styles.actionText}>团队管理</Text>
            </View>
          </View>
        </View>

        <View className={styles.routesSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>热门岩壁道</Text>
            <Text className={styles.moreLink}>查看全部</Text>
          </View>
          {routes.map((route) => {
            const { available, total } = getAvailableSlotCount(route.id);
            return (
              <RouteCard
                key={route.id}
                route={route}
                availableSlots={available}
                totalSlots={total}
              />
            );
          })}
        </View>

        <View className={styles.noticeSection}>
          <View className={styles.noticeCard}>
            <Text className={styles.noticeTitle}>📢 温馨提示</Text>
            <Text className={styles.noticeContent}>
              1. 预约成功后请在开场前15分钟到店签到
              {'\n'}2. 超时未到预约将自动释放，名额让给候补用户
              {'\n'}3. 候补补位需在10分钟内确认，否则自动顺延
              {'\n'}4. 团队额度共享，请合理安排使用
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;
