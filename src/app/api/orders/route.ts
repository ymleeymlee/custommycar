import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items, ...orderData } = await req.json()
  const admin = createAdminClient()

  const { data: order, error } = await admin
    .from('orders')
    .insert({ ...orderData, user_id: user.id, status: 'pending' })
    .select()
    .single()

  if (error || !order) return NextResponse.json({ error: error?.message }, { status: 500 })

  if (items?.length) {
    await admin.from('order_items').insert(
      items.map((item: { product_id: string; product_name: string; product_sku: string; quantity: number; unit_price: number }) => ({
        ...item,
        order_id: order.id,
      }))
    )
  }

  return NextResponse.json(order)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const admin = createAdminClient()
  await admin.from('orders').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
