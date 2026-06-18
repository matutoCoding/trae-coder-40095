import type { Booking, WaitlistItem } from '@/types/booking';

const now = new Date();
const today = now.toISOString().split('T')[0];

export const mockBookings: Booking[] = [
  {
    id: 'booking_001',
    routeId: 'route_001',
    routeName: '初级体验墙',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: today,
    timeSlotId: 'slot_1000',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    statusText: '已确认',
    createdAt: new Date(now.getTime() - 3600000).toISOString(),
    expiredAt: new Date(now.getTime() + 900000).toISOString(),
    checkInCode: 'A3B7K9',
    totalEquipmentFee: 50,
    equipmentRentals: [
      { equipmentId: 'equip_001', equipmentName: '专业攀岩鞋', quantity: 1, price: 30 },
      { equipmentId: 'equip_002', equipmentName: '坐式安全带', quantity: 1, price: 20 }
    ]
  },
  {
    id: 'booking_002',
    routeId: 'route_002',
    routeName: '进阶训练墙',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: today,
    timeSlotId: 'slot_1400',
    startTime: '14:00',
    endTime: '15:00',
    status: 'confirmed',
    statusText: '已确认',
    createdAt: new Date(now.getTime() - 7200000).toISOString(),
    expiredAt: new Date(now.getTime() + 3600000).toISOString(),
    checkInCode: 'C8M2P5'
  },
  {
    id: 'booking_003',
    routeId: 'route_003',
    routeName: '高手挑战墙',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: new Date(now.getTime() - 86400000).toISOString().split('T')[0],
    timeSlotId: 'slot_1600',
    startTime: '16:00',
    endTime: '17:00',
    status: 'completed',
    statusText: '已完成',
    createdAt: new Date(now.getTime() - 100000000).toISOString(),
    expiredAt: new Date(now.getTime() - 90000000).toISOString(),
    checkInCode: 'D4N6Q8',
    checkedInAt: new Date(now.getTime() - 98000000).toISOString(),
    startedAt: new Date(now.getTime() - 98000000).toISOString(),
    completedAt: new Date(now.getTime() - 95000000).toISOString(),
    totalEquipmentFee: 20,
    equipmentRentals: [
      { equipmentId: 'equip_005', equipmentName: '镁粉球 100g', quantity: 2, price: 10 }
    ]
  },
  {
    id: 'booking_004',
    routeId: 'route_005',
    routeName: '速度竞赛墙',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
    timeSlotId: 'slot_1500',
    startTime: '15:00',
    endTime: '16:00',
    status: 'confirmed',
    statusText: '已确认',
    createdAt: new Date(now.getTime() - 1800000).toISOString(),
    expiredAt: new Date(now.getTime() + 86400000 + 3600000).toISOString(),
    checkInCode: 'E9R1T3'
  },
  {
    id: 'booking_005',
    routeId: 'route_001',
    routeName: '初级体验墙',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: new Date(now.getTime() - 172800000).toISOString().split('T')[0],
    timeSlotId: 'slot_1100',
    startTime: '11:00',
    endTime: '12:00',
    status: 'cancelled',
    statusText: '已取消',
    createdAt: new Date(now.getTime() - 200000000).toISOString(),
    expiredAt: new Date(now.getTime() - 190000000).toISOString()
  }
];

export const mockWaitlistItems: WaitlistItem[] = [
  {
    id: 'waitlist_001',
    routeId: 'route_003',
    routeName: '高手挑战墙',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: today,
    timeSlotId: 'slot_1800',
    startTime: '18:00',
    endTime: '19:00',
    position: 2,
    status: 'waiting',
    createdAt: new Date(now.getTime() - 1800000).toISOString()
  },
  {
    id: 'waitlist_002',
    routeId: 'route_004',
    routeName: '极限抱石区',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    date: today,
    timeSlotId: 'slot_1900',
    startTime: '19:00',
    endTime: '20:00',
    position: 1,
    status: 'waiting',
    createdAt: new Date(now.getTime() - 3600000).toISOString()
  }
];
