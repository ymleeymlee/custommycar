'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Profile, Order } from '@/types'

export default function AdminPage() {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
  const [recentOrders, setRecentOrders] = useState<(Order & { profile?: Profile })[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        setPendingUsers(data.pending || [])
        setRecentOrders(data.orders || [])
        setStats({
          totalUsers: data.totalUsers,
          totalOrders: data.orders?.length || 0,
          totalRevenue: data.totalRevenue,
        })
        setLoading(false)
      })
  }, [])

  const approveUser = async (userId: string) => {
    setApprovingId(userId)
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'approve' }),
    })
    setPendingUsers(prev => prev.filter(u => u.id !== userId))
    setApprovingId(null)
  }

  const rejectUser = async (userId: string) => {
    if (!confirm('이 신청을 거절하고 계정을 삭제하시겠습니까?')) return
    setApprovingId(userId)
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'reject' }),
    })
    setPendingUsers(prev => prev.filter(u => u.id !== userId))
    setApprovingId(null)
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price) + '원'

  const STATUS_LABELS: Record<string, string> = {
    pending: '주문 접수', paid: '결제 완료', processing: '준비 중',
    shipped: '배송 중', delivered: '배송 완료', cancelled: '취소됨',
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-500">로딩 중...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">관리자 대시보드</h1>
        <Link href="/admin/products" className="bg-[#1a2744] hover:bg-[#243560] text-white text-sm font-semibold px-4 py-2 rounded transition-colors">
          + 제품 관리
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '가입 거래처', value: `${stats.totalUsers}개`, icon: '🏢' },
          { label: '총 주문', value: `${stats.totalOrders}건`, icon: '📦' },
          { label: '총 매출', value: formatPrice(stats.totalRevenue), icon: '💰' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-[#1a2744]">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 승인 대기 거래처 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">승인 대기 거래처</h2>
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">대기 중인 신청이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingUsers.map(user => (
                <div key={user.id} className={`p-4 ${approvingId === user.id ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{user.company_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                      {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                      <div className="text-xs text-gray-300 mt-1">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')} 신청
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveUser(user.id)}
                        disabled={approvingId === user.id}
                        className="bg-[#1a2744] hover:bg-[#243560] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => rejectUser(user.id)}
                        disabled={approvingId === user.id}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded border border-red-200 transition-colors disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 주문 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">최근 주문</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">주문이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-semibold text-[#1a2744]">{order.order_number}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {(order as {profiles?: {company_name: string}}).profiles?.company_name || '—'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">{formatPrice(order.total_amount)}</div>
                    <OrderStatusBadge status={order.status} label={STATUS_LABELS[order.status]} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}
