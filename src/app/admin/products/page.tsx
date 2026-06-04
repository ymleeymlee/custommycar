'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types'

const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const toggleActive = async (product: Product) => {
    setTogglingId(product.id)
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
    })
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    setTogglingId(null)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('정말 이 제품을 삭제하시겠습니까?')) return
    await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1a2744] rounded-full animate-spin" />
          로딩 중...
        </div>
      </div>
    )
  }

  const activeCount = products.filter(p => p.is_active).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드
          </Link>
          <div className="w-px h-4 bg-gray-300" />
          <h1 className="text-xl font-bold text-gray-900">제품 관리</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{activeCount}</span> / {products.length} 판매중
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-[#c41230] hover:bg-[#a50e28] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            제품 추가
          </Link>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">SKU</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">제품명</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">카테고리</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">가격</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">재고</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">상태</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr
                key={product.id}
                className={`hover:bg-gray-50/70 transition-colors ${!product.is_active ? 'opacity-40' : ''}`}
              >
                <td className="px-5 py-3.5 font-mono text-xs text-gray-400 tracking-wider">{product.sku}</td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-gray-900">{product.name}</div>
                  <div className="text-xs text-[#c41230] mt-0.5">{product.brand}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1a2744]/8 text-[#1a2744]">
                    {product.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatPrice(product.price)}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`font-bold text-sm ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-orange-500' : 'text-gray-800'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => toggleActive(product)}
                    disabled={togglingId === product.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                      product.is_active
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {togglingId === product.id ? '...' : product.is_active ? '판매중' : '비활성'}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors font-medium"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">등록된 제품이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
