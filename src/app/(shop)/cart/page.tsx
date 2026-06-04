'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { CartItem } from '@/types'

const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'

export default function CartPage() {
  const router = useRouter()
  const { items, setItems, totalPrice } = useCartStore()
  // zustand에 데이터 있으면 로딩 없이 즉시 표시
  const [loading, setLoading] = useState(items.length === 0)

  useEffect(() => {
    // 백그라운드에서 최신 데이터 동기화
    fetch('/api/cart')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setItems(data as CartItem[]) })
      .finally(() => setLoading(false))
  }, [setItems])

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) return
    // 즉시 UI 반영
    setItems(items.map(i => i.id === itemId ? { ...i, quantity: newQty } : i))
    // 백그라운드 동기화
    fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, quantity: newQty }),
    })
  }

  const removeItem = (itemId: string) => {
    // 즉시 UI 반영
    setItems(items.filter(i => i.id !== itemId))
    // 백그라운드 동기화
    fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId }),
    })
  }

  const clearCart = () => {
    setItems([])
    fetch('/api/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500 text-sm">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-[#1a2744] rounded-full animate-spin" />
          로딩 중...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">장바구니</h1>
          {items.length > 0 && <p className="text-sm text-gray-500 mt-0.5">{items.length}개 제품</p>}
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            전체 삭제
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-5">장바구니가 비어 있습니다.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#1a2744] hover:bg-[#243560] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            제품 보러 가기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 장바구니 항목 */}
          <div className="flex-1 space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-4 flex gap-4 shadow-sm"
              >
                {/* 이미지 */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex-shrink-0 border border-gray-100 relative overflow-hidden flex items-center justify-center">
                  {item.product.image_url ? (
                    <Image src={item.product.image_url} alt={item.product.name} fill className="object-contain p-1.5" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">{item.product.sku}</span>
                    <span className="text-xs font-semibold text-[#c41230]">{item.product.brand}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 leading-snug">{item.product.name}</div>
                  {item.product.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1 hidden sm:block">{item.product.description}</div>
                  )}
                  <div className="mt-1.5 text-sm font-black text-gray-900">
                    {formatPrice(item.product.price * item.quantity)}
                    <span className="text-xs font-normal text-gray-400 ml-1.5">{formatPrice(item.product.price)} × {item.quantity}</span>
                  </div>
                </div>

                {/* 수량 + 삭제 */}
                <div className="flex flex-col items-end justify-between gap-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg leading-none"
                    >−</button>
                    <span className="w-9 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg leading-none"
                    >+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 주문 요약 */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sticky top-24 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">주문 요약</h2>

              <div className="space-y-2 text-sm mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="truncate mr-2 max-w-[140px] text-xs">{item.product.name}</span>
                    <span className="flex-shrink-0 text-xs font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 mb-5">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>합계</span>
                  <span className="text-[#c41230] text-lg">{formatPrice(totalPrice())}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">VAT 포함</div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="btn-danger w-full"
              >
                결제하기 →
              </button>
              <Link href="/products" className="btn-outline w-full mt-3 justify-center">
                ← 쇼핑 계속하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
