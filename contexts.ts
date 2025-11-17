
import { createContext } from 'react';
import { User, Role, Transaction, Voucher, AppData, CorrectionRequest, Notification, AdminEarning } from './types';

// --- Auth Context ---
export interface AuthContextType {
    currentUser: User | null;
    login: (mobile: string, password: string, role: Role) => boolean;
    logout: () => void;
    register: (newUser: Omit<User, 'id'>) => User | null;
    updateUserPassword: (userId: string, oldPassword: string, newPassword: string) => { success: boolean; message: string };
}
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// --- Data Context ---
export interface DataContextType {
    users: User[];
    transactions: Transaction[];
    vouchers: Voucher[];
    correctionRequests: CorrectionRequest[];
    notifications: Notification[];
    adminEarnings: AdminEarning[];
    addCustomer: (customerData: { name: string; mobile: string; }, storeId: string) => User | null;
    addTransaction: (transactionData: Omit<Transaction, 'id' | 'points' | 'date'>, voucherIdToUse: string | null) => void;
    updateTransaction: (transactionId: string, newAmount: number) => void;
    requestVoucher: (customerId: string, storeId: string, pointsToRedeem: number) => void;
    updateVoucherStatus: (voucherId: string, status: 'active' | 'used') => void;
    exportData: () => void;
    importData: (file: File) => Promise<boolean>;
    completeCustomerProfile: (mobile: string, data: { address: string; password: string; }) => boolean;
    addCorrectionRequest: (storeId: string, customerId: string, message: string) => void;
    resolveCorrectionRequest: (requestId: string) => void;
    markNotificationAsRead: (notificationId: string) => void;
    updateUserAddress: (userId: string, newAddress: string) => void;
}
export const DataContext = createContext<DataContextType>({} as DataContextType);
