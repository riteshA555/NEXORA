import { supabase } from '../supabaseClient'
import { Product, StockTransaction, StockSummary, StockItemType } from '../types'

export interface MetalInventory {
    id: string;
    name: string;
    weight_gm: number;
}

export const getStockSummary = async (currentSilverRate: number): Promise<StockSummary> => {
    const { data, error } = await supabase
        .from('stock_transactions')
        .select('*')

    if (error) throw error

    const transactions = data as StockTransaction[]

    let raw = 0
    let wastage = 0
    let fg_count = 0
    let fg_weight = 0

    transactions.forEach(t => {
        const qty = Number(t.quantity)
        const weight = Number(t.weight_gm || 0)

        // Raw Silver logic
        if (t.item_type === 'RAW_SILVER') {
            if (t.type === 'RAW_IN') raw += qty
            if (t.type === 'RAW_OUT' || t.type === 'PRODUCTION' || t.type === 'ADJUSTMENT') raw -= qty
        }

        // Wastage logic
        if (t.item_type === 'WASTAGE') {
            if (t.type === 'WASTAGE') wastage += qty
            if (t.type === 'ADJUSTMENT') wastage -= qty
        }

        // Finished Goods logic
        if (t.item_type === 'FINISHED_GOODS') {
            if (t.type === 'PRODUCTION') {
                fg_count += qty
                fg_weight += weight
            }
            if (t.type === 'ORDER_DEDUCTION' || t.type === 'ADJUSTMENT') {
                fg_count -= qty
                fg_weight -= weight
            }
        }
    })

    return {
        raw_silver: raw,
        wastage: wastage,
        finished_goods_count: fg_count,
        finished_goods_weight: fg_weight,
        total_value: (raw + wastage + fg_weight) * (currentSilverRate / 1000) // Assumes gm rate
    }
}

export const addStockTransaction = async (transaction: Omit<StockTransaction, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error } = await supabase
        .from('stock_transactions')
        .insert([transaction])
        .select()

    if (error) throw error
    return data[0]
}

export const getStockTransactions = async (itemType?: StockItemType) => {
    let query = supabase
        .from('stock_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (itemType) {
        query = query.eq('item_type', itemType)
    }

    const { data, error } = await query

    if (error) throw error
    return data as StockTransaction[]
}

export const getFinishedGoodsInventory = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) throw error
    return data as Product[]
}

// Legacy helpers kept for compatibility
export const getMetalInventory = async (): Promise<MetalInventory[]> => {
    const summary = await getStockSummary(0)
    return [
        { id: 'raw', name: 'Raw Silver', weight_gm: summary.raw_silver },
        { id: 'wastage', name: 'Wastage Silver', weight_gm: summary.wastage }
    ]
}

export const getFinishedGoodsWeight = async (): Promise<number> => {
    const summary = await getStockSummary(0)
    return summary.finished_goods_weight
}
