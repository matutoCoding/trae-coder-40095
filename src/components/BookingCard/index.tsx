import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import type { Booking } from '@/types/booking';
import { BOOKING_STATUS_MAP } from '@/types/booking';
import { formatDate } from '@/utils/time';

interface BookingCardProps {
  booking: Booking;
  showActions?: boolean;
  onClick?: () => void;
  onCancel?: (bookingId: string) => void;
  onCheckIn?: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  showActions = true,
  onClick,
  onCancel,
  onCheckIn
}) => {
  const statusInfo = BOOKING_STATUS_MAP[booking.status];

  const handleCancel = (e) => {
    e.stopPropagation();
    onCancel?.(booking.id);
  };

  const handleCheckIn = (e) => {
    e.stopPropagation();
    onCheckIn?.(booking.id);
  };

  const handleClick = () => {
    onClick?.();
  };

  return (
    <View className={styles.bookingCard} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.routeInfo}>
          <Text className={styles.routeName}>{booking.routeName}</Text>
          <View
            className={classNames(styles.statusTag, styles[booking.status])}
            style={{ color: statusInfo.color, backgroundColor: `${statusInfo.color}15` }}
          >
            <Text className={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>
        {booking.isFromWaitlist && (
          <View className={styles.fromWaitlist}>
            <Text className={styles.fromWaitlistText}>候补补位</Text>
          </View>
        )}
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.dateText}>{formatDate(booking.date, 'MM月DD日')}</Text>
        <Text className={styles.timeText}>
          {booking.startTime} - {booking.endTime}
        </Text>
      </View>

      {booking.checkInCode && booking.status === 'confirmed' && (
        <View className={styles.codeRow}>
          <Text className={styles.codeLabel}>签到码</Text>
          <Text className={styles.codeValue}>{booking.checkInCode}</Text>
        </View>
      )}

      {booking.equipmentRentals && booking.equipmentRentals.length > 0 && (
        <View className={styles.equipmentRow}>
          <Text className={styles.equipmentLabel}>租赁装备：</Text>
          {booking.equipmentRentals.map((item, index) => (
            <Text key={index} className={styles.equipmentItem}>
              {item.equipmentName} x{item.quantity}
              {index < booking.equipmentRentals!.length - 1 ? '、' : ''}
            </Text>
          ))}
        </View>
      )}

      {showActions && (booking.status === 'confirmed' || booking.status === 'pending') && (
        <View className={styles.actions}>
          {booking.status === 'confirmed' && (
            <View className={classNames(styles.actionBtn, styles.primaryBtn)} onClick={handleCheckIn}>
              <Text className={styles.btnText}>签到</Text>
            </View>
          )}
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <View className={classNames(styles.actionBtn, styles.secondaryBtn)} onClick={handleCancel}>
              <Text className={styles.btnSecondaryText}>取消预约</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default BookingCard;
