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
  const [modalProduct, setModalProduct] = useState<Product | null>(null)

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

  // 모달 열릴 때 스크롤 잠금
  useEffect(() => {
    if (modalProduct) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalProduct])

  const removeFromCart = (productId: string, itemId: string, currentQty: number) => {
    if (currentQty <= 1) {
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
      <aside className="hidden md:flex w-48 flex-shrink-0 bg-white border-r border-gray-200/80 pt-5 flex-col">
        <div className="px-4 pb-3">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">카테고리</h2>
        </div>
        <nav className="flex-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-all ${
                selectedCategory === cat ? 'bg-[#1a2744] text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${
                selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {cat === '전체' ? products.length : (categoryCounts[cat] || 0)}
              </span>
            </button>
          ))}
        </nav>
        <div className="mx-3 my-4 p-3 bg-gradient-to-br from-[#1a2744] to-[#243560] rounded-xl text-white">
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
      <div className="flex-1 p-3 md:p-4 min-w-0 overflow-hidden">
        {/* 검색 + 필터 바 */}
        <div className="flex items-center gap-2 mb-3">
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
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 shadow-sm"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="hidden md:block text-xs text-gray-500 flex-shrink-0">{filteredProducts.length}개</span>
        </div>

        {/* 제품 그리드 */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400 shadow-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
            {filteredProducts.map(product => {
              const cartItem = items.find(i => i.product_id === product.id)
              return (
                <div
                  key={product.id}
                  onClick={() => setModalProduct(product)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-150 cursor-pointer flex gap-2.5 p-2.5 select-none"
                >
                  {/* 이미지 */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-100 relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />
                    ) : (
                      <svg className="w-7 h-7 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center rounded-lg">
                        <span className="text-white text-[9px] font-bold">품절</span>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* 상단: SKU/브랜드/제품명 */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-mono text-gray-400 truncate">{product.sku}</span>
                        {product.stock > 0 && product.stock < 10 && (
                          <span className="text-[9px] bg-orange-100 text-orange-600 font-semibold px-1 py-0 rounded-full flex-shrink-0">잔여{product.stock}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#c41230] font-semibold leading-tight truncate">{product.brand}</p>
                      <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 mt-0.5">{product.name}</h3>
                    </div>

                    {/* 하단: 가격 + 담기 */}
                    <div className="flex items-center justify-between mt-1.5" onClick={e => e.stopPropagation()}>
                      <span className="text-sm font-black text-gray-900">{formatPrice(product.price)}</span>
                      {cartItem ? (
                        <div className="flex items-center gap-0.5 bg-gray-900 rounded-full px-0.5 py-0.5">
                          <button
                            onClick={() => removeFromCart(product.id, cartItem.id, cartItem.quantity)}
                            className="w-5 h-5 flex items-center justify-center text-white hover:bg-white/20 rounded-full text-sm font-bold"
                          >−</button>
                          <span className="w-5 text-center text-[10px] font-black text-white">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={cartItem.quantity >= product.stock}
                            className="w-5 h-5 flex items-center justify-center text-white hover:bg-white/20 rounded-full text-sm font-bold disabled:opacity-30"
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                            addedId === product.id
                              ? 'bg-green-500 text-white'
                              : product.stock === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 hover:bg-gray-700 text-white shadow-sm'
                          }`}
                        >
                          {addedId === product.id ? '✓' : product.stock === 0 ? '품절' : '담기'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {modalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModalProduct(null)}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

          {/* 모달 박스 */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setModalProduct(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors shadow-sm"
              aria-label="닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 모달 내용 */}
            <div className="p-6">
              <div className="flex gap-5">
                {/* 큰 이미지 */}
                <div className="w-40 h-40 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100 relative overflow-hidden flex items-center justify-center">
                  {modalProduct.image_url ? (
                    <Image src={modalProduct.image_url} alt={modalProduct.name} fill className="object-contain p-3" />
                  ) : (
                    <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {modalProduct.stock === 0 && (
                    <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center rounded-xl">
                      <span className="text-white text-xs font-bold">품절</span>
                    </div>
                  )}
                </div>

                {/* 제품 정보 */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] bg-[#1a2744]/10 text-[#1a2744] font-semibold px-2 py-0.5 rounded-full">{modalProduct.category}</span>
                    {modalProduct.stock > 0 && modalProduct.stock < 10 && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">잔여 {modalProduct.stock}개</span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-gray-400 mb-1">{modalProduct.sku}</p>
                  <p className="text-sm text-[#c41230] font-bold mb-1">{modalProduct.brand}</p>
                  <h2 className="text-base font-bold text-gray-900 leading-snug">{modalProduct.name}</h2>
                </div>
              </div>

              {/* 설명 */}
              {modalProduct.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">제품 설명</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{modalProduct.description}</p>
                </div>
              )}

              {/* 가격 + 버튼 */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">공급가</p>
                  <p className="text-2xl font-black text-gray-900">{formatPrice(modalProduct.price)}</p>
                </div>
                {(() => {
                  const cartItem = items.find(i => i.product_id === modalProduct.id)
                  if (cartItem) {
                    return (
                      <div className="flex items-center gap-2 bg-gray-900 rounded-full px-2 py-2 shadow-md">
                        <button
                          onClick={() => removeFromCart(modalProduct.id, cartItem.id, cartItem.quantity)}
                          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full text-lg font-bold"
                        >−</button>
                        <span className="w-8 text-center text-sm font-black text-white">{cartItem.quantity}</span>
                        <button
                          onClick={() => addToCart(modalProduct)}
                          disabled={cartItem.quantity >= modalProduct.stock}
                          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full text-lg font-bold disabled:opacity-30"
                        >+</button>
                      </div>
                    )
                  }
                  return (
                    <button
                      onClick={() => addToCart(modalProduct)}
                      disabled={modalProduct.stock === 0}
                      className={`text-sm font-bold px-8 py-3 rounded-full transition-all shadow-md ${
                        modalProduct.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-900 hover:bg-gray-700 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                    >
                      {modalProduct.stock === 0 ? '품절' : '장바구니 담기'}
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
