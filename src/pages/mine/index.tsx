import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import { useTeamStore } from '@/store/useTeamStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useMessageStore } from '@/store/useMessageStore';

const MinePage: React.FC = () => {
  const { getMyBookings, getMyWaitlistItems } = useBookingStore();
  const { getCurrentTeam, getRemainingQuota, members } = useTeamStore();
  const { getMyRentals } = useEquipmentStore();
  const { getUnreadCount } = useMessageStore();

  const myBookings = getMyBookings();
  const myWaitlist = getMyWaitlistItems();
  const myRentals = getMyRentals();
  const unreadCount = getUnreadCount();
  const currentTeam = getCurrentTeam();
  const remainingQuota = currentTeam ? getRemainingQuota(currentTeam.id) : 0;

  const confirmedBookings = myBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'checkedIn' || b.status === 'in_progress'
  ).length;
  const activeRentals = myRentals.filter((r) => r.status === 'rented').length;

  const menuGroups = [
    {
      title: '预约服务',
      items: [
        { icon: '📅', text: '我的预约', badge: confirmedBookings, action: () => Taro.switchTab({ url: '/pages/booking/index' }) },
        { icon: '⏳', text: '候补排队', badge: myWaitlist.length, action: () => Taro.navigateTo({ url: '/pages/waitlist/index' }) },
        { icon: '🧗', text: '装备租赁', badge: activeRentals, action: () => Taro.switchTab({ url: '/pages/equipment/index' }) }
      ]
    },
    {
      title: '到店服务',
      items: [
        { icon: '🔔', text: '消息中心', badge: unreadCount, action: () => Taro.navigateTo({ url: '/pages/messages/index' }) },
        { icon: '🎫', text: '门店核销台', action: () => Taro.navigateTo({ url: '/pages/checkin/index' }) }
      ]
    },
    {
      title: '团队管理',
      items: [
        { icon: '👥', text: '团队额度', action: () => Taro.switchTab({ url: '/pages/team/index' }) },
        { icon: '�', text: '月度账单', action: () => Taro.navigateTo({ url: '/pages/team-bill/index' }) },
        { icon: '👤', text: '成员管理', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) }
      ]
    },
    {
      title: '其他',
      items: [
        { icon: '📞', text: '联系客服', action: () => Taro.showToast({ title: '客服电话：400-XXX-XXXX', icon: 'none' }) },
        { icon: '❓', text: '帮助中心', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
        { icon: '⚙️', text: '设置', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) }
      ]
    }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>张</Text>
          </View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>张三</Text>
            <Text className={styles.userDesc}>攀岩爱好者 · 已加入2个团队</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{remainingQuota}</Text>
          <Text className={styles.statLabel}>剩余额度</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{confirmedBookings}</Text>
          <Text className={styles.statLabel}>待使用</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{myBookings.length}</Text>
          <Text className={styles.statLabel}>总预约</Text>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.menuSection}>
          {menuGroups.map((group, groupIndex) => (
            <View key={groupIndex}>
              <Text className={styles.sectionTitle}>{group.title}</Text>
              <View className={styles.menuGroup}>
                {group.items.map((item, itemIndex) => (
                  <View key={itemIndex} className={styles.menuItem} onClick={item.action}>
                    <Text className={styles.menuIcon}>{item.icon}</Text>
                    <Text className={styles.menuText}>{item.text}</Text>
                    {item.badge !== undefined && item.badge > 0 && (
                      <View className={styles.menuBadge}>
                        <Text className={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Text className={styles.menuArrow}>›</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View className={styles.logoutBtn}>
          <Text className={styles.logoutText}>退出登录</Text>
        </View>

        <View className={styles.versionInfo}>
          <Text className={styles.versionText}>版本 v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default MinePage;
