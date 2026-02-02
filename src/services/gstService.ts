import { supabase } from '../supabaseClient'
import { Order } from '../types'
import { Expense } from './expenseService'

export interface GSTSummaryItem {
    rate: number;
    taxableValue: number;
    gstAmount: number;
    totalAmount: number;
    type: 'output' | 'input';
}

export interface ITCStat {
    openingBalance: number;
    claimedThisMonth: number;
    utilization: number;
    closingBalance: number;
}

export const getGSTOrders = async (month?: string) => {
    let query = supabase
        .from('orders')
        .select('*')
        .eq('gst_enabled', true)
        .order('order_date', { ascending: false })

    if (month) {
        const startDate = `${month}-01`
        const [year, m] = month.split('-').map(Number)
        const nextMonth = m === 12 ? 1 : m + 1
        const nextYear = m === 12 ? year + 1 : year
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
        query = query.gte('order_date', startDate).lt('order_date', endDate)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Order[]
}

export const getITCExpenses = async (month?: string) => {
    let query = supabase
        .from('expenses')
        .select('*')
        .eq('gst_enabled', true)
        .order('date', { ascending: false })

    if (month) {
        const startDate = `${month}-01`
        const [year, m] = month.split('-').map(Number)
        const nextMonth = m === 12 ? 1 : m + 1
        const nextYear = m === 12 ? year + 1 : year
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
        query = query.gte('date', startDate).lt('date', endDate)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Expense[]
}

export const calculateGSTSummary = (items: (Order | Expense)[], type: 'output' | 'input') => {
    const summary: Record<number, GSTSummaryItem> = {}

    items.forEach(item => {
        const rate = 'gst_rate' in item ? Number(item.gst_rate) : 0
        const taxable = 'subtotal' in item ? Number(item.subtotal) : ('amount' in item ? Number((item as any).amount) : 0)
        const gst = Number(item.gst_amount || 0)
        const total = 'total_amount' in item ? Number(item.total_amount) : (taxable + gst)

        if (!summary[rate]) {
            summary[rate] = { rate, taxableValue: 0, gstAmount: 0, totalAmount: 0, type }
        }

        summary[rate].taxableValue += taxable
        summary[rate].gstAmount += gst
        summary[rate].totalAmount += total
    })

    return Object.values(summary).sort((a, b) => a.rate - b.rate)
}
