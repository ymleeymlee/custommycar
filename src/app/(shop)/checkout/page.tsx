'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { CartItem, Profile } from '@/types'

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>
    }
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; zonecode: string }) => void
      }) => { open: () => void }
    }
  }
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ko-KR').format(price) + '원'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, setItems, totalPrice } = useCartStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const detailRef = useRef<HTMLInputElement>(null)
  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    address: '',
    detail: '',
    zipcode: '',
  })

  const loadData = useCallback(async () => {
    const [profileRes, cartRes] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/cart'),
    ])

    if (!profileRes.ok) { router.push('/login'); return }

    const profileData: Profile = await profileRes.json()
    const cartData: CartItem[] = await cartRes.json()

    setProfile(profileData)

    // localStorage에서 저장된 주소 복원, 없으면 프로필 기본값 사용
    const savedAddress = JSON.parse(localStorage.getItem('cmc_shipping') || 'null')
    setShippingForm({
      name: profileData.company_name || '',
      phone: profileData.phone || '',
      address: savedAddress?.address || '',
      detail: savedAddress?.detail || '',
      zipcode: savedAddress?.zipcode || '',
    })

    setItems(cartData)
    setLoading(false)
  }, [router, setItems])

  const openAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setShippingForm(p => ({ ...p, address: data.roadAddress, zipcode: data.zonecode, detail: '' }))
        setTimeout(() => detailRef.current?.focus(), 100)
      },
    }).open()
  }

  useEffect(() => {
    loadData()

    const tossScript = document.createElement('script')
    tossScript.src = 'https://js.tosspayments.com/v1/payment'
    document.head.appendChild(tossScript)

    const kakaoScript = document.createElement('script')
    kakaoScript.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    document.head.appendChild(kakaoScript)

    return () => {
      document.head.removeChild(tossScript)
      if (document.head.contains(kakaoScript)) document.head.removeChild(kakaoScript)
    }
  }, [loadData])

  const generateOrderNumber = () =>
    'CMC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()

  const handlePayment = async () => {
    if (!shippingForm.name || !shippingForm.phone || !shippingForm.address) {
      alert('배송 정보를 모두 입력해주세요.')
      return
    }
    if (items.length === 0) {
      alert('장바구니가 비어 있습니다.')
      return
    }

    setProcessing(true)

    // 주소 저장
    localStorage.setItem('cmc_shipping', JSON.stringify({
      address: shippingForm.address,
      detail: shippingForm.detail,
      zipcode: shippingForm.zipcode,
    }))

    const orderNumber = generateOrderNumber()

    // 주문 생성 (결제 전)
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: orderNumber,
        total_amount: totalPrice(),
        shipping_name: shippingForm.name,
        shipping_phone: shippingForm.phone,
        shipping_address: shippingForm.address,
        shipping_detail: shippingForm.detail,
        shipping_zipcode: shippingForm.zipcode,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.product.price,
        })),
      }),
    })

    if (!orderRes.ok) {
      alert('주문 생성 중 오류가 발생했습니다.')
      setProcessing(false)
      return
    }

    const order = await orderRes.json()

    // 토스페이먼츠 결제 요청
    try {
      const tossPayments = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      await tossPayments.requestPayment('카드', {
        amount: totalPrice(),
        orderId: orderNumber,
        orderName: items.length === 1
          ? items[0].product.name
          : `${items[0].product.name} 외 ${items.length - 1}건`,
        customerName: shippingForm.name,
        successUrl: `${window.location.origin}/checkout/success?dbOrderId=${order.id}`,
        failUrl: `${window.location.origin}/checkout?error=fail`,
      })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as {code: string}).code !== 'USER_CANCEL') {
        alert('결제 중 오류가 발생했습니다.')
      }
      // 결제 취소 시 주문 삭제
      await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id }),
      })
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-500">로딩 중...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">결제</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 좌측: 배송 정보 */}
        <div className="flex-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-bold text-gray-800 mb-4">배송 정보</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">받는 분 <span className="text-red-500">*</span></label>
                  <input
                    value={shippingForm.name}
                    onChange={e => setShippingForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                    placeholder="업체명 또는 담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처 <span className="text-red-500">*</span></label>
                  <input
                    value={shippingForm.phone}
                    onChange={e => setShippingForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소 <span className="text-red-500">*</span></label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={shippingForm.zipcode}
                    readOnly
                    className="w-28 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-default"
                    placeholder="우편번호"
                  />
                  <button
                    type="button"
                    onClick={openAddressSearch}
                    className="flex items-center gap-1.5 bg-[#1a2744] hover:bg-[#243560] text-white text-sm font-semibold px-4 py-2 rounded transition-colors whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    주소 검색
                  </button>
                </div>
                <input
                  value={shippingForm.address}
                  readOnly
                  onClick={openAddressSearch}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-pointer hover:border-[#1a2744] transition-colors"
                  placeholder="주소 검색 버튼을 눌러주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 주소</label>
                <input
                  ref={detailRef}
                  value={shippingForm.detail}
                  onChange={e => setShippingForm(p => ({ ...p, detail: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                  placeholder="동/호수, 층, 사업장명 등"
                />
              </div>
            </div>
          </div>

          {/* 주문 상품 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-bold text-gray-800 mb-4">주문 상품</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{item.product.name}</div>
                    <div className="text-xs text-gray-400">{item.product.sku} × {item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측: 결제 요약 */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4">결제 금액</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>상품 금액</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>배송비</span>
                <span className="text-green-600 font-medium">무료</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mb-5">
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>합계</span>
                <span className="text-[#c41230]">{formatPrice(totalPrice())}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">VAT 포함</div>
            </div>

            {/* 결제 수단 */}
            <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <div className="font-semibold mb-1">결제 수단</div>
              <div className="flex flex-wrap gap-1">
                {['신용카드', '체크카드', '카카오페이', '네이버페이', '토스'].map(m => (
                  <span key={m} className="bg-white border border-gray-200 px-2 py-0.5 rounded">{m}</span>
                ))}
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing || items.length === 0}
              className="w-full bg-[#c41230] hover:bg-[#a50e28] disabled:bg-gray-300 text-white font-bold py-3 rounded transition-colors"
            >
              {processing ? '결제 처리 중...' : `${formatPrice(totalPrice())} 결제하기`}
            </button>

            <button
              onClick={() => router.push('/cart')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-3 py-1"
            >
              ← 장바구니로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
