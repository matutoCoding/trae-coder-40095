import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import type { TimeSlot } from '@/types/route';

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlotId?: string;
  onSelect?: (slot: TimeSlot) => void;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ slots, selectedSlotId, onSelect }) => {
  const getSlotStatusClass = (slot: TimeSlot) => {
    if (slot.status === 'closed') return styles.closed;
    if (selectedSlotId === slot.id) return styles.selected;
    if (slot.status === 'full') return styles.full;
    if (slot.status === 'waitlist') return styles.waitlist;
    return styles.available;
  };

  const getSlotStatusText = (slot: TimeSlot) => {
    if (slot.status === 'closed') return '已关闭';
    if (slot.status === 'full') return '已满';
    if (slot.status === 'waitlist') return `候补(${slot.waitlistCount})`;
    return `剩余${slot.capacity - slot.bookedCount}`;
  };

  const handleClick = (slot: TimeSlot) => {
    if (slot.status === 'closed') return;
    onSelect?.(slot);
  };

  return (
    <View className={styles.container}>
      <View className={styles.grid}>
        {slots.map((slot) => (
          <View
            key={slot.id}
            className={classNames(styles.slotItem, getSlotStatusClass(slot))}
            onClick={() => handleClick(slot)}
          >
            <Text className={styles.timeText}>{slot.startTime}</Text>
            <Text className={styles.timeText}>-</Text>
            <Text className={styles.timeText}>{slot.endTime}</Text>
            <Text className={styles.statusText}>{getSlotStatusText(slot)}</Text>
          </View>
        ))}
      </View>
      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={classNames(styles.legendDot, styles.available)} />
          <Text className={styles.legendText}>可预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classNames(styles.legendDot, styles.full)} />
          <Text className={styles.legendText}>已满</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classNames(styles.legendDot, styles.waitlist)} />
          <Text className={styles.legendText}>可候补</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classNames(styles.legendDot, styles.selected)} />
          <Text className={styles.legendText}>已选</Text>
        </View>
      </View>
    </View>
  );
};

export default TimeSlotSelector;
