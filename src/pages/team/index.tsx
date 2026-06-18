import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTeamStore } from '@/store/useTeamStore';
import TeamMemberItem from '@/components/TeamMemberItem';
import { formatDateTime } from '@/utils/time';
import type { QuotaType, TeamMember, QuotaRecord } from '@/types/team';

const TeamPage: React.FC = () => {
  const {
    teams,
    currentTeamId,
    setCurrentTeam,
    getCurrentTeam,
    getMembers,
    getQuotaRecords,
    getRemainingQuota
  } = useTeamStore();

  const currentTeam = getCurrentTeam();
  const members = getMembers(currentTeamId);
  const records = getQuotaRecords(currentTeamId).slice(0, 20);
  const remainingQuota = currentTeam ? getRemainingQuota(currentTeam.id) : 0;
  const usedQuota = currentTeam?.usedQuota || 0;
  const totalQuota = currentTeam?.totalQuota || 0;
  const usagePercent = totalQuota > 0 ? (usedQuota / totalQuota) * 100 : 0;

  const totalMemberUsed = useMemo(() => {
    return members.reduce((sum, m) => sum + m.usedQuota, 0);
  }, [members]);

  const lastRecordBalance = useMemo(() => {
    const allRecords = getQuotaRecords(currentTeamId);
    if (allRecords.length === 0) return 0;
    return allRecords[allRecords.length - 1].balanceAfter;
  }, [currentTeamId, getQuotaRecords]);

  const recentRecords = useMemo(() => {
    const allRecords = getQuotaRecords(currentTeamId);
    return allRecords.slice(-5).reverse();
  }, [currentTeamId, getQuotaRecords]);

  const balanceFromTeam = remainingQuota;
  const balanceFromRecords = lastRecordBalance;
  const balanceFromCalculation = totalQuota - usedQuota;
  const isBalanced = balanceFromTeam === balanceFromRecords && balanceFromRecords === balanceFromCalculation;
  const memberDiff = usedQuota - totalMemberUsed;

  const handleSwitchTeam = () => {
    if (teams.length <= 1) {
      Taro.showToast({ title: '暂无其他团队', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: teams.map((t) => `${t.name}${t.id === currentTeamId ? ' (当前)' : ''}`),
      success: (res) => {
        const selectedTeam = teams[res.tapIndex];
        if (selectedTeam && selectedTeam.id !== currentTeamId) {
          setCurrentTeam(selectedTeam.id);
          Taro.showToast({ title: `已切换到${selectedTeam.name}`, icon: 'none' });
        }
      }
    });
  };

  const getRecordIconClass = (type: QuotaType): string => {
    const map: Record<QuotaType, string> = {
      deduct: styles.deduct,
      refund: styles.refund,
      recharge: styles.recharge,
      adjust: styles.adjust
    };
    return map[type] || styles.adjust;
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

  const getRecordIcon = (type: QuotaType): string => {
    const map: Record<QuotaType, string> = {
      deduct: '📉',
      refund: '↩️',
      recharge: '💳',
      adjust: '⚙️'
    };
    return map[type] || '📝';
  };

  const getMemberUsagePercent = (member: TeamMember): number => {
    if (!totalQuota) return 0;
    return (member.usedQuota / totalQuota) * 100;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.teamSelector} onClick={handleSwitchTeam}>
          <Text className={styles.teamName}>{currentTeam?.name || '我的团队'}</Text>
          {teams.length > 1 && (
            <View className={styles.teamSwitchBadge}>
              <Text className={styles.teamSwitchText}>切换</Text>
              <Text className={styles.switchIcon}>▼</Text>
            </View>
          )}
        </View>
        <Text className={styles.teamDesc}>{currentTeam?.description}</Text>
        <View className={styles.teamMeta}>
          <Text className={styles.teamMetaItem}>
            <Text className={styles.teamMetaLabel}>有效期至：</Text>
            <Text className={styles.teamMetaValue}>{currentTeam?.expireDate}</Text>
          </Text>
        </View>
      </View>

      <View className={styles.quotaCard}>
        <View className={styles.quotaHeader}>
          <Text className={styles.quotaLabel}>团队剩余额度</Text>
          <View className={styles.quotaBadge}>
            <Text className={styles.quotaBadgeText}>共享额度池</Text>
          </View>
        </View>
        <View className={styles.quotaMain}>
          <Text className={styles.remainingNumber}>{remainingQuota}</Text>
          <Text className={styles.totalText}> / {totalQuota} 次</Text>
        </View>
        <View className={styles.quotaProgress}>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${usagePercent}%` }} />
          </View>
          <View className={styles.progressLabels}>
            <Text className={styles.progressLabelUsed}>已用 {usedQuota}</Text>
            <Text className={styles.progressLabelPercent}>{usagePercent.toFixed(0)}%</Text>
          </View>
        </View>
        <View className={styles.quotaStats}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{usedQuota}</Text>
            <Text className={styles.statLabel}>已使用</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{remainingQuota}</Text>
            <Text className={styles.statLabel}>剩余</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{members.length}</Text>
            <Text className={styles.statLabel}>成员</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{totalMemberUsed}</Text>
            <Text className={styles.statLabel}>成员合计</Text>
          </View>
        </View>
      </View>

      <View className={styles.billEntry} onClick={() => Taro.navigateTo({ url: '/pages/team-bill/index' })}>
        <View className={styles.billEntryLeft}>
          <Text className={styles.billEntryIcon}>📊</Text>
          <View className={styles.billEntryInfo}>
            <Text className={styles.billEntryTitle}>月度账单</Text>
            <Text className={styles.billEntryDesc}>按月份/成员/类型筛选查账，追踪每一笔额度去向</Text>
          </View>
        </View>
        <Text className={styles.billEntryArrow}>›</Text>
      </View>

      <View className={styles.reconcileCard}>
        <View className={styles.reconcileHeader}>
          <Text className={styles.reconcileTitle}>
            <Text className={styles.reconcileTitleIcon}>🔍</Text>
            额度对账
          </Text>
          <Text className={styles.reconcileAction} onClick={() => Taro.navigateTo({ url: '/pages/team-bill/index' })}>
            查看详情 ›
          </Text>
        </View>

        <View className={styles.reconcileGrid}>
          <View className={classNames(styles.reconcileItem, styles.reconcileItemActive)}>
            <Text className={styles.reconcileItemValue}>{remainingQuota}</Text>
            <Text className={styles.reconcileItemLabel}>团队剩余</Text>
          </View>
          <View className={styles.reconcileItem}>
            <Text className={styles.reconcileItemValue}>{lastRecordBalance}</Text>
            <Text className={styles.reconcileItemLabel}>流水余额</Text>
          </View>
          <View className={styles.reconcileItem}>
            <Text className={styles.reconcileItemValue}>{balanceFromCalculation}</Text>
            <Text className={styles.reconcileItemLabel}>计算余额</Text>
          </View>
        </View>

        <View className={styles.reconcileFlow}>
          <Text className={styles.reconcileFlowLabel}>三边对账</Text>
          <Text
            className={classNames(
              styles.reconcileFlowValue,
              isBalanced ? styles.reconcileFlowSuccess : styles.reconcileFlowWarn
            )}
          >
            {isBalanced ? '✅ 完全一致' : `⚠️ 存在差异（团队${balanceFromTeam} / 流水${balanceFromRecords} / 计算${balanceFromCalculation}）`}
          </Text>
        </View>

        <View className={styles.reconcileFlow}>
          <Text className={styles.reconcileFlowLabel}>成员合计</Text>
          <Text
            className={classNames(
              styles.reconcileFlowValue,
              memberDiff === 0 ? styles.reconcileFlowSuccess : styles.reconcileFlowWarn
            )}
          >
            {memberDiff === 0
              ? `✅ 成员合计 ${totalMemberUsed} = 已使用 ${usedQuota}`
              : `⚠️ 差额 ${memberDiff} 次（成员合计${totalMemberUsed} / 已使用${usedQuota}）`}
          </Text>
        </View>

        <View className={styles.reconcileChain}>
          <Text className={styles.reconcileChainTitle}>最近流水闭环（最新 ← 更早）</Text>
          {recentRecords.map((record, index) => (
            <View key={record.id}>
              <View className={styles.chainItem}>
                <View className={styles.chainDot} />
                <View className={styles.chainContent}>
                  <Text className={styles.chainDesc}>{record.description}</Text>
                  <Text className={styles.chainBalance}>
                    {formatDateTime(record.createdAt, 'MM-DD HH:mm')} · {record.userName}
                  </Text>
                </View>
                <Text
                  className={classNames(
                    styles.chainAmount,
                    record.type === 'deduct' && styles.chainAmountDeduct,
                    record.type === 'refund' && styles.chainAmountRefund,
                    record.type === 'recharge' && styles.chainAmountRecharge
                  )}
                >
                  {record.type === 'deduct' ? '-' : '+'}
                  {record.amount}
                </Text>
              </View>
              {index < recentRecords.length - 1 && <View className={styles.chainLine} />}
            </View>
          ))}
          <View className={styles.chainItem}>
            <View className={styles.chainDot} style={{ background: '#00B42A' }} />
            <View className={styles.chainContent}>
              <Text className={styles.chainDesc} style={{ color: '#00B42A', fontWeight: 500 }}>
                当前余额（最后一笔流水后）
              </Text>
              <Text className={styles.chainBalance}>与团队剩余额度一致</Text>
            </View>
            <Text className={styles.chainAmount} style={{ color: '#00B42A', fontWeight: 600 }}>
              {lastRecordBalance}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.membersSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>团队成员</Text>
            <Text className={styles.memberCount}>{members.length} 人</Text>
          </View>
          <View className={styles.membersList}>
            {members.map((member, index) => (
              <View key={member.id}>
                <TeamMemberItem member={member} />
                <View className={styles.memberUsageBar}>
                  <View className={styles.memberUsageProgress}>
                    <View
                      className={styles.memberUsageFill}
                      style={{ width: `${getMemberUsagePercent(member)}%` }}
                    />
                  </View>
                  <Text className={styles.memberUsageText}>
                    个人已使用 {member.usedQuota} 次 ({getMemberUsagePercent(member).toFixed(0)}%)
                  </Text>
                </View>
                {index < members.length - 1 && <View className={styles.memberDivider} />}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.recordsSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>额度明细</Text>
            <Text className={styles.memberCount}>最近 {records.length} 条</Text>
          </View>
          {records.length > 0 ? (
            <View className={styles.recordsList}>
              {records.map((record) => (
                <View key={record.id} className={styles.recordItem}>
                  <View className={classNames(styles.recordIcon, getRecordIconClass(record.type))}>
                    <Text className={styles.recordIconText}>{getRecordIcon(record.type)}</Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <Text className={styles.recordDesc}>{record.description}</Text>
                    <View className={styles.recordMeta}>
                      <Text className={styles.recordUser}>{record.userName}</Text>
                      <Text className={styles.recordTime}>
                        {formatDateTime(record.createdAt, 'MM-DD HH:mm')}
                      </Text>
                    </View>
                    <View className={styles.recordBalance}>
                      <Text className={styles.recordBalanceLabel}>操作后余额：</Text>
                      <Text className={styles.recordBalanceValue}>{record.balanceAfter} 次</Text>
                    </View>
                  </View>
                  <Text className={classNames(styles.recordAmount, getAmountClass(record.type))}>
                    {getAmountPrefix(record.type)}
                    {record.amount}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无额度记录</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TeamPage;
