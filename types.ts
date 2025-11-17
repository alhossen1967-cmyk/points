export enum Role {
  STORE = 'متجر',
  CUSTOMER = 'عميل',
  ADMIN = 'أدمن'
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  password?: string; // Optional for security reasons when sending data to frontend
  role: Role;
  address?: string; // For customers and stores
  isProfileComplete?: boolean; // To track if a customer has completed their profile
  createdByStoreId?: string; // ID of the store that created this customer
}

export interface Transaction {
  id: string;
  customerId: string;
  storeId: string;
  amount: number;
  points: number;
  date: string;
}

export interface Voucher {
  id: string;
  customerId: string;
  storeId: string;
  pointsRedeemed: number;
  discountAmount: number;
  status: 'pending' | 'active' | 'used';
  requestDate: string;
  activationDate?: string;
}

export interface CorrectionRequest {
  id: string;
  storeId: string;
  customerId: string;
  message: string;
  date: string;
  status: 'pending' | 'resolved';
}

export interface Notification {
  id: string;
  userId: string; // ID of the user (store or customer) to notify
  message: string;
  date: string;
  isRead: boolean;
}

export interface AdminEarning {
  id: string;
  voucherId: string;
  storeId: string;
  amount: number;
  date: string;
}

export interface AppData {
  users: User[];
  transactions: Transaction[];
  vouchers: Voucher[];
  correctionRequests: CorrectionRequest[];
  notifications: Notification[];
  adminEarnings: AdminEarning[];
}