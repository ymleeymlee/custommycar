'use client'

import { useEffect, useState, useCallback } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { Product, CartItem } from '@/types'

const CATEGORIES = ['전체', '엔진', '서스펜션', '제동', '배기', '인테리어', '라이팅']
const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const { setItems } = useCartStore()

  const [products] = useState<Product[]>(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.ok) {
      const data = await res.json()
      setItems(data as CartItem[])
    }
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

  const addToCart = async (product: Product) => {
    setAddingId(product.id)
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems(data as CartItem[])
    }
    setAddingId(null)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      {/* 사이드바 — 데스크탑 */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-gray-200/80 pt-5 flex-col">
        <div className="px-5 pb-3">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">카테고리</h2>
        </div>
        <nav className="flex-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-5 py-2.5 text-sm flex items-center justify-between transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1a2744] text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl pt-5" onClick={e => e.stopPropagation()}>
            <div className="px-5 pb-3 flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">카테고리</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSidebarOpen(false) }}
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
        {/* 검색 + 헤더 */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 모바일 카테고리 버튼 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              {selectedCategory}
            </button>
            <span className="hidden md:flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{selectedCategory}</h2>
              <span className="text-sm text-gray-400">— {filteredProducts.length}개 제품</span>
            </span>
            <span className="md:hidden text-xs text-gray-400">{filteredProducts.length}개</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제품명, SKU 검색..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744] shadow-sm transition-all"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400 shadow-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white border border-gray-200/80 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* 이미지 영역 */}
                <div className="h-32 md:h-44 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                    </svg>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#1a2744] text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                      {product.category}
                    </span>
                  </div>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                      <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow">품절</span>
                    </div>
                  )}
                  {product.stock > 0 && product.stock < 10 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                        잔여 {product.stock}
                      </span>
                    </div>
                  )}
                </div>

                {/* 내용 */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-400 font-mono">{product.sku}</span>
                    <span className="text-xs font-semibold text-[#c41230]">{product.brand}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  {product.specs && Object.keys(product.specs).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(product.specs).slice(0, 2).map(([, v]) => (
                        <span key={String(v)} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{v as string}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-black text-gray-900">{formatPrice(product.price)}</div>
                      <div className="text-xs text-gray-400">재고 {product.stock}개</div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0 || addingId === product.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                        addedId === product.id
                          ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-md'
                          : product.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#c41230] hover:bg-[#a50e28] text-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      {addedId === product.id ? '✓ 담겼습니다'
                        : addingId === product.id ? '담는 중...'
                        : product.stock === 0 ? '품절' : '장바구니 담기'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
