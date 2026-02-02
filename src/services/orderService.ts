import { supabase } from '../supabaseClient'
import { Order, OrderItem } from '../types'

export const getOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
}

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number' | 'user_id' | 'gst_enabled' | 'gst_rate' | 'gst_amount' | 'subtotal' | 'total_amount'>, items: Omit<OrderItem, 'id' | 'order_id' | 'amount'>[], gstEnabled: boolean = false) => {
    // Calling the atomic RPC function we created
    const { data, error } = await supabase.rpc('create_order_atomic', {
        p_customer_name: order.customer_name,
        p_order_date: order.order_date,
        p_material_type: order.material_type,
        p_items: items, // RHF items map perfectly to the JSONB structure
        p_gst_enabled: gstEnabled
    })

    if (error) {
        console.error('RPC Error:', error)
        throw error
    }

    return data
}
