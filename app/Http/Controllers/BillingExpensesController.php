<?php

namespace App\Http\Controllers;

use App\Models\BillingExpenses;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
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
    $validated = $request->validate([
        'expense_category' => ['required', 'string', 'max:255'],
        'vendor_merchant' => ['required', 'string', 'max:255'],
        'expense_date' => ['required', 'date'],
        'receipt_number' => ['required', 'string', 'max:255'],
        'amount' => ['required', 'numeric', 'min:0.01'],
        'remarks' => ['nullable', 'string', 'max:255'],
        'responsible' => ['required', 'string', 'max:255'],
        'receipt_photo' => [
            'nullable',
            'image',
            'mimes:jpg,jpeg,png',
            'max:2048',
        ],
    ], [
        'expense_category.required' => 'Please select an expense category.',
        'vendor_merchant.required' => 'Please enter the vendor or merchant name.',
        'expense_date.required' => 'Please select the expense date.',
        'expense_date.date' => 'Please enter a valid expense date.',
        'receipt_number.required' => 'Please enter the receipt or OR number.',
        'amount.required' => 'Please enter the expense amount.',
        'amount.numeric' => 'The expense amount must be a valid number.',
        'amount.min' => 'The expense amount must be greater than zero.',
        'responsible.required' => 'Please enter the responsible person.',
        'receipt_photo.image' => 'The receipt attachment must be an image.',
        'receipt_photo.mimes' => 'Only JPG, JPEG, and PNG images are allowed.',
        'receipt_photo.max' => 'The receipt image must not exceed 2MB.',
    ]);

    // Find active school year
    $activeSchoolYear = SchoolYear::where('is_active', true)->first();

    if (!$activeSchoolYear) {
        throw ValidationException::withMessages([
            'form' => 'Cannot record expense. No active school year was found.',
        ]);
    }

    // Assign school year automatically
    $validated['school_year_id'] = $activeSchoolYear->id;

    // Upload receipt photo if provided
    if ($request->hasFile('receipt_photo')) {
        $validated['receipt_photo'] = $request
            ->file('receipt_photo')
            ->store('receipts', 's3');
    }

    // Create expense record
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
