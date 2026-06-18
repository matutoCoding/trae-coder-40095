import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import { formatDate, formatCountdown } from '@/utils/time';
import { WAITLIST_STATUS_MAP } from '@/types/booking';
import type { WaitlistStatus } from '@/types/booking';

const tabs: Array<{ key: WaitlistStatus | 'all'; text: string }> = [
  { key: 'waiting', text: '排队中' },
  { key: 'notified', text: '待确认' },
  { key: 'all', text: '全部' }
];

const WaitlistPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WaitlistStatus | 'all'>('waiting');
  const { waitlistItems, cancelWaitlist, confirmWaitlist, currentUserId } = useBookingStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const myWaitlist = waitlistItems.filter((w) => w.userId === currentUserId);

  const filteredWaitlist = myWaitlist.filter((item) => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  const getCountdown = (notifiedAt?: string): string => {
    if (!notifiedAt) return '';
    const confirmMinutes = 10;
    const expireTime = new Date(notifiedAt).getTime() + confirmMinutes * 60 * 1000;
    const remaining = Math.max(0, expireTime - now);
    return formatCountdown(Math.floor(remaining / 1000));
  };

  const handleConfirm = useCallback(
    async (waitlistId: string) => {
      const result = await Taro.showModal({
        title: '确认补位',
        content: '有名额释放了，确定要确认预约吗？确认后将扣除1次额度。',
        confirmColor: '#00B42A'
      });

      if (result.confirm) {
        const res = await confirmWaitlist(waitlistId);
        if (res.success) {
          Taro.showToast({ title: '预约成功', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/booking/index' });
          }, 1500);
        } else {
          Taro.showToast({ title: res.error || '确认失败', icon: 'none' });
        }
      }
    },
    [confirmWaitlist]
  );

  const handleCancel = useCallback(
    async (waitlistId: string) => {
      const result = await Taro.showModal({
        title: '取消候补',
        content: '确定要取消候补排队吗？',
        confirmColor: '#FF6B35'
      });

      if (result.confirm) {
        const res = await cancelWaitlist(waitlistId);
        if (res.success) {
          Taro.showToast({ title: '已取消', icon: 'success' });
        } else {
          Taro.showToast({ title: res.error || '操作失败', icon: 'none' });
        }
      }
    },
    [cancelWaitlist]
  );

  const goToHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.tabs}>
          {tabs.map((tab) => (
            <View
              key={tab.key}
              className={classNames(styles.tabItem, {
                [styles.active]: tab.key === activeTab
              })}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabText}>{tab.text}</Text>
            </View>
          ))}
        </View>

        {activeTab === 'waiting' && filteredWaitlist.length > 0 && (
          <View className={styles.tipCard}>
            <Text className={styles.tipTitle}>💡 候补说明</Text>
            <Text className={styles.tipContent}>
              当有用户取消预约或超时未到，系统会按排队顺序通知候补用户。
              收到通知后请在10分钟内确认，否则名额将自动顺延给下一位。
            </Text>
          </View>
        )}

        <ScrollView scrollY enhanced showScrollbar={false}>
          {filteredWaitlist.length > 0 ? (
            filteredWaitlist.map((item) => {
              const statusInfo = WAITLIST_STATUS_MAP[item.status];
              const countdown = getCountdown(item.notifiedAt);

              return (
                <View
                  key={item.id}
                  className={classNames(styles.waitlistCard, {
                    [styles.notified]: item.status === 'notified'
                  })}
                >
                  <View className={styles.waitlistHeader}>
                    <View className={styles.routeInfo}>
                      <Text className={styles.routeName}>{item.routeName}</Text>
                      <Text className={styles.timeInfo}>
                        {formatDate(item.date, 'MM月DD日')} {item.startTime} - {item.endTime}
                      </Text>
                    </View>
                    <View className={styles.positionBadge}>
                      <Text className={styles.positionNumber}>#{item.position}</Text>
                      <Text className={styles.positionLabel}>
                        {item.status === 'waiting' ? '排队位' : '已通知'}
                      </Text>
                    </View>
                  </View>

                  <View className={styles.statusRow}>
                    <View
                      className={classNames(styles.statusTag, styles[item.status])}
                      style={{ color: statusInfo.color }}
                    >
                      <Text className={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                    {item.status === 'notified' && countdown && (
                      <Text className={styles.timerInfo}>
                        剩余确认时间：
                        <Text className={styles.countdown}>{countdown}</Text>
                      </Text>
                    )}
                  </View>

                  <View className={styles.actions}>
                    {item.status === 'notified' && (
                      <View
                        className={classNames(styles.actionBtn, styles.successBtn)}
                        onClick={() => handleConfirm(item.id)}
                      >
                        <Text className={styles.btnText}>立即确认</Text>
                      </View>
                    )}
                    {item.status === 'waiting' && (
                      <View
                        className={classNames(styles.actionBtn, styles.secondaryBtn)}
                        onClick={() => handleCancel(item.id)}
                      >
                        <Text className={styles.btnSecondaryText}>取消候补</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>⏳</Text>
              <Text className={styles.emptyText}>暂无候补记录</Text>
              <View className={styles.emptyBtn} onClick={goToHome}>
                <Text className={styles.emptyBtnText}>去预约</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default WaitlistPage;
