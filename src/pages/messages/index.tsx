import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useMessageStore } from '@/store/useMessageStore';
import type { AppMessage, MessageType } from '@/types/message';
import { formatDateTime } from '@/utils/time';

const TAB_LIST: Array<{ key: string; label: string; types?: MessageType[] }> = [
  { key: 'all', label: '全部' },
  { key: 'waitlist', label: '候补消息', types: ['waitlist_notify', 'waitlist_success', 'waitlist_expired', 'waitlist_skipped'] },
  { key: 'booking', label: '预约消息', types: ['booking_created', 'booking_cancelled', 'booking_expired', 'booking_checkedin'] },
  { key: 'quota', label: '额度消息', types: ['quota_deduct', 'quota_refund', 'quota_recharge'] },
  { key: 'equipment', label: '装备消息', types: ['equipment_rented', 'equipment_returned'] }
];

const MessagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [, forceUpdate] = useState(0);

  const messages = useMessageStore((s) => s.getMyMessages());
  const unreadCount = useMessageStore((s) => s.getUnreadCount());
  const markAsRead = useMessageStore((s) => s.markAsRead);
  const markAllAsRead = useMessageStore((s) => s.markAllAsRead);

  const filteredMessages = useMemo(() => {
    const current = TAB_LIST.find((t) => t.key === activeTab);
    if (!current || !current.types) return messages;
    return messages.filter((m) => current.types!.includes(m.type));
  }, [activeTab, messages]);

  const handleMarkAll = () => {
    if (unreadCount === 0) {
      Taro.showToast({ title: '暂无未读消息', icon: 'none' });
      return;
    }
    markAllAsRead();
    forceUpdate((n) => n + 1);
    Taro.showToast({ title: '全部已读', icon: 'success' });
  };

  const handleMessageClick = (msg: AppMessage) => {
    if (!msg.isRead) {
      markAsRead(msg.id);
      forceUpdate((n) => n + 1);
    }

    switch (msg.actionType) {
      case 'open_waitlist':
        Taro.navigateTo({ url: '/pages/waitlist/index' });
        break;
      case 'open_booking':
        Taro.switchTab({ url: '/pages/booking/index' }).catch(() => {
          Taro.navigateTo({ url: '/pages/booking/index' });
        });
        break;
      case 'open_team':
        Taro.switchTab({ url: '/pages/team/index' }).catch(() => {
          Taro.navigateTo({ url: '/pages/team/index' });
        });
        break;
      case 'open_equipment':
        Taro.switchTab({ url: '/pages/equipment/index' }).catch(() => {
          Taro.navigateTo({ url: '/pages/equipment/index' });
        });
        break;
      case 'open_route':
        if (msg.routeId && msg.date) {
          Taro.navigateTo({
            url: `/pages/route-detail/index?routeId=${msg.routeId}&date=${msg.date}`
          });
        }
        break;
      default:
        Taro.showToast({ title: '查看详情', icon: 'none' });
    }
  };

  const getIconBgColor = (color: string): string => {
    return `${color}15`;
  };

  const getMetaBadges = (msg: AppMessage): string[] => {
    const badges: string[] = [];
    if (msg.type.startsWith('waitlist_')) badges.push('候补相关');
    if (msg.type.startsWith('booking_')) badges.push('预约相关');
    if (msg.type.startsWith('quota_')) badges.push('团队额度');
    if (msg.type.startsWith('equipment_')) badges.push('装备租赁');
    if (msg.waitlistId) badges.push('补位');
    if (msg.bookingId) badges.push('预约');
    return badges.slice(0, 2);
  };

  const getActionText = (msg: AppMessage): string => {
    switch (msg.actionType) {
      case 'open_waitlist':
        return '去处理候补 →';
      case 'open_booking':
        return '查看预约 →';
      case 'open_team':
        return '查看额度 →';
      case 'open_equipment':
        return '查看装备 →';
      case 'open_route':
        return '查看岩壁道 →';
      default:
        return '';
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>消息中心</Text>
        <View className={styles.headerRight}>
          {unreadCount > 0 && (
            <View className={styles.unreadBadge}>
              <Text className={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
          <View className={styles.readAllBtn} onClick={handleMarkAll}>
            <Text className={styles.readAllBtnText}>全部已读</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollX enhanced showScrollbar={false} className={styles.tabs}>
        {TAB_LIST.map((tab) => (
          <View
            key={tab.key}
            className={classNames(styles.tabItem, activeTab === tab.key && styles.tabItemActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text
              className={classNames(
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              )}
            >
              {tab.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY enhanced showScrollbar={false} className={styles.messagesList}>
        {filteredMessages.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无相关消息</Text>
          </View>
        ) : (
          filteredMessages.map((msg) => {
            const badges = getMetaBadges(msg);
            const actionText = getActionText(msg);
            return (
              <View
                key={msg.id}
                className={classNames(
                  styles.messageCard,
                  !msg.isRead && styles.messageCardUnread
                )}
                onClick={() => handleMessageClick(msg)}
              >
                {!msg.isRead && <View className={styles.unreadDot} />}
                <View className={styles.messageHeader}>
                  <View
                    className={styles.iconBox}
                    style={{ background: getIconBgColor(msg.color) }}
                  >
                    <Text className={styles.iconText}>{msg.icon}</Text>
                  </View>
                  <View className={styles.messageInfo}>
                    <Text className={styles.messageTitle}>{msg.title}</Text>
                    <Text className={styles.messageTime}>
                      {formatDateTime(msg.createdAt, 'MM月DD日 HH:mm')}
                    </Text>
                  </View>
                </View>
                <Text className={styles.messageContent}>{msg.content}</Text>
                {badges.length > 0 && (
                  <View>
                    {badges.map((badge, idx) => (
                      <View key={idx} className={styles.metaBadge}>
                        <Text className={styles.metaBadgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {actionText && (
                  <View className={styles.actionTag}>
                    <Text className={styles.actionTagText}>{actionText}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default MessagePage;
