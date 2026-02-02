import { supabase } from '../supabaseClient'

export interface Karigar {
    id: string;
    name: string;
    work_type: 'Cutting' | 'Choti' | 'Half Belt' | 'General';
    rate_type: 'Per KG' | 'Per Piece' | 'Fixed';
    default_rate: number;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface KarigarWorkRecord {
    id: string;
    karigar_id: string;
    order_id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    payment_status: 'PENDING' | 'PAID';
    payment_date?: string;
    payment_mode?: string;
    work_date: string;
    karigars?: { name: string };
}

export const getKarigars = async () => {
    const { data, error } = await supabase
        .from('karigars')
        .select('*')
        .order('name')
    if (error) throw error
    return data as Karigar[]
}

export const createKarigar = async (karigar: Omit<Karigar, 'id'>) => {
    const { data, error } = await supabase
        .from('karigars')
        .insert(karigar)
        .select()
        .single()
    if (error) throw error
    return data as Karigar
}

export const getKarigarWorkHistory = async (karigarId?: string, month?: string) => {
    let query = supabase
        .from('karigar_work_records')
        .select('*, karigars(name)')
        .order('work_date', { ascending: false })

    if (karigarId) query = query.eq('karigar_id', karigarId)
    if (month) {
        // Simple month filter for YYYY-MM
        query = query.gte('work_date', `${month}-01`).lte('work_date', `${month}-31`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as KarigarWorkRecord[]
}

export const settleKarigarPayments = async (ids: string[], paymentDate: string, paymentMode: string) => {
    const { error } = await supabase
        .from('karigar_work_records')
        .update({
            payment_status: 'PAID',
            payment_date: paymentDate,
            payment_mode: paymentMode
        })
        .in('id', ids)

    if (error) throw error
}
