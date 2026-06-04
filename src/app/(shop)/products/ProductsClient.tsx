'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cartStore'
import { Product, CartItem } from '@/types'

const CATEGORIES = ['전체', '엔진', '서스펜션', '제동', '배기', '인테리어', '라이팅']
const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const { items, setItems } = useCartStore()

  const [products] = useState<Product[]>(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [addedId, setAddedId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.ok) setItems(await res.json() as CartItem[])
  }, [setItems])

  useEffect(() => { loadCart() }, [loadCart])

  useEffect(() => {
    let result = products
    if (selectedCategory !== '전체') result = result.filter(p => p.category === selectedCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    }
    setFilteredProducts(result)
  }, [selectedCategory, searchQuery, products])

  const removeFromCart = (productId: string, itemId: string, currentQty: number) => {
    if (currentQty <= 1) {
      // 수량 0 → 장바구니에서 제거
      setItems(items.filter(i => i.product_id !== productId))
      fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      })
    } else {
      setItems(items.map(i => i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i))
      fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity: currentQty - 1 }),
      })
    }
  }

  const addToCart = async (product: Product) => {
    // 즉시 UI 반영 (optimistic)
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      const tempItem: CartItem = {
        id: 'temp-' + product.id,
        user_id: '',
        product_id: product.id,
        quantity: 1,
        product,
      }
      setItems([...items, tempItem])
    }
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1200)

    // 백그라운드 동기화
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id }),
    }).then(res => res.ok && res.json()).then(data => { if (data) setItems(data) })
  }

  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-gray-200/80 pt-5 flex-col">
        <div className="px-5 pb-3">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">카테고리</h2>
        </div>
        <nav className="flex-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-5 py-2.5 text-sm flex items-center justify-between transition-all ${
                selectedCategory === cat ? 'bg-[#1a2744] text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {cat === '전체' ? products.length : (categoryCounts[cat] || 0)}
              </span>
            </button>
          ))}
        </nav>
        <div className="mx-4 my-4 p-4 bg-gradient-to-br from-[#1a2744] to-[#243560] rounded-xl text-white">
          <div className="text-xs font-bold tracking-wider mb-1 text-yellow-400">vollkommen</div>
          <div className="text-xs text-white/70 leading-relaxed">독일 프리미엄 자동차 부품<br />공식 거래처 전용 포털</div>
        </div>
      </aside>

      {/* 모바일 카테고리 드로어 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-xl pt-5" onClick={e => e.stopPropagation()}>
            <div className="px-5 pb-3 flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">카테고리</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { setSelectedCategory(cat); setSidebarOpen(false) }}
                className={`w-full text-left px-5 py-3 text-sm flex items-center justify-between ${
                  selectedCategory === cat ? 'bg-[#1a2744] text-white font-semibold' : 'text-gray-600'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                  selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {cat === '전체' ? products.length : (categoryCounts[cat] || 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 */}
      <div className="flex-1 p-4 md:p-6 min-w-0">
        {/* 검색 + 필터 바 */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl shadow-sm flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            {selectedCategory}
          </button>
          <div className="relative flex-1">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="제품명, SKU 검색..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 shadow-sm"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="hidden md:block text-sm text-gray-500 flex-shrink-0">{filteredProducts.length}개</span>
        </div>

        {/* 제품 리스트 */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400 shadow-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <div key={product.id}
                className="bg-transparent hover:bg-white/60 border border-gray-200/60 rounded-2xl hover:shadow-md transition-all duration-150 p-4"
              >
                {/* 상단: 이미지 + 기본 정보 */}
                <div className="flex gap-4">
                  {/* 이미지 */}
                  <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100 relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-contain p-1.5" />
                    ) : (
                      <svg className="w-9 h-9 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">품절</span>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] bg-[#1a2744]/8 text-[#1a2744] font-semibold px-2 py-0.5 rounded-full">{product.category}</span>
                      <span className="text-[10px] font-mono text-gray-400">{product.sku}</span>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">잔여 {product.stock}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#c41230] font-semibold mb-0.5">{product.brand}</p>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
                    )}
                  </div>
                </div>

                {/* 하단: 버튼 + 가격 */}
                <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100/80">
                  <div className="text-base md:text-lg font-black text-gray-900">{formatPrice(product.price)}</div>
                  {(() => {
                    const cartItem = items.find(i => i.product_id === product.id)
                    if (cartItem) {
                      return (
                        <div className="flex items-center gap-1 bg-gray-900 rounded-full px-1 py-1 shadow-md">
                          <button
                            onClick={() => removeFromCart(product.id, cartItem.id, cartItem.quantity)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors text-base font-bold"
                          >−</button>
                          <span className="w-6 text-center text-xs font-black text-white">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={cartItem.quantity >= product.stock}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors text-base font-bold disabled:opacity-30"
                          >+</button>
                        </div>
                      )
                    }
                    return (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`whitespace-nowrap text-xs font-bold px-5 py-2 rounded-full transition-all ${
                          product.stock === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 hover:bg-gray-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        {product.stock === 0 ? '품절' : '담기'}
                      </button>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
