import React, { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useTeamStore } from '@/store/useTeamStore';
import { formatDate } from '@/utils/time';
import type { Booking } from '@/types/booking';
import { BOOKING_STATUS_MAP } from '@/types/booking';
import type { RentalRecord } from '@/types/equipment';

const CheckinPage: React.FC = () => {
  const [codeInput, setCodeInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [relatedRentals, setRelatedRentals] = useState<RentalRecord[]>([]);
  const [teamName, setTeamName] = useState('');
  const [, forceTick] = useState(0);

  const getBookingByCode = useBookingStore((s) => s.getBookingByCode);
  const checkInBooking = useBookingStore((s) => s.checkInBooking);
  const completeVenueSession = useBookingStore((s) => s.completeVenueSession);
  const getRentalsByBookingId = useEquipmentStore((s) => s.getRentalsByBookingId);
  const teams = useTeamStore((s) => s.teams);

  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const searchBooking = () => {
    if (!codeInput.trim()) {
      Taro.showToast({ title: '请输入签到码', icon: 'none' });
      return;
    }
    const found = getBookingByCode(codeInput);
    if (found) {
      setBooking(found);
      setRelatedRentals(getRentalsByBookingId(found.id));
      const team = teams.find((t) => t.id === found.teamId);
      setTeamName(team?.name || '');
    } else {
      Taro.showToast({ title: '未找到该签到码的预约', icon: 'none' });
      setBooking(null);
      setRelatedRentals([]);
    }
  };

  const scanCode = async () => {
    try {
      const res = await Taro.scanCode({});
      if (res.result) {
        setCodeInput(res.result);
        const found = getBookingByCode(res.result);
        if (found) {
          setBooking(found);
          setRelatedRentals(getRentalsByBookingId(found.id));
          const team = teams.find((t) => t.id === found.teamId);
          setTeamName(team?.name || '');
        } else {
          Taro.showToast({ title: '未找到预约', icon: 'none' });
        }
      }
    } catch (e) {
      Taro.showToast({ title: '扫码已取消', icon: 'none' });
    }
  };

  const refreshBooking = (bookingId: string) => {
    const latest = useBookingStore.getState().getBookingById(bookingId);
    if (latest) {
      setBooking(latest);
      setRelatedRentals(getRentalsByBookingId(latest.id));
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;
    const result = await checkInBooking(booking.id);
    if (result.success) {
      Taro.showToast({ title: '核销成功，已开始攀岩！', icon: 'success' });
      refreshBooking(booking.id);
    } else {
      Taro.showToast({ title: result.error || '核销失败', icon: 'none' });
    }
  };

  const reset = () => {
    setCodeInput('');
    setBooking(null);
    setRelatedRentals([]);
    setTeamName('');
  };

  const handleComplete = async () => {
    if (!booking) return;
    Taro.showModal({
      title: '确认完成使用？',
      content: '确认完成后装备将自动归还并计算租赁费用',
      success: async (res) => {
        if (res.confirm && booking) {
          const result = await completeVenueSession(booking.id);
          if (result.success) {
            Taro.showToast({ title: `费用合计 ¥${result.totalEquipmentFee || 0}`, icon: 'none' });
            refreshBooking(booking.id);
          } else {
            Taro.showToast({ title: result.error || '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const renderStatusTag = () => {
    if (!booking) return null;
    const info = BOOKING_STATUS_MAP[booking.status];
    const mapClass: Record<string, string> = {
      confirmed: styles.statusConfirmed,
      checkedIn: styles.statusCheckedIn,
      in_progress: styles.statusInProgress
    };
    return (
      <View className={classNames(styles.statusTag, mapClass[booking.status])} style={{ color: info.color }}>
        <Text className={styles.statusTagText}>{info.text}</Text>
      </View>
    );
  };

  const renderActionBtns = () => {
    if (!booking) return null;

    if (booking.status === 'confirmed') {
      return (
        <View className={styles.actionBtns}>
          <View className={classNames(styles.actionBtn, styles.btnSecondary)} onClick={reset}>
            <Text className={styles.btnTextDark}>清空</Text>
          </View>
          <View className={classNames(styles.actionBtn, styles.btnPrimary)} onClick={handleCheckIn}>
            <Text className={styles.btnTextWhite}>✓ 确认核销</Text>
          </View>
        </View>
      );
    }

    if (booking.status === 'checkedIn') {
      return (
        <View className={styles.actionBtns}>
          <View className={classNames(styles.actionBtn, styles.btnSecondary)} onClick={reset}>
            <Text className={styles.btnTextDark}>清空</Text>
          </View>
          <View className={classNames(styles.actionBtn, styles.btnPrimary)} onClick={handleCheckIn}>
            <Text className={styles.btnTextWhite}>✓ 确认核销</Text>
          </View>
        </View>
      );
    }

    if (booking.status === 'in_progress') {
      return (
        <View className={styles.actionBtns}>
          <View className={classNames(styles.actionBtn, styles.btnSecondary)} onClick={reset}>
            <Text className={styles.btnTextDark}>清空</Text>
          </View>
          <View className={classNames(styles.actionBtn, styles.btnPrimary)} onClick={handleComplete}>
            <Text className={styles.btnTextWhite}>✓ 完成使用</Text>
          </View>
        </View>
      );
    }

    return (
      <View className={styles.actionBtns}>
        <View className={classNames(styles.actionBtn, styles.btnSecondary)} onClick={reset}>
          <Text className={styles.btnTextDark}>返回核销</Text>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.inputCard}>
        <Text className={styles.inputTitle}>输入或扫码签到码</Text>
        <View className={styles.inputRow}>
          <Input
            className={classNames(styles.codeInput, focused && styles.codeInputFocused)}
            placeholder="请输入 6 位签到码"
            placeholderClass="placeholder"
            value={codeInput}
            maxLength={6}
            onInput={(e) => setCodeInput(e.detail.value.toUpperCase())}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onConfirm={searchBooking}
          />
          <View className={styles.scanBtn} onClick={scanCode}>
            <Text className={styles.scanBtnText}>扫码</Text>
          </View>
        </View>
        <View className={styles.searchBtn} onClick={searchBooking}>
          <Text className={styles.searchBtnText}>查询预约</Text>
        </View>
      </View>

      {booking ? (
        <View className={styles.resultCard}>
          <View className={styles.resultHeader}>
            <Text className={styles.resultTitle}>预约详情</Text>
            {renderStatusTag()}
          </View>

          <View className={styles.bookingCodeBox}>
            <Text className={styles.bookingCodeText}>{booking.checkInCode}</Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预约人</Text>
            <Text className={styles.infoValue}>{booking.userName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>所属团队</Text>
            <Text className={styles.infoValue}>{teamName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>岩壁道</Text>
            <Text className={classNames(styles.infoValue, styles.infoValueHighlight)}>{booking.routeName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>日期</Text>
            <Text className={styles.infoValue}>{formatDate(booking.date, 'YYYY年MM月DD日 dddd')}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时段</Text>
            <Text className={styles.infoValue}>{booking.startTime} - {booking.endTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预约时间</Text>
            <Text className={styles.infoValue}>{formatDate(booking.createdAt, 'MM-DD HH:mm')}</Text>
          </View>
          {booking.totalEquipmentFee !== undefined && booking.status === 'completed' && (
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>装备租赁费用</Text>
              <Text className={styles.summaryValue}>¥ {booking.totalEquipmentFee.toFixed(2)}</Text>
            </View>
          )}

          {booking.equipmentRentals && booking.equipmentRentals.length > 0 && (
            <>
              <Text className={styles.sectionTitle}>安全装备 ({booking.equipmentRentals.length} 项)</Text>
              <View className={styles.equipmentList}>
                {booking.equipmentRentals.map((eq) => {
                  const rental = relatedRentals.find((r) => r.equipmentId === eq.equipmentId);
                  const isTaken =
                    booking.status === 'in_progress' ||
                    booking.status === 'completed';
                  return (
                    <View
                      key={eq.equipmentId}
                      className={styles.equipmentItem}
                    >
                      <View className={styles.equipmentInfo}>
                        <Text className={styles.equipmentName}>
                          {isTaken ? '✅ ' : '⬜ '}{eq.equipmentName}
                        </Text>
                        <Text className={styles.equipmentQty}>
                          x{eq.quantity} · ¥{eq.price}/时
                          {rental ? ` · 押金¥${rental.deposit}` : ''}
                        </Text>
                      </View>
                      <View
                        className={classNames(
                          styles.equipmentStatus,
                          isTaken ? styles.statusTaken : styles.statusPending
                        )}
                      >
                        <Text className={styles.equipmentStatusText}>
                          {isTaken ? '已领取' : '待领取'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {!booking.equipmentRentals || booking.equipmentRentals.length === 0 ? (
            <View className={styles.tipsBox}>
              <Text className={styles.tipsTitle}>ℹ️ 无预约装备</Text>
              <Text className={styles.tipsText}>该用户未预约租赁安全装备，签到后可直接开始使用。</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎫</Text>
          <Text className={styles.emptyText}>
            请在上方输入或扫描
            客户的 6 位签到码
            查询并核销预约
          </Text>
        </View>
      )}

      {renderActionBtns()}
    </View>
  );
};

export default CheckinPage;
