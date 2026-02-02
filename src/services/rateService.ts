import { supabase } from '../supabaseClient'

export interface SilverRate {
    id: string;
    rate_date: string;
    source: 'MCX' | 'Local Dealer';
    rate_10g: number;
    rate_1g: number;
    notes?: string;
}

export const getLatestRate = async () => {
    const { data, error } = await supabase
        .from('silver_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as SilverRate | null
}

export const getRateHistory = async (source?: string) => {
    let query = supabase
        .from('silver_rates')
        .select('*')
        .order('rate_date', { ascending: true })

    if (source) query = query.eq('source', source)

    const { data, error } = await query
    if (error) throw error
    return data as SilverRate[]
}

export const addSilverRate = async (rate: Omit<SilverRate, 'id' | 'rate_1g'>) => {
    const rate_1g = rate.rate_10g / 10
    const { data, error } = await supabase
        .from('silver_rates')
        .insert({ ...rate, rate_1g })
        .select()
        .single()
    if (error) throw error
    return data as SilverRate
}
