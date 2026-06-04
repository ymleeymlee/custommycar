import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id } = await req.json()
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('cart_items').select('id, quantity')
    .eq('user_id', user.id).eq('product_id', product_id).single()

  if (existing) {
    await admin.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
  } else {
    await admin.from('cart_items').insert({ user_id: user.id, product_id, quantity: 1 })
  }

  const { data } = await admin
    .from('cart_items').select('*, product:products(*)')
    .eq('user_id', user.id)
  return NextResponse.json(data || [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, quantity } = await req.json()
  const admin = createAdminClient()

  if (quantity < 1) {
    await admin.from('cart_items').delete().eq('id', id).eq('user_id', user.id)
  } else {
    await admin.from('cart_items').update({ quantity }).eq('id', id).eq('user_id', user.id)
  }

  const { data } = await admin
    .from('cart_items').select('*, product:products(*)')
    .eq('user_id', user.id)
  return NextResponse.json(data || [])
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await req.json().catch(() => ({}))

  if (body.id) {
    await admin.from('cart_items').delete().eq('id', body.id).eq('user_id', user.id)
  } else {
    await admin.from('cart_items').delete().eq('user_id', user.id)
  }

  const { data } = await admin
    .from('cart_items').select('*, product:products(*)')
    .eq('user_id', user.id)
  return NextResponse.json(data || [])
}
