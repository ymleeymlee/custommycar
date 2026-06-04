'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'
const CATEGORIES = ['엔진', '서스펜션', '제동', '배기', '인테리어', '라이팅', '기타']

type EditForm = {
  name: string
  category: string
  price: string
  stock: string
  description: string
  image_url: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', category: '', price: '', stock: '', description: '', image_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const openEdit = (product: Product) => {
    setEditProduct(product)
    setEditForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || '',
      image_url: product.image_url || '',
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setEditForm(f => ({ ...f, image_url: data.url }))
    setUploading(false)
  }

  const saveEdit = async () => {
    if (!editProduct) return
    setSaving(true)
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editProduct.id,
        name: editForm.name,
        category: editForm.category,
        price: parseInt(editForm.price),
        stock: parseInt(editForm.stock),
        description: editForm.description || null,
        image_url: editForm.image_url || null,
      }),
    })
    setProducts(prev => prev.map(p => p.id === editProduct.id ? {
      ...p,
      name: editForm.name,
      category: editForm.category,
      price: parseInt(editForm.price),
      stock: parseInt(editForm.stock),
      description: editForm.description || undefined,
      image_url: editForm.image_url || undefined,
    } : p))
    setSaving(false)
    setEditProduct(null)
  }

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
          <Link href="/admin/products/new"
            className="flex items-center gap-2 bg-[#c41230] hover:bg-[#a50e28] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
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
              <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-20">사진</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">제품명 / 설명</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">카테고리</th>
              <th className="text-right px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">가격</th>
              <th className="text-right px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">재고</th>
              <th className="text-center px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">상태</th>
              <th className="text-center px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className={`hover:bg-gray-50/70 transition-colors ${!product.is_active ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-sm">
                  <div className="font-semibold text-gray-900">{product.name}</div>
                  <div className="text-xs mt-0.5 mb-1">
                    <span className="text-[#c41230]">{product.brand}</span>
                    <span className="text-gray-300 mx-1">·</span>
                    <span className="text-gray-400 font-mono">{product.sku}</span>
                  </div>
                  {product.description && (
                    <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1a2744]/8 text-[#1a2744]">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatPrice(product.price)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold text-sm ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-orange-500' : 'text-gray-800'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(product)} disabled={togglingId === product.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                      product.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {togglingId === product.id ? '...' : product.is_active ? '판매중' : '비활성'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => openEdit(product)}
                      className="text-xs text-[#1a2744] hover:text-[#243560] font-semibold transition-colors">
                      수정
                    </button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => deleteProduct(product.id)}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors font-medium">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">등록된 제품이 없습니다.</div>
        )}
      </div>

      {/* 수정 모달 */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditProduct(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">제품 수정</h2>
              <button onClick={() => setEditProduct(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제품 이미지</label>
                <div className="flex gap-3 items-start">
                  <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {editForm.image_url ? (
                      <Image src={editForm.image_url} alt="preview" fill className="object-contain p-1" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full border border-gray-300 hover:border-[#1a2744] text-sm text-gray-600 py-2 rounded-lg transition-colors">
                      {uploading ? '업로드 중...' : '사진 업로드'}
                    </button>
                    <input
                      value={editForm.image_url}
                      onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a2744] text-gray-500"
                      placeholder="또는 이미지 URL 직접 입력"
                    />
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제품명</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">재고 수량</label>
                <input type="number" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제품 설명</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 bg-[#1a2744] hover:bg-[#243560] disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button onClick={() => setEditProduct(null)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
