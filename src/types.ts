export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: UserRole;
  status: UserStatus;
  isBlocked?: boolean;
  createdAt: string;
}

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'QRIS' | 'DANA';

export interface Deposit {
  id: string;
  userId: string;
  username: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: DepositStatus;
  payerName: string;
  proofNote?: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export type OrderProduct = 'AM_ECERAN' | 'AM_BULK';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;
  userId: string;
  username: string;
  product: OrderProduct;
  gmail?: string;
  verificationLink?: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  apiResponse?: any;
  result?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export type TransactionType = 'DEPOSIT' | 'ORDER_AM' | 'REFUND' | 'ADMIN_ADJUST';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetUser?: string;
  description: string;
  createdAt: string;
}

export interface StoreSettings {
  isStoreOpen: boolean;
  closeReason?: string;
  priceEceran: number;
  priceBulk: number;
  minDeposit: number;
  bulkMin: number;
  bulkMax: number;
  danaNumber: string;
  danaName: string;
  qrImage: string;
  amPhoto: string;
  waAdmin: string;
  waChannel: string;
  announcement: string;
}

export type AppSettings = StoreSettings;

export interface DashboardStats {
  balance: number;
  totalOrders: number;
  successOrders: number;
  pendingOrders: number;
  totalTransactions: number;
  accountStatus: UserStatus;
  announcement: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalUserBalance: number;
  totalDeposits: number;
  depositPendingCount: number;
  depositPendingAmount: number;
  totalOrders: number;
  orderProcessing: number;
  orderSuccess: number;
  orderFailed: number;
  orderRefunded: number;
  totalRevenue: number;
}

export interface AdminUserItem extends User {
  totalOrdersCount?: number;
  totalDepositAmount?: number;
}
