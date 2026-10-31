<?php

namespace App\Http\Controllers;

use App\Models\BillingExpenses;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingExpensesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
public function index(Request $request)
{
    $search = $request->input('search');

    // =========================================================
    // FILTERED EXPENSES - FOR TABLE
    // =========================================================
    $expenses = BillingExpenses::with('schoolYear')
        ->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('expense_category', 'like', "%{$search}%")
                    ->orWhere('vendor_merchant', 'like', "%{$search}%")
                    ->orWhere('receipt_number', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(10)
        ->withQueryString();


    // =========================================================
    // ALL EXPENSES - FOR DASHBOARD ANALYTICS
    // =========================================================
    $allExpenses = BillingExpenses::all();


    // =========================================================
    // OVERALL TOTAL
    // =========================================================
    $overallTotal = $allExpenses->sum('amount');


    // =========================================================
    // TOTAL BY CATEGORY
    // =========================================================
    $categoryTotals = $allExpenses
        ->groupBy('expense_category')
        ->map(function ($group) {
            return $group->sum('amount');
        });


    // =========================================================
    // MONTHLY EXPENSE TOTALS
    // Based on expense_date
    // =========================================================
    $monthlyTotals = $allExpenses
        ->filter(function ($expense) {
            return !empty($expense->expense_date);
        })
        ->groupBy(function ($expense) {
            return \Carbon\Carbon::parse($expense->expense_date)
                ->format('Y-m');
        })
        ->map(function ($group) {
            return $group->sum('amount');
        })
        ->sortKeys();


    // =========================================================
    // MONTHLY PEAK
    // =========================================================
    $monthlyPeak = $monthlyTotals->max() ?? 0;

    $monthlyPeakMonth = $monthlyTotals
        ->filter(function ($total) use ($monthlyPeak) {
            return $total == $monthlyPeak;
        })
        ->keys()
        ->first();


    // =========================================================
    // FORMAT MONTHLY DATA FOR FRONTEND
    // =========================================================
    $monthlyExpenseData = $monthlyTotals
        ->map(function ($total, $month) {
            return [
                'month' => $month,
                'label' => \Carbon\Carbon::createFromFormat(
                    'Y-m',
                    $month
                )->format('M Y'),
                'total' => (float) $total,
            ];
        })
        ->values();


    return Inertia::render('billing/billing-expenses', [
        'expenses' => $expenses,

        'filters' => [
            'search' => $search,
        ],

        // Dashboard totals
        'overallTotal' => $overallTotal,
        'categoryTotals' => $categoryTotals,

        // Monthly analytics
        'monthlyExpenseData' => $monthlyExpenseData,
        'monthlyPeak' => $monthlyPeak,
        'monthlyPeakMonth' => $monthlyPeakMonth,
    ]);
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // validate request data
        $validated = $request->validate([
            'expense_category' => 'required|string|max:255',
            'vendor_merchant' => 'required|string|max:255',
            'expense_date' => 'required|date',
            'receipt_number' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'remarks' => 'string|max:255',
            'responsible' => 'required|string|max:255',
            'receipt_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // find the active school year
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();

        if (!$activeSchoolYear) {
            return back()->withErrors(['school_year_id' => 'No active school year found.']);
        }

        // handle photo upload if provided
        if ($request->hasFile('receipt_photo')) {
            // Change 'public' to 's3' to upload to Supabase
            $path = $request->file('receipt_photo')->store('receipts', 's3');
            $validated['receipt_photo'] = $path;
        }

        // assign school_year_id automatically
        $validated['school_year_id'] = $activeSchoolYear->id;

        // create the billing expense
        BillingExpenses::create($validated);

        return back()->with('success', 'Expense successfully recorded.');
    }


    /**
     * Display the specified resource.
     */
    public function show(BillingExpenses $billingExpenses)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BillingExpenses $billingExpenses)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BillingExpenses $billingExpenses)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BillingExpenses $billingExpenses)
    {
        //
    }
}
