import type { Route, RouteSchedule, TimeSlot } from '@/types/route';
import { generateTimeSlots } from '@/utils/time';

export const mockRoutes: Route[] = [
  {
    id: 'route_001',
    name: '初级体验墙',
    level: 'beginner',
    levelText: '初级',
    height: 12,
    angle: 5,
    description: '适合新手入门体验，坡度平缓，握点大且多，配有专业教练指导。',
    imageUrl: 'https://picsum.photos/id/292/750/500',
    color: '#00B42A',
    holdCount: 45
  },
  {
    id: 'route_002',
    name: '进阶训练墙',
    level: 'intermediate',
    levelText: '中级',
    height: 15,
    angle: 15,
    description: '适合有一定基础的攀岩爱好者，路线丰富多样，难度适中。',
    imageUrl: 'https://picsum.photos/id/312/750/500',
    color: '#165DFF',
    holdCount: 60
  },
  {
    id: 'route_003',
    name: '高手挑战墙',
    level: 'advanced',
    levelText: '高级',
    height: 18,
    angle: 30,
    description: '专为进阶攀岩者设计，难度较高，需要较强的力量和技巧。',
    imageUrl: 'https://picsum.photos/id/326/750/500',
    color: '#FF7D00',
    holdCount: 75
  },
  {
    id: 'route_004',
    name: '极限抱石区',
    level: 'expert',
    levelText: '专家',
    height: 5,
    angle: 45,
    description: '专业级抱石区域，难度极高，仅限专业选手或教练指导下使用。',
    imageUrl: 'https://picsum.photos/id/401/750/500',
    color: '#F53F3F',
    holdCount: 30
  },
  {
    id: 'route_005',
    name: '速度竞赛墙',
    level: 'intermediate',
    levelText: '中级',
    height: 15,
    angle: 5,
    description: '标准速度赛道，适合练习速度攀岩，配有电子计时系统。',
    imageUrl: 'https://picsum.photos/id/431/750/500',
    color: '#165DFF',
    holdCount: 40
  },
  {
    id: 'route_006',
    name: '儿童趣味墙',
    level: 'beginner',
    levelText: '初级',
    height: 8,
    angle: 0,
    description: '专为儿童设计的趣味攀岩墙，色彩鲜艳，安全防护完善。',
    imageUrl: 'https://picsum.photos/id/570/750/500',
    color: '#00B42A',
    holdCount: 35
  }
];

const generateSchedule = (routeId: string, date: string, capacity: number): RouteSchedule => {
  const timeSlots = generateTimeSlots(9, 22, 60, capacity).map((slot, index) => {
    const bookedCount = Math.floor(Math.random() * (capacity + 2));
    const actualBooked = Math.min(bookedCount, capacity);
    const waitlistCount = actualBooked >= capacity ? Math.floor(Math.random() * 5) : 0;
    
    let status: TimeSlot['status'] = 'available';
    if (index < 3) {
      status = 'available';
    } else if (actualBooked >= capacity) {
      status = waitlistCount > 0 ? 'waitlist' : 'full';
    } else if (actualBooked >= capacity * 0.8) {
      status = 'available';
    }

    return {
      ...slot,
      bookedCount: actualBooked,
      waitlistCount,
      status
    } as TimeSlot;
  });

  return {
    routeId,
    date,
    timeSlots
  };
};

export const generateMockSchedules = (): Record<string, RouteSchedule> => {
  const schedules: Record<string, RouteSchedule> = {};
  const today = new Date();
  const capacities = [5, 4, 3, 2, 4, 6];

  for (let day = 0; day < 7; day++) {
    const date = new Date(today.getTime() + day * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    mockRoutes.forEach((route, index) => {
      const key = `${route.id}_${dateStr}`;
      schedules[key] = generateSchedule(route.id, dateStr, capacities[index]);
    });
  }

  return schedules;
};

export const mockSchedules = generateMockSchedules();
