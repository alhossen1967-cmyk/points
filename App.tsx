
import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './screens/LoginScreen.tsx';
import StoreDashboard from './screens/StoreDashboard.tsx';
import CustomerDashboard from './screens/CustomerDashboard.tsx';
import AdminDashboard from './screens/AdminDashboard.tsx';
import { User, Role, Transaction, Voucher, AppData, CorrectionRequest, Notification, AdminEarning } from './types';
import { EGP_PER_POINT, DISCOUNT_PER_POINT } from './constants';
import { AuthContext, DataContext } from './contexts';


const App: React.FC = () => {
    const [appData, setAppData] = useState<AppData>(() => {
        try {
            const savedData = localStorage.getItem('loyaltyAppData');
            if (savedData) {
                // Ensure new fields exist
                const parsedData = JSON.parse(savedData);
                if (!parsedData.correctionRequests) {
                    parsedData.correctionRequests = [];
                }
                if (!parsedData.notifications) {
                    parsedData.notifications = [];
                }
                if (!parsedData.adminEarnings) {
                    parsedData.adminEarnings = [];
                }
                return parsedData;
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
        // Initial default data if localStorage is empty or invalid
        return {
            users: [{ id: 'admin-0', name: 'Admin', mobile: 'admin', password: 'admin', role: Role.ADMIN, isProfileComplete: true }],
            transactions: [],
            vouchers: [],
            correctionRequests: [],
            notifications: [],
            adminEarnings: [],
        };
    });
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const savedUser = sessionStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        localStorage.setItem('loyaltyAppData', JSON.stringify(appData));
    }, [appData]);
    
    useEffect(() => {
        if(currentUser) {
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            sessionStorage.removeItem('currentUser');
        }
    }, [currentUser]);


    const login = (mobile: string, password: string, role: Role): boolean => {
        const user = appData.users.find(u => u.mobile === mobile && u.password === password && u.role === role);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const register = (newUser: Omit<User, 'id'>): User | null => {
        if (appData.users.some(u => u.mobile === newUser.mobile)) {
            return null;
        }
    
        let newId: string;
    
        if (newUser.role === Role.CUSTOMER) {
            const customerIds = appData.users
                .filter(u => u.role === Role.CUSTOMER)
                .map(u => parseInt(u.id, 10))
                .filter(id => !isNaN(id));
            
            const maxId = customerIds.length > 0 ? Math.max(...customerIds) : 0;
            newId = (maxId + 1).toString();
        } else {
            newId = `${newUser.role}-${Date.now()}`;
        }
    
        const userWithId: User = { ...newUser, id: newId };
        setAppData(prev => ({ ...prev, users: [...prev.users, userWithId] }));
        return userWithId;
    };

    const addCustomer = (customerData: { name: string; mobile: string; }, storeId: string): User | null => {
        return register({ ...customerData, role: Role.CUSTOMER, isProfileComplete: false, createdByStoreId: storeId });
    };

    const completeCustomerProfile = (mobile: string, data: { address: string; password: string; }): boolean => {
        let userUpdated = false;
        setAppData(prev => {
            const newUsers = prev.users.map(u => {
                if (u.mobile === mobile && u.role === Role.CUSTOMER && u.isProfileComplete === false) {
                    userUpdated = true;
                    return { ...u, ...data, isProfileComplete: true, password: data.password };
                }
                return u;
            });
            return { ...prev, users: newUsers };
        });
        return userUpdated;
    };

    const addTransaction = (transactionData: Omit<Transaction, 'id' | 'points' | 'date'>, voucherIdToUse: string | null) => {
        const newTransaction: Transaction = {
            ...transactionData,
            id: `txn-${Date.now()}`,
            points: Math.floor(transactionData.amount / EGP_PER_POINT),
            date: new Date().toISOString(),
        };
        
        setAppData(prev => {
            const newTransactions = [...prev.transactions, newTransaction];
            let newVouchers = prev.vouchers;
    
            if (voucherIdToUse) {
                newVouchers = prev.vouchers.map(v => 
                    v.id === voucherIdToUse ? { ...v, status: 'used' } : v
                );
            }
    
            return { ...prev, transactions: newTransactions, vouchers: newVouchers };
        });
    };

    const updateTransaction = (transactionId: string, newAmount: number) => {
        setAppData(prev => {
            const newTransactions = prev.transactions.map(t => {
                if (t.id === transactionId) {
                    return {
                        ...t,
                        amount: newAmount,
                        points: Math.floor(newAmount / EGP_PER_POINT), // Recalculate points
                    };
                }
                return t;
            });
            return { ...prev, transactions: newTransactions };
        });
    };

    const requestVoucher = (customerId: string, storeId: string, pointsToRedeem: number) => {
        const discountAmount = pointsToRedeem * DISCOUNT_PER_POINT;
        const newVoucher: Voucher = {
            id: `vcr-${Date.now()}`,
            customerId,
            storeId,
            pointsRedeemed: pointsToRedeem,
            discountAmount: discountAmount,
            status: 'pending',
            requestDate: new Date().toISOString(),
        };

        const newAdminEarning: AdminEarning = {
            id: `earn-${Date.now()}`,
            voucherId: newVoucher.id,
            storeId: storeId,
            amount: discountAmount * 0.40,
            date: new Date().toISOString()
        };

        setAppData(prev => ({ 
            ...prev, 
            vouchers: [...prev.vouchers, newVoucher],
            adminEarnings: [...(prev.adminEarnings || []), newAdminEarning]
        }));
    };

    const updateVoucherStatus = (voucherId: string, status: 'active' | 'used') => {
        setAppData(prev => ({
            ...prev,
            vouchers: prev.vouchers.map(v => 
                v.id === voucherId 
                ? { ...v, status, ...(status === 'active' && { activationDate: new Date().toISOString() }) } 
                : v
            ),
        }));
    };
    
    const addCorrectionRequest = (storeId: string, customerId: string, message: string) => {
        const newRequest: CorrectionRequest = {
            id: `cr-${Date.now()}`,
            storeId,
            customerId,
            message,
            date: new Date().toISOString(),
            status: 'pending',
        };
        setAppData(prev => ({ ...prev, correctionRequests: [...prev.correctionRequests, newRequest] }));
    };
    
    const addNotification = (userId: string, message: string) => {
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            userId,
            message,
            date: new Date().toISOString(),
            isRead: false,
        };
        setAppData(prev => ({ ...prev, notifications: [...prev.notifications, newNotification] }));
    };

    const markNotificationAsRead = (notificationId: string) => {
        setAppData(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => 
                n.id === notificationId ? { ...n, isRead: true } : n
            ),
        }));
    };

    const resolveCorrectionRequest = (requestId: string) => {
        const request = appData.correctionRequests.find(r => r.id === requestId);
        if (!request) return;

        setAppData(prev => ({
            ...prev,
            correctionRequests: prev.correctionRequests.map(r => 
                r.id === requestId ? { ...r, status: 'resolved' } : r
            ),
        }));
        
        const store = appData.users.find(u => u.id === request.storeId);
        const customer = appData.users.find(u => u.id === request.customerId);

        if (store) {
            addNotification(store.id, `تم تنفيذ طلب التعديل الذي أرسلته بخصوص العميل "${customer?.name || 'غير معروف'}".`);
        }
        if (customer) {
            addNotification(customer.id, `قام متجر "${store?.name || 'غير معروف'}" بتعديل إحدى عمليات الشراء الخاصة بك.`);
        }
    };


    const updateUserPassword = (userId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } => {
        const user = appData.users.find(u => u.id === userId);

        if (!user) {
            return { success: false, message: 'المستخدم غير موجود.' };
        }

        if (user.password !== oldPassword) {
            return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
        }
        
        setAppData(prev => {
            const newUsers = prev.users.map(u => 
                u.id === userId ? { ...u, password: newPassword } : u
            );
            return { ...prev, users: newUsers };
        });

        if (currentUser?.id === userId) {
            setCurrentUser(prev => (prev ? { ...prev, password: newPassword } : null));
        }

        return { success: true, message: 'تم تحديث كلمة المرور بنجاح.' };
    };

    const updateUserAddress = (userId: string, newAddress: string) => {
        setAppData(prev => ({
            ...prev,
            users: prev.users.map(u => 
                u.id === userId ? { ...u, address: newAddress } : u
            )
        }));
        if (currentUser?.id === userId) {
            setCurrentUser(prev => (prev ? { ...prev, address: newAddress } : null));
        }
    };

    const exportData = useCallback(() => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(appData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `loyalty_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }, [appData]);

    const importData = useCallback((file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        const data = JSON.parse(text);
                        if (data.users && data.transactions && data.vouchers) {
                            if(!data.correctionRequests) data.correctionRequests = [];
                            if(!data.notifications) data.notifications = [];
                            if(!data.adminEarnings) data.adminEarnings = [];
                            setAppData(data);
                            resolve(true);
                        } else {
                            throw new Error("Invalid data structure");
                        }
                    } else {
                         throw new Error("Could not read file");
                    }
                } catch (error) {
                    alert("فشل استيراد البيانات. يرجى التحقق من صحة الملف.");
                    resolve(false);
                }
            };
            reader.onerror = () => {
                alert("فشل قراءة الملف.");
                resolve(false);
            };
            reader.readAsText(file);
        });
    }, []);

    const renderDashboard = () => {
        if (!currentUser) return <LoginScreen />;
        switch (currentUser.role) {
            case Role.STORE: return <StoreDashboard />;
            case Role.CUSTOMER: return <CustomerDashboard />;
            case Role.ADMIN: return <AdminDashboard />;
            default: return <LoginScreen />;
        }
    };
    
    const Header: React.FC = () => {
        if(!currentUser) return null;
        return (
            <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-cyan-400">نظام نقاط الولاء</h1>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
                    تسجيل الخروج
                </button>
            </header>
        );
    }

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, register, updateUserPassword }}>
            <DataContext.Provider value={{ ...appData, addCustomer, addTransaction, requestVoucher, updateVoucherStatus, exportData, importData, completeCustomerProfile, updateTransaction, addCorrectionRequest, resolveCorrectionRequest, markNotificationAsRead, updateUserAddress }}>
                <div className="min-h-screen bg-gray-900 text-gray-100">
                    <Header />
                    <main>
                        {renderDashboard()}
                    </main>
                </div>
            </DataContext.Provider>
        </AuthContext.Provider>
    );
};

export default App;
