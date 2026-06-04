import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentKey, orderId, amount, dbOrderId } = await request.json()

  // 토스페이먼츠 결제 승인
  const encoded = Buffer.from(`${process.env.TOSS_SECRET_KEY!}:`).toString('base64')
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  const tossData = await tossRes.json()

  if (!tossRes.ok) {
    return NextResponse.json({ error: tossData.message || '결제 승인 실패' }, { status: 400 })
  }

  // 주문 상태 업데이트 + 장바구니 비우기
  const admin = createAdminClient()
  await Promise.all([
    admin.from('orders')
      .update({ status: 'paid', payment_key: paymentKey, payment_method: tossData.method || '카드' })
      .eq('id', dbOrderId)
      .eq('user_id', user.id),
    admin.from('cart_items').delete().eq('user_id', user.id),
  ])

  // 주문 정보 반환
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', dbOrderId)
    .single()

  return NextResponse.json({ ok: true, order })
}
