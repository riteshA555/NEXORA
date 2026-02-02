import { supabase } from '../supabaseClient'
import { Product } from '../types'

export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) throw error
    return data as Product[]
}

export const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
    if (error) throw error
}

export const deleteProduct = async (id: string) => {
    const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
    if (error) throw error
}

export const addProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
    if (error) throw error
    return data[0] as Product
}
