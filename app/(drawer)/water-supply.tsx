import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getApiUrl } from '@/lib/remoteConfig';
import { useAuth } from '@/context/AuthContext';

// API client methods
import {
    listConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    listBills,
    createBill,
    bulkCreateBills,
    updateBill,
    deleteBill,
    payBill,
    listExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getFinancialReport,
    WATER_SUPPLY_QUERY_KEYS
} from '@/apis/water-supply';

// Presentational Tab Panels
import ConnectionsTab from '@/components/waterSupply/connection/ConnectionsTab';
import BillsTab from '@/components/waterSupply/bills/BillsTab';
import ExpensesTab from '@/components/waterSupply/expense/ExpensesTab';
import ReportTab from '@/components/waterSupply/report/ReportTab';

// Home Screen components
import WaterSupplyHeader from '@/components/waterSupply/home/WaterSupplyHeader';
import WaterSupplyTabBar from '@/components/waterSupply/home/WaterSupplyTabBar';

// Modal Forms
import ConnectionModal from '@/components/waterSupply/connection/ConnectionModal';
import BillModal from '@/components/waterSupply/bills/BillModal';
import BulkBillModal from '@/components/waterSupply/bills/BulkBillModal';
import PayBillModal from '@/components/waterSupply/bills/PayBillModal';
import ExpenseModal from '@/components/waterSupply/expense/ExpenseModal';
import { GlassConfirmationModal } from '@/components/ui/GlassConfirmationModal';

type TabType = 'connections' | 'bills' | 'expenses' | 'report';

