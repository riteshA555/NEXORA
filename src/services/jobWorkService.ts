import { supabase } from '../supabaseClient'
import { JobWorkItem } from '../types'

export const getJobWorkItems = async () => {
    const { data, error } = await supabase
        .from('job_work_items')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) throw error
    return data as JobWorkItem[]
}

export const updateJobWorkItem = async (id: string, updates: Partial<JobWorkItem>) => {
    const { error } = await supabase
        .from('job_work_items')
        .update(updates)
        .eq('id', id)
    if (error) throw error
}

export const deleteJobWorkItem = async (id: string) => {
    const { error } = await supabase
        .from('job_work_items')
        .update({ is_active: false })
        .eq('id', id)
    if (error) throw error
}

export const addJobWorkItem = async (item: Omit<JobWorkItem, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('job_work_items')
        .insert([item])
        .select()
    if (error) throw error
    return data[0] as JobWorkItem
}
