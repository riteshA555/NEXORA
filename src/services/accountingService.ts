import { supabase } from '../supabaseClient'

export interface LedgerSummary {
    ledger_name: string;
    total_debit: number;
    total_credit: number;
    balance: number;
}

export interface PLData {
    jobWorkIncome: number;
    productSalesIncome: number;
    generalExpenses: number;
    karigarExpenses: number;
    totalExpenses: number;
    netProfit: number;
}

export const getPLReport = async () => {
    // 1. Get Incomes from system ledgers
    const { data: incomeData, error: incomeError } = await supabase
        .from('transactions')
        .select('ledgers!inner(name), credit')
        .in('ledgers.name', ['Job Work Income', 'Product Sales Income'])

    if (incomeError) throw incomeError

    const jobWorkIncome = incomeData
        .filter(t => (t.ledgers as any).name === 'Job Work Income')
        .reduce((sum, t) => sum + Number(t.credit), 0)

    const productSalesIncome = incomeData
        .filter(t => (t.ledgers as any).name === 'Product Sales Income')
        .reduce((sum, t) => sum + Number(t.credit), 0)

    // 2. Get Expenses and separate Karigar vs General
    const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('head, amount')

    if (expenseError) throw expenseError

    const karigarExpenses = expenseData
        .filter(e => e.head.startsWith('Karigar Payment'))
        .reduce((sum, e) => sum + Number(e.amount), 0)

    const generalExpenses = expenseData
        .filter(e => !e.head.startsWith('Karigar Payment'))
        .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalExpenses = generalExpenses + karigarExpenses

    return {
        jobWorkIncome,
        productSalesIncome,
        generalExpenses,
        karigarExpenses,
        totalExpenses,
        netProfit: (jobWorkIncome + productSalesIncome) - totalExpenses
    } as PLData
}

export const getCustomerStatement = async (customerName: string) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*, ledgers!inner(name)')
        .eq('ledgers.name', customerName)
        .order('date', { ascending: true })

    if (error) throw error
    return data
}
