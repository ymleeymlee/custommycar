'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const CATEGORIES = ['엔진', '서스펜션', '제동', '배기', '인테리어', '라이팅', '기타']

export default function NewProductPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [form, setForm] = useState({
    sku: '', name: '', category: '', subcategory: '',
    brand: 'vollkommen', price: '', stock: '', description: '',
  })
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 미리보기
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (data.url) {
      setImageUrl(data.url)
    } else {
      setError('이미지 업로드 실패: ' + (data.error || ''))
      setImagePreview('')
    }
    setUploading(false)
  }

  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }])
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i))
  const updateSpec = (i: number, field: 'key' | 'value', value: string) => {
    setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.sku || !form.name || !form.category || !form.price || !form.stock) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }

    setLoading(true)
    const specsObj = specs.filter(s => s.key && s.value).reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: form.sku, name: form.name, category: form.category,
        subcategory: form.subcategory || null, brand: form.brand,
        price: parseInt(form.price), stock: parseInt(form.stock),
        description: form.description || null,
        image_url: imageUrl || null,
        specs: specsObj,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '오류가 발생했습니다.')
      setLoading(false)
      return
    }
    router.push('/admin/products')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          제품 목록
        </Link>
        <h1 className="text-xl font-bold text-gray-900">제품 추가</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제품 이미지</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                imagePreview ? 'border-gray-200' : 'border-gray-300 hover:border-[#1a2744]'
              }`}
            >
              {imagePreview ? (
                <div className="relative h-48 rounded-xl overflow-hidden">
                  <Image src={imagePreview} alt="preview" fill className="object-contain p-2" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setImagePreview(''); setImageUrl(''); if(fileRef.current) fileRef.current.value = '' }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >×</button>
                </div>
              ) : (
                <div className="h-36 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{uploading ? '업로드 중...' : '클릭하여 이미지 업로드'}</span>
                  <span className="text-xs text-gray-300">JPG, PNG, WEBP</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
              <input name="sku" value={form.sku} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] font-mono"
                placeholder="VK-ENG-001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">브랜드</label>
              <input name="brand" value={form.brand} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                placeholder="vollkommen" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제품명 <span className="text-red-500">*</span></label>
            <input name="name" value={form.name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
              placeholder="고성능 에어 필터 (스포츠)" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 <span className="text-red-500">*</span></label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" required>
                <option value="">선택하세요</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">서브카테고리</label>
              <input name="subcategory" value={form.subcategory} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                placeholder="흡기/배기" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원) <span className="text-red-500">*</span></label>
              <input name="price" type="number" value={form.price} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                placeholder="89000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">재고 수량 <span className="text-red-500">*</span></label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                placeholder="50" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제품 설명</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] resize-none"
              placeholder="제품에 대한 상세 설명을 입력하세요." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">스펙 정보</label>
              <button type="button" onClick={addSpec} className="text-xs text-[#1a2744] hover:underline font-medium">+ 추가</button>
            </div>
            <div className="space-y-2">
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2">
                  <input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2744]"
                    placeholder="항목 (예: 재질)" />
                  <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2744]"
                    placeholder="값 (예: 알루미늄)" />
                  {specs.length > 1 && (
                    <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600 px-2 text-lg">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || uploading}
              className="flex-1 bg-[#c41230] hover:bg-[#a50e28] disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
              {loading ? '저장 중...' : '제품 추가'}
            </button>
            <Link href="/admin/products"
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors text-center">
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
