export interface Equipment {
  id: string;
  name: string;
  category: 'shoes' | 'harness' | 'rope' | 'helmet' | 'chalk' | 'other';
  categoryText: string;
  description: string;
  imageUrl: string;
  price: number;
  deposit: number;
  totalStock: number;
  availableStock: number;
  size?: string;
  brand?: string;
}

export interface RentalRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  teamId: string;
  bookingId?: string;
  bookingRouteName?: string;
  bookingDate?: string;
  bookingTimeRange?: string;
  quantity: number;
  price: number;
  deposit: number;
  status: 'rented' | 'returned' | 'overdue' | 'lost' | 'cancelled';
  statusText: string;
  returnSource?: 'checkin_return' | 'booking_cancel' | 'manual';
  rentTime: string;
  expectedReturnTime: string;
  returnTime?: string;
  totalCost?: number;
}

export type EquipmentCategory = 'shoes' | 'harness' | 'rope' | 'helmet' | 'chalk' | 'other';
export type RentalStatus = 'rented' | 'returned' | 'overdue' | 'lost';

export const EQUIPMENT_CATEGORY_MAP: Record<EquipmentCategory, { text: string; icon: string }> = {
  shoes: { text: '攀岩鞋', icon: '👟' },
  harness: { text: '安全带', icon: '🎗️' },
  rope: { text: '绳索', icon: '🪢' },
  helmet: { text: '头盔', icon: '⛑️' },
  chalk: { text: '镁粉', icon: '🧴' },
  other: { text: '其他', icon: '📦' }
};

export const RENTAL_STATUS_MAP: Record<RentalStatus, { text: string; color: string }> = {
  rented: { text: '租赁中', color: '#165DFF' },
  returned: { text: '已归还', color: '#00B42A' },
  overdue: { text: '已逾期', color: '#F53F3F' },
  lost: { text: '已丢失', color: '#86909C' }
};
