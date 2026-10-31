import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Bar,
} from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CountUp from 'react-countup';
import {
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    FileImage,
    FilePlus,
    FileText,
    Receipt,
    Search,
    Sparkles,
    Store,
    Upload,
    UserRound,
    Wallet,
    X,
} from 'lucide-react';
import MonthlyPeak from '@/components/charts/monthly-peak';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Expenses', href: '/expenses' },
];

type Expense = {
    id: number;
    school_year_id: number;
    expense_category: string;
    description: string;
    vendor_merchant: string;
    expense_date: string;
    receipt_number: string;
    amount: string;
    remarks: string;
    responsible: string;
    receipt_photo?: string | null;
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

const expenseCategories = [
    'Salaries and Wages',
    'Utilities',
    'Teaching Materials',
    'Facility Maintenance',
    'Transportation',
    'Technology and IT',
    'Student Activities and Events',
    'Professional Development',
    'Insurance',
    'Taxes and Government Fees',
    'Food Services',
    'Miscellaneous Expenses',
];

export default function Expenses() {
    const {
        expenses,
        filters,
        overallTotal,
        categoryTotals,
        monthlyExpenseData,
        monthlyPeak,
        monthlyPeakMonth,
    } = usePage().props as {
        expenses: Pagination<Expense>;
        filters: { search?: string };
        overallTotal: number;
        categoryTotals: Record<string, number>;

        monthlyExpenseData: {
            month: string;
            label: string;
            total: number;
        }[];

        monthlyPeak: number;
        monthlyPeakMonth: string | null;
    };


    const [open, setOpen] = useState(false);
    const [expenseCategory, setExpenseCategory] = useState('');
    const [expenseMerchant, setExpenseMerchant] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [responsible, setResponsible] = useState('');
    const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        router.get(
            '/billing/expenses',
            {
                search: searchValue.trim(),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    toast.loading('Finding expenses...', {
                        id: 'expense-search',
                    });
                },
                onSuccess: () => {
                    toast.success('Expenses updated!', {
                        id: 'expense-search',
                    });
                },
                onError: () => {
                    toast.error('We couldn’t complete the search.', {
                        id: 'expense-search',
                    });
                },
            }
        );
    };

    const resetForm = () => {
        setExpenseCategory('');
        setExpenseMerchant('');
        setExpenseDate('');
        setReceiptNumber('');
        setAmount('');
        setRemarks('');
        setResponsible('');
        setReceiptPhoto(null);
        setReceiptPreview(null);
    };

    const handleDialogChange = (value: boolean) => {
        if (isLoading) return;

        setOpen(value);

        if (!value) {
            resetForm();
        }
    };

    const handleReceiptChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] ?? null;

        setReceiptPhoto(file);

        if (receiptPreview) {
            URL.revokeObjectURL(receiptPreview);
        }

        if (file) {
            setReceiptPreview(URL.createObjectURL(file));
        } else {
            setReceiptPreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (
            !expenseCategory ||
            !expenseMerchant.trim() ||
            !expenseDate ||
            !receiptNumber.trim() ||
            !amount ||
            !responsible.trim()
        ) {
            toast.error('Almost there!', {
                description:
                    'Please complete all required fields before saving.',
            });
            return;
        }

        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            toast.error('Please enter a valid amount greater than ₱0.00.');
            return;
        }

        const formData = new FormData();

        formData.append('expense_category', expenseCategory);
        formData.append(
            'vendor_merchant',
            expenseMerchant.trim()
        );
        formData.append('expense_date', expenseDate);
        formData.append(
            'receipt_number',
            receiptNumber.trim()
        );
        formData.append('amount', amount);
        formData.append('remarks', remarks.trim());
        formData.append(
            'responsible',
            responsible.trim()
        );

        if (receiptPhoto) {
            formData.append('receipt_photo', receiptPhoto);
        }

        setIsLoading(true);

        router.post('/billing/expenses', formData, {
            preserveScroll: true,

            onStart: () => {
                toast.loading('Saving your expense...', {
                    id: 'save-expense',
                });
            },

            onSuccess: () => {
                setOpen(false);
                resetForm();

                toast.success('Expense saved successfully! 🎉', {
                    id: 'save-expense',
                    description:
                        'Your expense record has been added.',
                });

                setIsLoading(false);
            },

            onError: (errors) => {
                setIsLoading(false);

                const errorMessage =
                    typeof errors?.message === 'string'
                        ? errors.message
                        : 'Please review the form and try again.';

                toast.error('We couldn’t save the expense.', {
                    id: 'save-expense',
                    description: errorMessage,
                });
            },

            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    const chartData = {
        labels: Object.keys(categoryTotals),
        datasets: [
            {
                label: 'Expense Total',
                data: Object.values(categoryTotals),
                backgroundColor: 'rgba(59, 130, 246, 0.72)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1,
                borderRadius: 8,
                maxBarThickness: 42,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = Number(context.raw || 0);

                        return ` ₱${value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#64748b',
                    maxRotation: 45,
                    minRotation: 0,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(148, 163, 184, 0.15)',
                },
                ticks: {
                    color: '#64748b',
                    callback: (value: any) =>
                        `₱${Number(value).toLocaleString()}`,
                },
            },
        },
    };

    const formatAmount = (value: string | number) => {
        return Number(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (date: string) => {
        if (!date) return '—';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

const getReceiptUrl = (receiptPhoto?: string | null) => {
    // Replace 'your_bucket_name' with the exact name of your Supabase bucket
    const supabaseBaseUrl = 'https://tqkarwsfiryvraqkdetc.supabase.co/storage/v1/object/public/public-assets';

    return receiptPhoto
        ? `${supabaseBaseUrl}/${receiptPhoto}`
        : '/images/no-image.png';
};

    const totalCategories = Object.keys(categoryTotals).length;
    const totalRecords = expenses.data.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />

            <Toaster
                position="top-center"
                richColors
                closeButton
            />

            <div className="full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8">

                    {/* =====================================================
                        PAGE HEADER
                    ====================================================== */}
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-500/10 sm:p-8">
                        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Financial overview
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                                    Let’s keep your expenses organized. ✨
                                </h1>

                                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                                    Track spending, monitor your budget,
                                    and keep every receipt right where
                                    you need it.
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                                <div className="rounded-lg bg-white/15 p-2.5">
                                    <Receipt className="h-6 w-6" />
                                </div>

                                <div>
                                    <p className="text-xs text-blue-100">
                                        Records on this page
                                    </p>
                                    <p className="text-xl font-bold">
                                        {totalRecords}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        KPI CARDS
                    ====================================================== */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Card className="group overflow-hidden border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-blue-900/40 dark:from-blue-950/40 dark:to-slate-950">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Total Expenses
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-300 sm:text-3xl">
                                            ₱
                                            <CountUp
                                                end={overallTotal}
                                                duration={1}
                                                separator=","
                                                decimals={2}
                                            />
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Overall recorded spending
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-105">
                                        <Wallet className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-950">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Categories
                                        </p>

                                        <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                            <CountUp
                                                end={totalCategories}
                                                duration={1}
                                            />
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Spending categories tracked
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-emerald-600 p-3 text-white shadow-lg shadow-emerald-600/20 transition-transform group-hover:scale-105">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group overflow-hidden border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-violet-900/40 dark:from-violet-950/40 dark:to-slate-950">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Current Page
                                        </p>

                                        <p className="mt-2 text-3xl font-bold tracking-tight text-violet-700 dark:text-violet-300">
                                            <CountUp
                                                end={totalRecords}
                                                duration={1}
                                            />
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Expense records displayed
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-violet-600 p-3 text-white shadow-lg shadow-violet-600/20 transition-transform group-hover:scale-105">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group overflow-hidden border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-amber-900/40 dark:from-amber-950/40 dark:to-slate-950">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Records Status
                                        </p>

                                        <p className="mt-2 flex items-center gap-2 text-lg font-bold text-amber-700 dark:text-amber-300">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Organized
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Keep receipts attached
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-amber-500 p-3 text-white shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105">
                                        <CircleDollarSign className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* =====================================================
                        ANALYTICS
                    ====================================================== */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                        <Card className="overflow-hidden xl:col-span-3">
                            <CardHeader>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-blue-600" />
                                            Expense Trends
                                        </CardTitle>

                                        <CardDescription>
                                            See where your spending is going.
                                        </CardDescription>
                                    </div>

                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                        Category breakdown
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6">
                                <div className="h-[320px] w-full sm:h-[360px]">
                                    {Object.keys(categoryTotals).length > 0 ? (
                                        <Bar
                                            data={chartData}
                                            options={chartOptions}
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
                                            <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
                                            <p className="font-medium">
                                                No category data yet
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Add your first expense to start seeing trends.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                                    Spending by Category
                                </CardTitle>

                                <CardDescription>
                                    A quick look at your recorded totals.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6">
                                {Object.entries(categoryTotals).length > 0 ? (
                                    <div className="grid max-h-[360px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
                                        {Object.entries(categoryTotals).map(
                                            ([category, total]) => (
                                                <div
                                                    key={category}
                                                    className="group rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4 transition-all hover:border-blue-200 hover:shadow-sm dark:from-slate-950 dark:to-slate-900 dark:hover:border-blue-900"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                                                                <CircleDollarSign className="h-4 w-4" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {category}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                    Category total
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <p className="shrink-0 text-sm font-bold text-blue-700 dark:text-blue-300">
                                                            ₱
                                                            <CountUp
                                                                end={total}
                                                                duration={1}
                                                                separator=","
                                                                decimals={2}
                                                            />
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                                        <div className="mb-4 rounded-full bg-muted p-4">
                                            <CircleDollarSign className="h-7 w-7 text-muted-foreground" />
                                        </div>

                                        <p className="font-semibold">
                                            No categories yet
                                        </p>

                                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                            Once you start recording expenses,
                                            category totals will appear here.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <MonthlyPeak
                        data={monthlyExpenseData}
                        peak={monthlyPeak}
                        peakMonth={monthlyPeakMonth}
                    />

                    {/* =====================================================
                        SEARCH + NEW RECORD
                    ====================================================== */}
                    <Card className="overflow-hidden">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <form
                                    onSubmit={handleSearch}
                                    className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
                                >
                                    <div className="relative flex-1">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                        <Input
                                            name="search"
                                            value={searchValue}
                                            onChange={(e) =>
                                                setSearchValue(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Search by vendor, category, receipt..."
                                            className="h-11 pl-9"
                                        />

                                        {searchValue && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSearchValue('')
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                aria-label="Clear search"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-11 gap-2 bg-blue-600 px-5 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                                    >
                                        <Search className="h-4 w-4" />
                                        Search
                                    </Button>
                                </form>

                                <Dialog
                                    open={open}
                                    onOpenChange={handleDialogChange}
                                >
                                    <DialogTrigger asChild>
                                        <Button className="h-11 w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-white shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg sm:w-auto">
                                            <FilePlus className="h-4 w-4" />
                                            Add New Expense
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="max-h-[95vh] w-[calc(100%-1rem)] overflow-y-auto p-0 sm:max-w-2xl">
                                        {/* FORM HEADER */}
                                        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white sm:p-7">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                                                    <div className="rounded-lg bg-white/15 p-2">
                                                        <Receipt className="h-5 w-5" />
                                                    </div>
                                                    Add New Expense
                                                </DialogTitle>

                                                <DialogDescription className="text-blue-100">
                                                    Record your expense details
                                                    below. You’re doing great
                                                    keeping everything organized!
                                                </DialogDescription>
                                            </DialogHeader>
                                        </div>

                                        <form
                                            onSubmit={handleSubmit}
                                            className="space-y-6 p-5 sm:p-7"
                                        >
                                            {/* CATEGORY + MERCHANT */}
                                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expense_category">
                                                        Expense Category
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Select
                                                        value={
                                                            expenseCategory
                                                        }
                                                        onValueChange={
                                                            setExpenseCategory
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="expense_category"
                                                            className="h-11"
                                                        >
                                                            <SelectValue placeholder="Choose a category" />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            {expenseCategories.map(
                                                                (
                                                                    category
                                                                ) => (
                                                                    <SelectItem
                                                                        key={
                                                                            category
                                                                        }
                                                                        value={
                                                                            category
                                                                        }
                                                                    >
                                                                        {
                                                                            category
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>

                                                    <p className="text-xs text-muted-foreground">
                                                        Choose the category that
                                                        best describes this
                                                        expense.
                                                    </p>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="vendor_merchant">
                                                        Vendor / Merchant
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <div className="relative">
                                                        <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                        <Input
                                                            id="vendor_merchant"
                                                            type="text"
                                                            value={
                                                                expenseMerchant
                                                            }
                                                            onChange={(e) =>
                                                                setExpenseMerchant(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="e.g. ABC Supplies"
                                                            className="h-11 pl-9"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DATE + RECEIPT */}
                                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expense_date">
                                                        Expense Date
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <div className="relative">
                                                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                        <Input
                                                            id="expense_date"
                                                            type="date"
                                                            value={
                                                                expenseDate
                                                            }
                                                            onChange={(e) =>
                                                                setExpenseDate(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="h-11 pl-9"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="receipt_number">
                                                        Receipt / OR Number
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <div className="relative">
                                                        <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                        <Input
                                                            id="receipt_number"
                                                            type="text"
                                                            value={
                                                                receiptNumber
                                                            }
                                                            onChange={(e) =>
                                                                setReceiptNumber(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="e.g. OR-000123"
                                                            className="h-11 pl-9"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AMOUNT */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="amount">
                                                    Amount
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </Label>

                                                <div className="relative">
                                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                                                        ₱
                                                    </span>

                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={amount}
                                                        onChange={(e) =>
                                                            setAmount(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="h-12 pl-8 text-lg font-semibold"
                                                        required
                                                    />
                                                </div>

                                                <p className="text-xs text-muted-foreground">
                                                    Enter the exact amount shown
                                                    on your receipt.
                                                </p>
                                            </div>

                                            {/* REMARKS */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="remarks">
                                                    Remarks
                                                </Label>

                                                <Input
                                                    id="remarks"
                                                    type="text"
                                                    value={remarks}
                                                    onChange={(e) =>
                                                        setRemarks(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Add a short note about this expense..."
                                                    className="h-11"
                                                />
                                            </div>

                                            {/* RESPONSIBLE */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="responsible">
                                                    Responsible Person
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </Label>

                                                <div className="relative">
                                                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                    <Input
                                                        id="responsible"
                                                        type="text"
                                                        value={responsible}
                                                        onChange={(e) =>
                                                            setResponsible(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Who handled this expense?"
                                                        className="h-11 pl-9"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* RECEIPT UPLOAD */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="receipt_photo">
                                                    Receipt Photo
                                                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                        (recommended)
                                                    </span>
                                                </Label>

                                                <label
                                                    htmlFor="receipt_photo"
                                                    className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                                                >
                                                    {receiptPreview ? (
                                                        <div className="w-full">
                                                            <img
                                                                src={
                                                                    receiptPreview
                                                                }
                                                                alt="Receipt preview"
                                                                className="mx-auto max-h-52 rounded-lg object-contain shadow-sm"
                                                            />

                                                            <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
                                                                <Upload className="h-4 w-4" />
                                                                Choose a
                                                                different image
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="mb-3 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                                                                <FileImage className="h-6 w-6" />
                                                            </div>

                                                            <p className="text-sm font-semibold">
                                                                Upload your
                                                                receipt
                                                            </p>

                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Click here to
                                                                choose an image
                                                                from your device
                                                            </p>

                                                            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                                                                <Upload className="h-3.5 w-3.5" />
                                                                Select image
                                                            </span>
                                                        </>
                                                    )}

                                                    <Input
                                                        id="receipt_photo"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={
                                                            handleReceiptChange
                                                        }
                                                        className="sr-only"
                                                    />
                                                </label>
                                            </div>

                                            {/* REMINDER */}
                                            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/20">
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                                            Quick reminder
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                                                            Once submitted,
                                                            this expense cannot
                                                            be changed. Please
                                                            double-check the
                                                            details and receipt
                                                            before saving.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACTIONS */}
                                            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleDialogChange(
                                                            false
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                    className="h-11"
                                                >
                                                    Cancel
                                                </Button>

                                                <Button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="h-11 gap-2 bg-blue-600 px-6 text-white hover:bg-blue-700"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                            Saving expense...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Save Expense
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        EXPENSE TABLE
                    ====================================================== */}
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-blue-600" />
                                        Expense Records
                                    </CardTitle>

                                    <CardDescription>
                                        Review your recorded expenses and
                                        receipts.
                                    </CardDescription>
                                </div>

                                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    {expenses.data.length} record
                                    {expenses.data.length === 1 ? '' : 's'}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {expenses.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableHead className="whitespace-nowrap">
                                                    Category
                                                </TableHead>
                                                <TableHead>
                                                    Remarks
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Amount
                                                </TableHead>
                                                <TableHead>
                                                    Vendor
                                                </TableHead>
                                                <TableHead className="whitespace-nowrap">
                                                    Date
                                                </TableHead>
                                                <TableHead>
                                                    OR / Receipt
                                                </TableHead>
                                                <TableHead>
                                                    Responsible
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Receipt
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {expenses.data.map((exp) => (
                                                <TableRow
                                                    key={exp.id}
                                                    className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                                                >
                                                    <TableCell>
                                                        <div className="flex min-w-[180px] items-center gap-2">
                                                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                                                                <CircleDollarSign className="h-4 w-4" />
                                                            </div>

                                                            <span className="font-medium">
                                                                {
                                                                    exp.expense_category
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="block max-w-[220px] truncate text-sm text-muted-foreground">
                                                            {exp.remarks ||
                                                                'No remarks'}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            ₱
                                                            {formatAmount(
                                                                exp.amount
                                                            )}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex min-w-[150px] items-center gap-2">
                                                            <Store className="h-4 w-4 shrink-0 text-muted-foreground" />

                                                            <span className="font-medium">
                                                                {
                                                                    exp.vendor_merchant
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CalendarDays className="h-4 w-4 text-muted-foreground" />

                                                            {formatDate(
                                                                exp.expense_date
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                                                            {
                                                                exp.receipt_number
                                                            }
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex min-w-[140px] items-center gap-2">
                                                            <UserRound className="h-4 w-4 text-muted-foreground" />

                                                            <span className="text-sm">
                                                                {
                                                                    exp.responsible
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2 transition-all group-hover:border-blue-300 group-hover:text-blue-600"
                                                            onClick={() =>
                                                                setSelectedImage(
                                                                    getReceiptUrl(
                                                                        exp.receipt_photo
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <FileImage className="h-4 w-4" />
                                                            <span className="hidden sm:inline">
                                                                View
                                                            </span>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="mb-5 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 p-5 text-blue-600 dark:from-blue-950/50 dark:to-indigo-950/50 dark:text-blue-300">
                                        <Receipt className="h-10 w-10" />
                                    </div>

                                    <h3 className="text-lg font-semibold">
                                        {searchValue
                                            ? 'No expenses found'
                                            : 'Your expense list is ready!'}
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                        {searchValue
                                            ? `We couldn't find any expense records matching "${searchValue}". Try another search.`
                                            : 'Start adding your expense records and keep your financial information beautifully organized.'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        RECEIPT VIEWER
                    ====================================================== */}
                    <Dialog
                        open={!!selectedImage}
                        onOpenChange={() => setSelectedImage(null)}
                    >
                        <DialogContent className="max-h-[95vh] max-w-5xl overflow-hidden p-0">
                            <DialogHeader className="sr-only">
                                <DialogTitle>
                                    Expense Receipt
                                </DialogTitle>
                            </DialogHeader>

                            {selectedImage && (
                                <div className="flex max-h-[90vh] items-center justify-center bg-slate-950 p-3 sm:p-6">
                                    <img
                                        src={selectedImage}
                                        alt="Full expense receipt"
                                        className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
                                    />
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* =====================================================
                        PAGINATION
                    ====================================================== */}
                    {expenses.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row">
                            <p className="text-sm text-muted-foreground">
                                Page{' '}
                                <span className="font-medium text-foreground">
                                    {expenses.current_page}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-foreground">
                                    {expenses.last_page}
                                </span>
                            </p>

                            <div className="flex flex-wrap justify-center gap-1.5">
                                {expenses.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={
                                            link.active
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        className={
                                            link.active
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : ''
                                        }
                                        onClick={() =>
                                            link.url &&
                                            router.get(
                                                link.url,
                                                {},
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                }
                                            )
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
