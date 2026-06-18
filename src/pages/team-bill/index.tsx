import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTeamStore } from '@/store/useTeamStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import type { QuotaRecord, QuotaType, TeamMember } from '@/types/team';
import type { Booking } from '@/types/booking';
import { formatDate, formatDateTime } from '@/utils/time';

const TYPE_FILTERS: Array<{ key: QuotaType | 'all'; label: string }> = [
  { key: 'all', label: '全部类型' },
  { key: 'deduct', label: '扣减' },
  { key: 'refund', label: '退还' },
  { key: 'recharge', label: '充值' },
  { key: 'adjust', label: '调整' }
];

const generateMonths = (): Array<{ key: string; label: string }> => {
  const months: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getMonth() + 1}月`;
    months.push({ key, label: i === 0 ? '本月' : label });
  }
  return months;
};

const MONTH_LIST = generateMonths();

const TeamBillPage: React.FC = () => {
  const {
    teams,
    currentTeamId,
    setCurrentTeam,
    getCurrentTeam,
    getMembers,
    getQuotaRecords,
    getRemainingQuota,
    getMemberUsedQuota
  } = useTeamStore();

  const currentTeam = getCurrentTeam();
  const members = getMembers(currentTeamId);
  const totalQuota = currentTeam?.totalQuota || 0;
  const remainingQuota = currentTeam ? getRemainingQuota(currentTeam.id) : 0;
  const usedQuota = currentTeam?.usedQuota || 0;

  const [selectedMonth, setSelectedMonth] = useState(MONTH_LIST[0].key);
  const [selectedType, setSelectedType] = useState<QuotaType | 'all'>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all'>('all');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const monthRecords = useMemo(() => {
    const records = getQuotaRecords(currentTeamId);
    return records.filter((r) => r.createdAt.startsWith(selectedMonth));
  }, [currentTeamId, selectedMonth, getQuotaRecords]);

  const monthUsed = useMemo(() => {
    return monthRecords.filter((r) => r.type === 'deduct').reduce((sum, r) => sum + r.amount, 0);
  }, [monthRecords]);

  const monthRefunded = useMemo(() => {
    return monthRecords.filter((r) => r.type === 'refund').reduce((sum, r) => sum + r.amount, 0);
  }, [monthRecords]);

  const monthRecharged = useMemo(() => {
    return monthRecords.filter((r) => r.type === 'recharge').reduce((sum, r) => sum + r.amount, 0);
  }, [monthRecords]);

  const filteredRecords = useMemo(() => {
    return monthRecords.filter((r) => {
      if (selectedType !== 'all' && r.type !== selectedType) return false;
      if (selectedMemberId !== 'all' && r.userId !== selectedMemberId) return false;
      return true;
    });
  }, [monthRecords, selectedType, selectedMemberId]);

  const totalMemberUsed = useMemo(() => {
    return members.reduce((sum, m) => sum + m.usedQuota, 0);
  }, [members]);

  const diffReconcile = usedQuota - totalMemberUsed;

  const handleSwitchTeam = () => {
    Taro.showActionSheet({
      itemList: teams.map((t) => `${t.name}${t.id === currentTeamId ? ' (当前)' : ''}`),
      success: (res) => {
        const selected = teams[res.tapIndex];
        if (selected && selected.id !== currentTeamId) {
          setCurrentTeam(selected.id);
          setSelectedMemberId('all');
          setExpandedRecordId(null);
          Taro.showToast({ title: `已切换到${selected.name}`, icon: 'none' });
        }
      }
    });
  };

  const selectMonth = () => {
    Taro.showActionSheet({
      itemList: MONTH_LIST.map((m) => m.label),
      success: (res) => setSelectedMonth(MONTH_LIST[res.tapIndex].key)
    });
  };

  const selectType = () => {
    Taro.showActionSheet({
      itemList: TYPE_FILTERS.map((f) => f.label),
      success: (res) => setSelectedType(TYPE_FILTERS[res.tapIndex].key)
    });
  };

  const selectMember = () => {
    const items = [{ id: 'all', userName: '全部成员' } as TeamMember, ...members];
    Taro.showActionSheet({
      itemList: items.map((m) => m.userName),
      success: (res) => setSelectedMemberId(items[res.tapIndex].id)
    });
  };

  const getRecordIconClass = (type: QuotaType): string => {
    const map: Record<QuotaType, string> = {
      deduct: styles.recordIconDeduct,
      refund: styles.recordIconRefund,
      recharge: styles.recordIconRecharge,
      adjust: styles.recordIconAdjust
    };
    return map[type] || styles.recordIconAdjust;
  };

  const getRecordIcon = (type: QuotaType): string => {
    const map: Record<QuotaType, string> = {
      deduct: '📉',
      refund: '↩️',
      recharge: '💳',
      adjust: '⚙️'
    };
    return map[type] || '📝';
  };

  const getAmountClass = (type: QuotaType): string => {
    const map: Record<QuotaType, string> = {
      deduct: styles.amountDeduct,
      refund: styles.amountRefund,
      recharge: styles.amountRecharge,
      adjust: styles.amountAdjust
    };
    return map[type] || styles.amountAdjust;
  };

  const getAmountPrefix = (type: QuotaType): string => {
    if (type === 'deduct') return '-';
    if (type === 'refund' || type === 'recharge') return '+';
    return '';
  };

  const getRelatedBooking = (record: QuotaRecord): Booking | undefined => {
    if (!record.relatedBookingId) return undefined;
    return useBookingStore.getState().getBookingById(record.relatedBookingId);
  };

  const getEquipmentCost = (bookingId?: string): number => {
    if (!bookingId) return 0;
    const rentals = useEquipmentStore.getState().getRentalsByBookingId(bookingId);
    return rentals.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  };

  const toggleExpand = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
  };

  const goBack = () => Taro.navigateBack();

  const getMemberUsagePercent = (m: TeamMember): number => {
    if (!totalQuota) return 0;
    return (m.usedQuota / totalQuota) * 100;
  };

  const currentMonthLabel = MONTH_LIST.find((m) => m.key === selectedMonth)?.label || selectedMonth;
  const currentTypeLabel = TYPE_FILTERS.find((t) => t.key === selectedType)?.label || '全部类型';
  const currentMemberLabel =
    selectedMemberId === 'all' ? '全部成员' : members.find((m) => m.userId === selectedMemberId)?.userName || '';

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.breadcrumb} onClick={goBack}>
          <Text className={styles.breadcrumbText}>团队</Text>
          <Text className={styles.breadcrumbArrow}>/</Text>
          <Text className={styles.breadcrumbText}>月度账单</Text>
        </View>

        <View className={styles.teamSelector} onClick={handleSwitchTeam}>
          <Text className={styles.teamName}>{currentTeam?.name || '团队账单'}</Text>
          {teams.length > 1 && (
            <View className={styles.switchBadge}>
              <Text className={styles.switchBadgeText}>切换</Text>
            </View>
          )}
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statsHeader}>
            <Text className={styles.monthText}>{currentMonthLabel}账单</Text>
            <Text className={styles.remainingLabel}>当前剩余额度</Text>
          </View>
          <Text className={styles.remainingValue}>
            {remainingQuota}
            <Text className={styles.remainingUnit}> 次</Text>
          </Text>

          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>-{monthUsed}</Text>
              <Text className={styles.statLabel}>本月扣减</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>+{monthRefunded}</Text>
              <Text className={styles.statLabel}>本月退还</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>+{monthRecharged}</Text>
              <Text className={styles.statLabel}>本月充值</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.filtersBar}>
        <View className={styles.filterItem} onClick={selectMonth}>
          <Text className={styles.filterText}>📅 {currentMonthLabel}</Text>
          <Text className={styles.filterArrow}>▼</Text>
        </View>
        <View className={styles.filterItem} onClick={selectType}>
          <Text className={styles.filterText}>🏷️ {currentTypeLabel}</Text>
          <Text className={styles.filterArrow}>▼</Text>
        </View>
        <View className={styles.filterItem} onClick={selectMember}>
          <Text className={styles.filterText}>👥 {currentMemberLabel}</Text>
          <Text className={styles.filterArrow}>▼</Text>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>成员用量统计</Text>
            <Text className={styles.sectionCount}>
              {members.length}人 · 合计 {totalMemberUsed} 次
              {diffReconcile !== 0 ? `（差额${diffReconcile}）` : ''}
            </Text>
          </View>
          {members.map((member) => (
            <View key={member.id} className={styles.memberSummaryItem}>
              <View className={styles.memberAvatar} style={{ background: member.avatarColor }}>
                <Text className={styles.memberInitial}>{member.userName.charAt(0)}</Text>
              </View>
              <View className={styles.memberSummaryInfo}>
                <View className={styles.memberSummaryNameRow}>
                  <Text className={styles.memberSummaryName}>{member.userName}</Text>
                  <View className={styles.memberRoleTag}>
                    <Text className={styles.memberRoleText}>{member.roleText}</Text>
                  </View>
                </View>
                <View className={styles.memberSummaryProgress}>
                  <View className={styles.memberSummaryBar}>
                    <View
                      className={styles.memberSummaryFill}
                      style={{ width: `${getMemberUsagePercent(member)}%` }}
                    />
                  </View>
                  <Text className={styles.memberSummaryValue}>
                    {member.usedQuota} / {totalQuota}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <View
            className={classNames(
              styles.reconcileTag,
              diffReconcile !== 0 && styles.reconcileWarn
            )}
          >
            <Text
              className={classNames(
                styles.reconcileTagText,
                diffReconcile !== 0 && styles.reconcileWarnText
              )}
            >
              {diffReconcile === 0 ? '✅ 成员合计 = 已使用，口径一致' : `⚠️ 存在差额 ${diffReconcile} 次，建议核对流水`}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>额度明细流水</Text>
            <Text className={styles.sectionCount}>
              已筛选 {filteredRecords.length} / {monthRecords.length} 条
            </Text>
          </View>

          {filteredRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>当前筛选下无流水记录</Text>
            </View>
          ) : (
            <View className={styles.recordsList}>
              {filteredRecords.map((record) => {
                const expanded = expandedRecordId === record.id;
                const booking = getRelatedBooking(record);
                const equipCost = booking ? getEquipmentCost(booking.id) : 0;
                return (
                  <>
                    <View
                      key={record.id}
                      className={classNames(
                        styles.recordItem,
                        expanded && styles.recordItemSelected
                      )}
                      onClick={() => toggleExpand(record.id)}
                    >
                      <View className={classNames(styles.recordIcon, getRecordIconClass(record.type))}>
                        <Text className={styles.recordIconText}>{getRecordIcon(record.type)}</Text>
                      </View>
                      <View className={styles.recordMain}>
                        <View className={styles.recordTopRow}>
                          <Text className={styles.recordDesc}>{record.description}</Text>
                          <Text className={classNames(styles.recordAmount, getAmountClass(record.type))}>
                            {getAmountPrefix(record.type)}
                            {record.amount}
                          </Text>
                        </View>
                        <View className={styles.recordMetaRow}>
                          <Text className={styles.recordMetaText}>👤 {record.userName}</Text>
                          <Text className={styles.recordMetaText}>·</Text>
                          <Text className={styles.recordMetaText}>
                            {formatDateTime(record.createdAt, 'MM-DD HH:mm')}
                          </Text>
                        </View>
                        <View className={styles.recordBalanceRow}>
                          <Text className={styles.recordBalanceLabel}>操作后余额：</Text>
                          <Text className={styles.recordBalanceValue}>{record.balanceAfter} 次</Text>
                        </View>
                      </View>
                    </View>
                    {expanded && (
                      <View className={styles.recordExpander}>
                        <View className={styles.detailSection}>
                          <Text className={styles.detailTitle}>流水基础信息</Text>
                          <View className={styles.detailItem}>
                            <Text className={styles.detailLabel}>流水编号</Text>
                            <Text className={styles.detailValue}>{record.id}</Text>
                          </View>
                          <View className={styles.detailItem}>
                            <Text className={styles.detailLabel}>操作类型</Text>
                            <Text className={styles.detailValue}>{record.typeText}</Text>
                          </View>
                          <View className={styles.detailItem}>
                            <Text className={styles.detailLabel}>操作时间</Text>
                            <Text className={styles.detailValue}>
                              {formatDateTime(record.createdAt, 'YYYY-MM-DD HH:mm:ss')}
                            </Text>
                          </View>
                        </View>

                        {booking && (
                          <View className={styles.detailSection}>
                            <Text className={styles.detailTitle}>关联预约信息</Text>
                            <View className={styles.detailItem}>
                              <Text className={styles.detailLabel}>岩壁道</Text>
                              <Text className={styles.detailValue}>{booking.routeName}</Text>
                            </View>
                            <View className={styles.detailItem}>
                              <Text className={styles.detailLabel}>日期时段</Text>
                              <Text className={styles.detailValue}>
                                {formatDate(booking.date, 'MM-DD')} {booking.startTime}-{booking.endTime}
                              </Text>
                            </View>
                            <View className={styles.detailItem}>
                              <Text className={styles.detailLabel}>预约状态</Text>
                              <Text className={styles.detailValue}>{booking.statusText}</Text>
                            </View>
                            <View className={styles.detailItem}>
                              <Text className={styles.detailLabel}>签到码</Text>
                              <Text className={styles.detailValue}>{booking.checkInCode || '-'}</Text>
                            </View>
                          </View>
                        )}

                        {(record.type === 'deduct' || record.type === 'refund') && booking && (
                          <View className={styles.detailSection}>
                            <Text className={styles.detailTitle}>装备租赁费用</Text>
                            <View className={styles.detailItem}>
                              <Text className={styles.detailLabel}>关联预约ID</Text>
                              <Text className={styles.detailValue}>{booking.id}</Text>
                            </View>
                            <View className={styles.detailItem}>
                              <Text className={styles.detailLabel}>装备总费用</Text>
                              <Text className={classNames(styles.detailValue, { [styles.amountRecharge]: equipCost > 0 })}>
                                ¥ {equipCost.toFixed(2)}
                              </Text>
                            </View>
                            {booking.equipmentRentals && booking.equipmentRentals.length > 0 && (
                              <View>
                                {booking.equipmentRentals.map((e, idx) => (
                                  <View key={idx} className={styles.detailItem}>
                                    <Text className={styles.detailLabel}>{e.equipmentName}</Text>
                                    <Text className={styles.detailValue}>
                                      x{e.quantity} · ¥{e.price}/时
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TeamBillPage;
