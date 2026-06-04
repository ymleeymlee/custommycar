'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { Order } from '@/types'

const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setItems } = useCartStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const dbOrderId = searchParams.get('dbOrderId')
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')   // 토스가 붙여주는 order_number
    const amount = searchParams.get('amount')

    if (!dbOrderId || !paymentKey || !orderId || !amount) {
      router.push('/products')
      return
    }

    fetch('/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), dbOrderId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setOrder(data.order)
        setItems([])  // zustand 장바구니 초기화
      })
      .catch(() => setError('결제 확인 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [])  // eslint-disable-line

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#1a2744] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">결제 확인 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">결제 확인 실패</h1>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <Link href="/cart" className="bg-[#1a2744] text-white text-sm font-semibold px-6 py-2.5 rounded-xl">
          장바구니로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">결제 완료</h1>
        <p className="text-sm text-gray-500 mb-6">주문이 접수되었습니다. 빠르게 준비하겠습니다.</p>

        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 text-sm space-y-2.5">
            <div className="flex justify-between">
              <span className="text-gray-500">주문번호</span>
              <span className="font-mono font-bold text-[#1a2744]">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 금액</span>
              <span className="font-bold text-[#c41230]">{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송지</span>
              <span className="text-right max-w-[220px] text-gray-700">
                {order.shipping_address} {order.shipping_detail}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span className="text-gray-500">주문 상태</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">결제 완료</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/orders"
            className="flex-1 bg-[#1a2744] hover:bg-[#243560] text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            배송 현황 보기
          </Link>
          <Link
            href="/products"
            className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1a2744] rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
