import { supabase } from '../supabaseClient'

export interface Expense {
    id: string;
    date: string;
    head: string;
    amount: number;
    notes?: string;
    gst_enabled?: boolean;
    gst_rate?: number;
    gst_amount?: number;
    invoice_number?: string;
    vendor_name?: string;
    created_at: string;
}

export const getExpenses = async () => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

    if (error) throw error
    return data as Expense[]
}

export const createExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()

    if (error) throw error
    return data as Expense
}
