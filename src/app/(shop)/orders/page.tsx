'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/types'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ko-KR').format(price) + '원'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '주문 접수',
  paid: '결제 완료',
  processing: '상품 준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STEPS: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered']

function DeliveryProgress({ status }: { status: OrderStatus }) {
  if (status === 'pending' || status === 'cancelled') return null

  const currentStep = STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            i <= currentStep ? 'bg-[#1a2744] text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {i < currentStep ? '✓' : i + 1}
          </div>
          <div className={`text-xs mt-0 ml-1 mr-2 whitespace-nowrap ${i <= currentStep ? 'text-[#1a2744] font-medium' : 'text-gray-400'}`}>
            {STATUS_LABELS[step]}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mr-2 ${i < currentStep ? 'bg-[#1a2744]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setOrders(data as Order[])
      setLoading(false)
    }
    fetchOrders()
  }, [supabase])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-500">로딩 중...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">주문 / 배송 내역</h1>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
          <p className="text-gray-500 text-sm mb-4">주문 내역이 없습니다.</p>
          <Link href="/products" className="bg-[#1a2744] text-white text-sm font-semibold px-6 py-2.5 rounded inline-block">
            제품 보러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* 주문 헤더 */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#1a2744]">{order.order_number}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#c41230]">{formatPrice(order.total_amount)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{order.order_items?.length || 0}개 상품</div>
                  </div>
                </div>

                {/* 배송 진행 바 */}
                <DeliveryProgress status={order.status} />

                {/* 운송장 번호 */}
                {order.tracking_number && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-gray-600">{order.carrier}</span>
                    <span className="font-mono font-semibold text-[#1a2744]">{order.tracking_number}</span>
                  </div>
                )}
              </div>

              {/* 배송지 + 상품 상세 토글 */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="w-full px-5 py-3 text-left text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <span>상세 내역 {expandedId === order.id ? '닫기' : '보기'}</span>
                  <svg className={`w-4 h-4 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedId === order.id && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* 배송지 */}
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <div className="font-semibold text-gray-700 mb-1">배송지</div>
                      <div className="text-gray-600">
                        {order.shipping_name} · {order.shipping_phone}<br />
                        {order.shipping_zipcode && `(${order.shipping_zipcode}) `}{order.shipping_address} {order.shipping_detail}
                      </div>
                    </div>

                    {/* 주문 상품 */}
                    <div>
                      <div className="font-semibold text-gray-700 text-sm mb-2">주문 상품</div>
                      <div className="space-y-2">
                        {order.order_items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div>
                              <span className="text-gray-800 font-medium">{item.product_name}</span>
                              <span className="text-gray-400 text-xs ml-2">({item.product_sku})</span>
                            </div>
                            <div className="text-gray-700">
                              {formatPrice(item.unit_price)} × {item.quantity}
                              <span className="font-semibold ml-2">{formatPrice(item.unit_price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
