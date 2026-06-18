import type { Equipment, RentalRecord } from '@/types/equipment';

const now = new Date();

export const mockEquipments: Equipment[] = [
  {
    id: 'equip_001',
    name: '专业攀岩鞋',
    category: 'shoes',
    categoryText: '攀岩鞋',
    description: '专业级攀岩鞋，贴合脚型，摩擦力强，适合各种难度线路。',
    imageUrl: 'https://picsum.photos/id/225/300/300',
    price: 30,
    deposit: 200,
    totalStock: 20,
    availableStock: 15,
    size: '37-44码',
    brand: 'ClimbPro'
  },
  {
    id: 'equip_002',
    name: '坐式安全带',
    category: 'harness',
    categoryText: '安全带',
    description: '舒适型坐式安全带，腰部加厚设计，长时间穿戴也舒适。',
    imageUrl: 'https://picsum.photos/id/230/300/300',
    price: 20,
    deposit: 150,
    totalStock: 25,
    availableStock: 20,
    size: 'S/M/L/XL',
    brand: 'SafetyMax'
  },
  {
    id: 'equip_003',
    name: '动力主绳 60m',
    category: 'rope',
    categoryText: '绳索',
    description: 'UIAA认证动力绳，60米标准长度，延展性好，安全可靠。',
    imageUrl: 'https://picsum.photos/id/119/300/300',
    price: 50,
    deposit: 500,
    totalStock: 10,
    availableStock: 7,
    brand: 'RopeTech'
  },
  {
    id: 'equip_004',
    name: '攀岩头盔',
    category: 'helmet',
    categoryText: '头盔',
    description: '轻量化攀岩头盔，通风透气，CE认证，全方位保护。',
    imageUrl: 'https://picsum.photos/id/250/300/300',
    price: 15,
    deposit: 100,
    totalStock: 30,
    availableStock: 25,
    size: '均码可调节',
    brand: 'HeadSafe'
  },
  {
    id: 'equip_005',
    name: '镁粉球 100g',
    category: 'chalk',
    categoryText: '镁粉',
    description: '优质镁粉，吸汗防滑，提升握点摩擦力，分装球使用方便。',
    imageUrl: 'https://picsum.photos/id/582/300/300',
    price: 10,
    deposit: 0,
    totalStock: 50,
    availableStock: 45,
    brand: 'GripMax'
  },
  {
    id: 'equip_006',
    name: '镁粉袋',
    category: 'other',
    categoryText: '其他',
    description: '可调节腰带镁粉袋，大容量设计，取用方便。',
    imageUrl: 'https://picsum.photos/id/598/300/300',
    price: 5,
    deposit: 30,
    totalStock: 40,
    availableStock: 35,
    brand: 'GripMax'
  }
];

export const mockRentalRecords: RentalRecord[] = [
  {
    id: 'rental_001',
    equipmentId: 'equip_001',
    equipmentName: '专业攀岩鞋',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    bookingId: 'booking_001',
    quantity: 1,
    price: 30,
    deposit: 200,
    status: 'rented',
    statusText: '租赁中',
    rentTime: new Date(now.getTime() - 3600000).toISOString(),
    expectedReturnTime: new Date(now.getTime() + 20 * 3600000).toISOString()
  },
  {
    id: 'rental_002',
    equipmentId: 'equip_002',
    equipmentName: '坐式安全带',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    bookingId: 'booking_001',
    quantity: 1,
    price: 20,
    deposit: 150,
    status: 'rented',
    statusText: '租赁中',
    rentTime: new Date(now.getTime() - 3600000).toISOString(),
    expectedReturnTime: new Date(now.getTime() + 20 * 3600000).toISOString()
  },
  {
    id: 'rental_003',
    equipmentId: 'equip_005',
    equipmentName: '镁粉球 100g',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    quantity: 2,
    price: 10,
    deposit: 0,
    status: 'returned',
    statusText: '已归还',
    rentTime: new Date(now.getTime() - 86400000).toISOString(),
    expectedReturnTime: new Date(now.getTime() - 50000000).toISOString(),
    returnTime: new Date(now.getTime() - 50000000).toISOString(),
    totalCost: 20
  },
  {
    id: 'rental_004',
    equipmentId: 'equip_004',
    equipmentName: '攀岩头盔',
    userId: 'user_001',
    userName: '张三',
    teamId: 'team_001',
    quantity: 1,
    price: 15,
    deposit: 100,
    status: 'returned',
    statusText: '已归还',
    rentTime: new Date(now.getTime() - 172800000).toISOString(),
    expectedReturnTime: new Date(now.getTime() - 150000000).toISOString(),
    returnTime: new Date(now.getTime() - 150000000).toISOString(),
    totalCost: 15
  }
];
