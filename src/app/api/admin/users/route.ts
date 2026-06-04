import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [{ data: pending }, { data: orders }, { data: allUsers }, { data: revenueData }] = await Promise.all([
    admin.from('profiles').select('*').eq('approved', false).eq('role', 'user').order('created_at', { ascending: false }),
    admin.from('orders').select('*, profiles(company_name)').order('created_at', { ascending: false }).limit(10),
    admin.from('profiles').select('id'),
    admin.from('orders').select('total_amount').in('status', ['paid', 'processing', 'shipped', 'delivered']),
  ])

  return NextResponse.json({
    pending: pending || [],
    orders: orders || [],
    totalUsers: allUsers?.length || 0,
    totalRevenue: revenueData?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
  })
}
