import type { Team, TeamMember, QuotaRecord } from '@/types/team';

const now = new Date();

export const mockTeams: Team[] = [
  {
    id: 'team_001',
    name: '攀岩爱好者小队',
    description: '热爱攀岩的小伙伴们一起训练，共同进步！',
    ownerId: 'user_001',
    ownerName: '张三',
    totalQuota: 50,
    usedQuota: 23,
    memberCount: 6,
    createdAt: '2024-01-15T00:00:00.000Z',
    expireDate: '2025-12-31',
    avatarColor: '#FF6B35'
  },
  {
    id: 'team_002',
    name: '企业团建专享',
    description: '公司团建专属额度，每周五开放使用。',
    ownerId: 'user_002',
    ownerName: '李四',
    totalQuota: 100,
    usedQuota: 45,
    memberCount: 15,
    createdAt: '2024-03-01T00:00:00.000Z',
    expireDate: '2025-12-31',
    avatarColor: '#2EC4B6'
  }
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'member_001',
    teamId: 'team_001',
    userId: 'user_001',
    userName: '张三',
    avatarColor: '#FF6B35',
    role: 'owner',
    roleText: '队长',
    usedQuota: 8,
    joinDate: '2024-01-15',
    status: 'active'
  },
  {
    id: 'member_002',
    teamId: 'team_001',
    userId: 'user_002',
    userName: '李四',
    avatarColor: '#2EC4B6',
    role: 'admin',
    roleText: '管理员',
    usedQuota: 5,
    joinDate: '2024-01-20',
    status: 'active'
  },
  {
    id: 'member_003',
    teamId: 'team_001',
    userId: 'user_003',
    userName: '王五',
    avatarColor: '#9B59B6',
    role: 'member',
    roleText: '成员',
    usedQuota: 4,
    joinDate: '2024-02-01',
    status: 'active'
  },
  {
    id: 'member_004',
    teamId: 'team_001',
    userId: 'user_004',
    userName: '赵六',
    avatarColor: '#165DFF',
    role: 'member',
    roleText: '成员',
    usedQuota: 3,
    joinDate: '2024-02-15',
    status: 'active'
  },
  {
    id: 'member_005',
    teamId: 'team_002',
    userId: 'user_005',
    userName: '孙七',
    avatarColor: '#00B42A',
    role: 'owner',
    roleText: '队长',
    usedQuota: 12,
    joinDate: '2024-03-01',
    status: 'active'
  },
  {
    id: 'member_006',
    teamId: 'team_002',
    userId: 'user_006',
    userName: '周八',
    avatarColor: '#FF7D00',
    role: 'member',
    roleText: '成员',
    usedQuota: 8,
    joinDate: '2024-03-10',
    status: 'active'
  },
  {
    id: 'member_007',
    teamId: 'team_002',
    userId: 'user_007',
    userName: '吴九',
    avatarColor: '#722ED1',
    role: 'member',
    roleText: '成员',
    usedQuota: 15,
    joinDate: '2024-03-15',
    status: 'active'
  },
  {
    id: 'member_008',
    teamId: 'team_002',
    userId: 'user_008',
    userName: '郑十',
    avatarColor: '#13C2C2',
    role: 'member',
    roleText: '成员',
    usedQuota: 10,
    joinDate: '2024-03-20',
    status: 'active'
  }
];

export const mockQuotaRecords: QuotaRecord[] = [
  {
    id: 'record_001',
    teamId: 'team_001',
    userId: 'user_001',
    userName: '张三',
    type: 'recharge',
    typeText: '充值',
    amount: 50,
    balanceAfter: 50,
    description: '团队初始充值',
    createdAt: '2024-01-15T10:00:00.000Z'
  },
  {
    id: 'record_002',
    teamId: 'team_001',
    userId: 'user_001',
    userName: '张三',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 49,
    description: '预约初级体验墙 10:00',
    relatedBookingId: 'booking_001',
    createdAt: new Date(now.getTime() - 3600000).toISOString()
  },
  {
    id: 'record_003',
    teamId: 'team_001',
    userId: 'user_002',
    userName: '李四',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 48,
    description: '预约进阶训练墙 14:00',
    relatedBookingId: 'booking_002',
    createdAt: new Date(now.getTime() - 7200000).toISOString()
  },
  {
    id: 'record_004',
    teamId: 'team_001',
    userId: 'user_003',
    userName: '王五',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 47,
    description: '预约高手挑战墙 16:00',
    createdAt: new Date(now.getTime() - 86400000).toISOString()
  },
  {
    id: 'record_005',
    teamId: 'team_001',
    userId: 'user_001',
    userName: '张三',
    type: 'refund',
    typeText: '退还',
    amount: 1,
    balanceAfter: 48,
    description: '取消预约初级体验墙',
    relatedBookingId: 'booking_005',
    createdAt: new Date(now.getTime() - 172800000).toISOString()
  },
  {
    id: 'record_006',
    teamId: 'team_001',
    userId: 'user_004',
    userName: '赵六',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 47,
    description: '预约速度竞赛墙 15:00',
    createdAt: new Date(now.getTime() - 1800000).toISOString()
  },
  {
    id: 'record_007',
    teamId: 'team_002',
    userId: 'user_005',
    userName: '孙七',
    type: 'recharge',
    typeText: '充值',
    amount: 100,
    balanceAfter: 100,
    description: '团队初始充值',
    createdAt: '2024-03-01T10:00:00.000Z'
  },
  {
    id: 'record_008',
    teamId: 'team_002',
    userId: 'user_005',
    userName: '孙七',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 99,
    description: '预约高级难度墙 10:00',
    createdAt: new Date(now.getTime() - 5400000).toISOString()
  },
  {
    id: 'record_009',
    teamId: 'team_002',
    userId: 'user_006',
    userName: '周八',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 98,
    description: '预约初级体验墙 14:00',
    createdAt: new Date(now.getTime() - 10800000).toISOString()
  },
  {
    id: 'record_010',
    teamId: 'team_002',
    userId: 'user_007',
    userName: '吴九',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 97,
    description: '预约高手挑战墙 16:00',
    createdAt: new Date(now.getTime() - 43200000).toISOString()
  },
  {
    id: 'record_011',
    teamId: 'team_002',
    userId: 'user_008',
    userName: '郑十',
    type: 'deduct',
    typeText: '扣减',
    amount: 1,
    balanceAfter: 96,
    description: '预约速度竞赛墙 18:00',
    createdAt: new Date(now.getTime() - 25200000).toISOString()
  }
];