export default function WaterSupplyScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const { user } = useAuth();
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleGenerateReport = async (month: string) => {
        if (isGeneratingReport) return;
        setIsGeneratingReport(true);
        try {
            const token = user?.token;
            if (!token) {
                Alert.alert('Error', 'Session token not found. Please log in again.');
                return;
            }

            const filename = `Water_Supply_Report_${month}.pdf`;
            const localUri = `${FileSystem.documentDirectory}${filename}`;
            const baseUrl = getApiUrl();
            const apiUrl = `${baseUrl}/api/user/v1/water-supply/generate-monthly-report?billingMonth=${month}`;

            const { uri } = await FileSystem.downloadAsync(apiUrl, localUri, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Water Supply Report - ${month}`,
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert("Success", "Report downloaded successfully.");
            }
        } catch (err: any) {
            console.error('Failed to generate PDF:', err);
            Alert.alert('Error', 'Failed to generate and download PDF report: ' + (err.message || err));
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)' as any);
        }
        return true;
    };

    useBackHandler(handleBack);

    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('connections');

    // ----------------------------------------------------
    // FILTERS STATE
    // ----------------------------------------------------
    const [connSearch, setConnSearch] = useState('');
    const [connStatusFilter, setConnStatusFilter] = useState<string | null>(null);

    const [billStatusFilter, setBillStatusFilter] = useState<string | null>(null);
    const [billMonthFilter, setBillMonthFilter] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

    const [expenseMonthFilter, setExpenseMonthFilter] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [expenseSearch, setExpenseSearch] = useState('');

    const [reportMonths, setReportMonths] = useState(6);
    const [reportMonthFilter, setReportMonthFilter] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

    // ----------------------------------------------------
    // REACT QUERY HOOKS
    // ----------------------------------------------------

    // Connections Query
    const connectionsFilters = {
        search: connSearch,
        status: connStatusFilter || undefined,
        limit: 20
    };
    const {
        data: connectionsInfiniteData,
        isLoading: loadingConnections,
        isRefetching: refreshingConnections,
        refetch: refetchConnections,
        fetchNextPage: fetchNextConnectionsPage,
        hasNextPage: hasNextConnectionsPage,
        isFetchingNextPage: isFetchingNextConnectionsPage,
    } = useInfiniteQuery({
        queryKey: WATER_SUPPLY_QUERY_KEYS.connections(connectionsFilters),
        queryFn: async ({ pageParam = 1 }) => {
            const res: any = await listConnections({
                ...connectionsFilters,
                page: pageParam
            });
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        enabled: activeTab === 'connections',
        staleTime: 120000,
        gcTime: 300000,
    });
    const connections = connectionsInfiniteData?.pages?.flatMap(page => page.data || []) || [];
    const connectionStats = connectionsInfiniteData?.pages?.[0]?.stats || { total: 0, active: 0, suspended: 0, cancelled: 0 };

    // Bills Query
    const billsFilters = {
        billingMonth: billMonthFilter || undefined,
        status: billStatusFilter || undefined,
        limit: 20
    };
    const {
        data: billsInfiniteData,
        isLoading: loadingBills,
        isRefetching: refreshingBills,
        refetch: refetchBills,
        fetchNextPage: fetchNextBillsPage,
        hasNextPage: hasNextBillsPage,
        isFetchingNextPage: isFetchingNextBillsPage,
    } = useInfiniteQuery({
        queryKey: WATER_SUPPLY_QUERY_KEYS.bills(billsFilters),
        queryFn: async ({ pageParam = 1 }) => {
            const res: any = await listBills({
                ...billsFilters,
                page: pageParam
            });
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        enabled: activeTab === 'bills',
        staleTime: 120000,
        gcTime: 300000,
    });
    const bills = billsInfiniteData?.pages?.flatMap(page => page.data || []) || [];
    const billStats = billsInfiniteData?.pages?.[0]?.stats || { totalBills: 0, totalAmount: 0, paidBills: 0, paidAmount: 0, unpaidBills: 0, unpaidAmount: 0 };

    // Expenses Query
    const expensesFilters = {
        search: expenseSearch,
        expenseMonth: expenseMonthFilter || undefined,
        limit: 20
    };
    const {
        data: expensesInfiniteData,
        isLoading: loadingExpenses,
        isRefetching: refreshingExpenses,
        refetch: refetchExpenses,
        fetchNextPage: fetchNextExpensesPage,
        hasNextPage: hasNextExpensesPage,
        isFetchingNextPage: isFetchingNextExpensesPage,
    } = useInfiniteQuery({
        queryKey: WATER_SUPPLY_QUERY_KEYS.expenses(expensesFilters),
        queryFn: async ({ pageParam = 1 }) => {
            const res: any = await listExpenses({
                ...expensesFilters,
                page: pageParam
            });
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        enabled: activeTab === 'expenses',
        staleTime: 120000,
        gcTime: 300000,
    });
    const expenses = expensesInfiniteData?.pages?.flatMap(page => page.data || []) || [];

    // Report Query
    const reportFilters = {
        months: reportMonths,
        reportMonth: reportMonthFilter || undefined
    };
    const {
        data: reportRes,
        isLoading: loadingReport,
        refetch: refetchReport
    } = useQuery({
        queryKey: WATER_SUPPLY_QUERY_KEYS.report(reportFilters),
        queryFn: async () => {
            const res: any = await getFinancialReport(reportFilters);
            return res;
        },
        enabled: activeTab === 'report',
        staleTime: 120000,
        gcTime: 300000,
    });
    const reportData = reportRes?.data || null;

    // ----------------------------------------------------
    // OPTIMISTIC MUTATIONS
    // ----------------------------------------------------
    const deleteConnectionMutation = useMutation({
        mutationFn: deleteConnection,
        onMutate: async (connId: string) => {
            await queryClient.cancelQueries({ queryKey: ['water-supply', 'connections'] });
            const previousData = queryClient.getQueryData(['water-supply', 'connections']);
            queryClient.setQueriesData({ queryKey: ['water-supply', 'connections'] }, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data ? page.data.filter((item: any) => item._id !== connId) : []
                    }))
                };
            });
            return { previousData };
        },
        onError: (err, connId, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(['water-supply', 'connections'], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'connections'] });
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
        }
    });

    const deleteBillMutation = useMutation({
        mutationFn: deleteBill,
        onMutate: async (billId: string) => {
            await queryClient.cancelQueries({ queryKey: ['water-supply', 'bills'] });
            const previousData = queryClient.getQueryData(['water-supply', 'bills']);
            queryClient.setQueriesData({ queryKey: ['water-supply', 'bills'] }, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data ? page.data.filter((item: any) => item._id !== billId) : []
                    }))
                };
            });
            return { previousData };
        },
        onError: (err, billId, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(['water-supply', 'bills'], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'bills'] });
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
        }
    });

    const payBillMutation = useMutation({
        mutationFn: async ({ billId, paymentMode }: { billId: string; paymentMode: string }) => {
            return payBill(billId, paymentMode);
        },
        onMutate: async ({ billId }) => {
            await queryClient.cancelQueries({ queryKey: ['water-supply', 'bills'] });
            const previousData = queryClient.getQueryData(['water-supply', 'bills']);
            queryClient.setQueriesData({ queryKey: ['water-supply', 'bills'] }, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data ? page.data.map((item: any) => {
                            if (item._id === billId) {
                                return { ...item, status: 'PAID' };
                            }
                            return item;
                        }) : []
                    }))
                };
            });
            return { previousData };
        },
        onError: (err, variables, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(['water-supply', 'bills'], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'bills'] });
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
        }
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: deleteExpense,
        onMutate: async (expenseId: string) => {
            await queryClient.cancelQueries({ queryKey: ['water-supply', 'expenses'] });
            const previousData = queryClient.getQueryData(['water-supply', 'expenses']);
            queryClient.setQueriesData({ queryKey: ['water-supply', 'expenses'] }, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data ? page.data.filter((item: any) => item._id !== expenseId) : []
                    }))
                };
            });
            return { previousData };
        },
        onError: (err, expenseId, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(['water-supply', 'expenses'], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'expenses'] });
            queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
        }
    });

    // ----------------------------------------------------
    // MODALS TRIGGER
    // ----------------------------------------------------
    const [connModalOpen, setConnModalOpen] = useState(false);
    const [connModalMode, setConnModalMode] = useState<'add' | 'edit'>('add');
    const [editingConn, setEditingConn] = useState<any>(null);

    const [billModalOpen, setBillModalOpen] = useState(false);
    const [billModalMode, setBillModalMode] = useState<'add' | 'edit'>('add');
    const [editingBill, setEditingBill] = useState<any>(null);

    const [bulkBillModalOpen, setBulkBillModalOpen] = useState(false);

    const [payBillModalOpen, setPayBillModalOpen] = useState(false);
    const [payingBillId, setPayingBillId] = useState<string | null>(null);

    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [expenseModalMode, setExpenseModalMode] = useState<'add' | 'edit'>('add');
    const [editingExpense, setEditingExpense] = useState<any>(null);

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'info';
        onConfirm: () => void | Promise<void>;
    }>({
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
    });

    // ----------------------------------------------------
    // MEMOIZED TAB HANDLERS
    // ----------------------------------------------------
    const onAddConnPress = useCallback(() => {
        setConnModalMode('add');
        setEditingConn(null);
        setConnModalOpen(true);
    }, []);

    const onEditConnPress = useCallback((conn: any) => {
        setConnModalMode('edit');
        setEditingConn(conn);
        setConnModalOpen(true);
    }, []);

    const onGenerateBillPress = useCallback((conn: any) => {
        setEditingConn(conn);
        setBillModalMode('add');
        setEditingBill(conn);
        setBillModalOpen(true);
    }, []);

    const onLoadMoreConnections = useCallback(() => {
        if (hasNextConnectionsPage && !isFetchingNextConnectionsPage) {
            fetchNextConnectionsPage();
        }
    }, [hasNextConnectionsPage, isFetchingNextConnectionsPage, fetchNextConnectionsPage]);

    const onBulkBillPress = useCallback(() => {
        setBulkBillModalOpen(true);
    }, []);

    const onPayBillPress = useCallback((bill: any) => {
        setPayingBillId(bill._id);
        setPayBillModalOpen(true);
    }, []);

    const onEditBillPress = useCallback((bill: any) => {
        setBillModalMode('edit');
        setEditingBill(bill);
        setBillModalOpen(true);
    }, []);

    const onLoadMoreBills = useCallback(() => {
        if (hasNextBillsPage && !isFetchingNextBillsPage) {
            fetchNextBillsPage();
        }
    }, [hasNextBillsPage, isFetchingNextBillsPage, fetchNextBillsPage]);

    const onAddExpensePress = useCallback(() => {
        setExpenseModalMode('add');
        setEditingExpense(null);
        setExpenseModalOpen(true);
    }, []);

    const onEditExpensePress = useCallback((exp: any) => {
        setExpenseModalMode('edit');
        setEditingExpense(exp);
        setExpenseModalOpen(true);
    }, []);

    const onLoadMoreExpenses = useCallback(() => {
        if (hasNextExpensesPage && !isFetchingNextExpensesPage) {
            fetchNextExpensesPage();
        }
    }, [hasNextExpensesPage, isFetchingNextExpensesPage, fetchNextExpensesPage]);

    // ----------------------------------------------------
    // ACTIONS & SUBMISSIONS
    // ----------------------------------------------------

    // Connections Submit
    const handleConnectionSubmit = useCallback(async (data: any) => {
        try {
            let res: any;
            if (connModalMode === 'add') {
                res = await createConnection({
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                    address: data.address,
                    userId: null
                });
            } else {
                res = await updateConnection({
                    _id: editingConn._id,
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                    address: data.address,
                    status: data.status
                } as any);
            }

            if (res?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: connModalMode === 'add' ? 'Connection created successfully' : 'Connection updated successfully'
                });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'connections'] });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
                return true;
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Action failed' });
        }
        return false;
    }, [connModalMode, editingConn, queryClient]);

    // Delete Connection
    const handleConnectionDelete = useCallback((connId: string, name: string) => {
        setConfirmModalConfig({
            title: 'Delete Connection',
            message: `Are you sure you want to delete water connection for "${name}"? All associated bills will also be deleted.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res: any = await deleteConnectionMutation.mutateAsync(connId);
                    if (res?.success) {
                        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Connection deleted successfully' });
                    }
                } catch (err: any) {
                    Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete connection' });
                } finally {
                    setConfirmModalOpen(false);
                }
            }
        });
        setConfirmModalOpen(true);
    }, [deleteConnectionMutation]);

    // Single Bill Submit
    const handleBillSubmit = useCallback(async (data: any) => {
        try {
            let res: any;
            if (billModalMode === 'add') {
                res = await createBill({
                    connectionId: data.connectionId,
                    billingMonth: data.billingMonth,
                    amount: data.amount
                });
            } else {
                res = await updateBill({
                    _id: editingBill._id,
                    amount: data.amount,
                    billingMonth: data.billingMonth
                });
            }

            if (res?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: billModalMode === 'add' ? 'Bill generated successfully' : 'Bill updated successfully'
                });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'bills'] });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
                return true;
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Action failed' });
        }
        return false;
    }, [billModalMode, editingBill, queryClient]);

    // Bulk Bill Submit
    const handleBulkBillSubmit = useCallback(async (data: any) => {
        try {
            const res: any = await bulkCreateBills({
                billingMonth: data.billingMonth,
                amount: data.amount
            });
            if (res?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Bulk Generation Complete',
                    text2: res.message || 'Bills generated successfully'
                });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'bills'] });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
                return true;
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Bulk generation failed' });
        }
        return false;
    }, [queryClient]);

    // Delete Bill
    const handleBillDelete = useCallback((billId: string) => {
        setConfirmModalConfig({
            title: 'Delete Bill',
            message: 'Are you sure you want to delete this bill?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res: any = await deleteBillMutation.mutateAsync(billId);
                    if (res?.success) {
                        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Bill deleted successfully' });
                    }
                } catch (err: any) {
                    Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete bill' });
                } finally {
                    setConfirmModalOpen(false);
                }
            }
        });
        setConfirmModalOpen(true);
    }, [deleteBillMutation]);

    // Pay Bill Submit
    const handlePayBillSubmit = useCallback(async (paymentMode: string) => {
        if (!payingBillId) return false;
        try {
            const res: any = await payBillMutation.mutateAsync({ billId: payingBillId, paymentMode });
            if (res?.success) {
                Toast.show({ type: 'success', text1: 'Paid', text2: 'Bill marked as Paid successfully' });
                return true;
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Payment failed' });
        }
        return false;
    }, [payingBillId, payBillMutation]);

    // Expense Submit
    const handleExpenseSubmit = useCallback(async (data: any) => {
        try {
            let res: any;
            if (expenseModalMode === 'add') {
                res = await createExpense({
                    title: data.title,
                    amount: data.amount,
                    expenseDate: data.expenseDate
                });
            } else {
                res = await updateExpense({
                    _id: editingExpense._id,
                    title: data.title,
                    amount: data.amount,
                    expenseDate: data.expenseDate
                });
            }

            if (res?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: expenseModalMode === 'add' ? 'Expense logged successfully' : 'Expense updated successfully'
                });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'expenses'] });
                queryClient.invalidateQueries({ queryKey: ['water-supply', 'report'] });
                return true;
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Action failed' });
        }
        return false;
    }, [expenseModalMode, editingExpense, queryClient]);

    // Delete Expense
    const handleExpenseDelete = useCallback((expenseId: string) => {
        setConfirmModalConfig({
            title: 'Delete Expense',
            message: 'Are you sure you want to delete this expense?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res: any = await deleteExpenseMutation.mutateAsync(expenseId);
                    if (res?.success) {
                        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Expense deleted successfully' });
                    }
                } catch (err: any) {
                    Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete expense' });
                } finally {
                    setConfirmModalOpen(false);
                }
            }
        });
        setConfirmModalOpen(true);
    }, [deleteExpenseMutation]);

    const handleRefresh = useCallback(() => {
        if (activeTab === 'connections') refetchConnections();
        else if (activeTab === 'bills') refetchBills();
        else if (activeTab === 'expenses') refetchExpenses();
        else if (activeTab === 'report') refetchReport();
        Toast.show({ type: 'info', text1: 'Refreshed', text2: 'Data has been reloaded' });
    }, [activeTab, refetchConnections, refetchBills, refetchExpenses, refetchReport]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <WaterSupplyHeader
                insets={insets}
                colors={colors}
                onBack={handleBack}
                onRefresh={handleRefresh}
            />

            {/* Custom Tab Selector */}
            <WaterSupplyTabBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isDark={isDark}
                colors={colors}
            />

            {/* Active Content */}
            <View style={styles.contentWrap}>
                {activeTab === 'connections' && (
                    <ConnectionsTab
                        connections={connections}
                        connectionStats={connectionStats}
                        connSearch={connSearch}
                        setConnSearch={setConnSearch}
                        connStatusFilter={connStatusFilter}
                        setConnStatusFilter={setConnStatusFilter}
                        loading={loadingConnections}
                        refreshing={refreshingConnections}
                        onRefresh={refetchConnections}
                        onAddPress={onAddConnPress}
                        onEditPress={onEditConnPress}
                        onDeletePress={handleConnectionDelete}
                        onGenerateBillPress={onGenerateBillPress}
                        isDark={isDark}
                        colors={colors}
                        onLoadMore={onLoadMoreConnections}
                        isFetchingNextPage={isFetchingNextConnectionsPage}
                    />
                )}

                {activeTab === 'bills' && (
                    <BillsTab
                        bills={bills}
                        billStats={billStats}
                        billStatusFilter={billStatusFilter}
                        setBillStatusFilter={setBillStatusFilter}
                        billMonthFilter={billMonthFilter}
                        setBillMonthFilter={setBillMonthFilter}
                        loading={loadingBills}
                        refreshing={refreshingBills}
                        onRefresh={refetchBills}
                        onBulkPress={onBulkBillPress}
                        onPayPress={onPayBillPress}
                        onEditPress={onEditBillPress}
                        onDeletePress={handleBillDelete}
                        isDark={isDark}
                        colors={colors}
                        onLoadMore={onLoadMoreBills}
                        isFetchingNextPage={isFetchingNextBillsPage}
                    />
                )}

                {activeTab === 'expenses' && (
                    <ExpensesTab
                        expenses={expenses}
                        expenseMonthFilter={expenseMonthFilter}
                        setExpenseMonthFilter={setExpenseMonthFilter}
                        expenseSearch={expenseSearch}
                        setExpenseSearch={setExpenseSearch}
                        loading={loadingExpenses}
                        refreshing={refreshingExpenses}
                        onRefresh={refetchExpenses}
                        onAddPress={onAddExpensePress}
                        onEditPress={onEditExpensePress}
                        onDeletePress={handleExpenseDelete}
                        isDark={isDark}
                        colors={colors}
                        onLoadMore={onLoadMoreExpenses}
                        isFetchingNextPage={isFetchingNextExpensesPage}
                    />
                )}

                {activeTab === 'report' && (
                    <ReportTab
                        reportData={reportData}
                        reportMonths={reportMonths}
                        setReportMonths={setReportMonths}
                        reportMonthFilter={reportMonthFilter}
                        setReportMonthFilter={setReportMonthFilter}
                        loading={loadingReport}
                        isDark={isDark}
                        colors={colors}
                        onGenerateReport={handleGenerateReport}
                        isGeneratingReport={isGeneratingReport}
                    />
                )}
            </View>

            {/* Connection Add/Edit Modal */}
            <ConnectionModal
                key={connModalOpen ? (editingConn?._id ? `edit-${editingConn._id}` : 'add') : 'closed-conn'}
                visible={connModalOpen}
                onClose={() => setConnModalOpen(false)}
                mode={connModalMode}
                initialData={editingConn}
                onSubmit={handleConnectionSubmit}
                isDark={isDark}
                colors={colors}
            />

            {/* Bill Add/Edit Modal */}
            <BillModal
                key={billModalOpen ? (editingBill?._id ? `edit-${editingBill._id}` : 'add') : 'closed-bill'}
                visible={billModalOpen}
                onClose={() => setBillModalOpen(false)}
                mode={billModalMode}
                initialData={editingBill}
                connections={connections}
                onSubmit={handleBillSubmit}
                isDark={isDark}
                colors={colors}
            />

            {/* Bulk Bill Modal */}
            <BulkBillModal
                key={bulkBillModalOpen ? 'open' : 'closed-bulk'}
                visible={bulkBillModalOpen}
                onClose={() => setBulkBillModalOpen(false)}
                onSubmit={handleBulkBillSubmit}
                isDark={isDark}
                colors={colors}
            />

            {/* Pay Bill Modal */}
            <PayBillModal
                key={payBillModalOpen ? `pay-${payingBillId}` : 'closed-pay'}
                visible={payBillModalOpen}
                onClose={() => setPayBillModalOpen(false)}
                onSubmit={handlePayBillSubmit}
                isDark={isDark}
                colors={colors}
            />

            {/* Expense Modal */}
            <ExpenseModal
                key={expenseModalOpen ? (editingExpense?._id ? `edit-${editingExpense._id}` : 'add') : 'closed-expense'}
                visible={expenseModalOpen}
                onClose={() => setExpenseModalOpen(false)}
                mode={expenseModalMode}
                initialData={editingExpense}
                onSubmit={handleExpenseSubmit}
                isDark={isDark}
                colors={colors}
            />

            {/* Custom Pop Confirmation Modal */}
            <GlassConfirmationModal
                visible={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmModalConfig.onConfirm}
                title={confirmModalConfig.title}
                message={confirmModalConfig.message}
                type={confirmModalConfig.type}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentWrap: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
});
