'use client'

import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'

export default function KakaoChat() {
  const pathname = usePathname()
  const totalCount = useCartStore(s => s.totalCount())

  // 모바일 제품 페이지에서 장바구니에 담긴 게 있으면 바 위로 올림
  const isProductsMobile = pathname.startsWith('/products') && totalCount > 0

  return (
    <a
      href="http://pf.kakao.com/_xexixjTX/chat"
      onClick={e => {
        e.preventDefault()
        window.open('http://pf.kakao.com/_xexixjTX/chat', 'kakaochat', 'width=400,height=600,left=100,top=100')
      }}
      className={`fixed right-4 z-50 flex items-center gap-2 bg-[#FEE500] hover:bg-[#F5DB00] text-[#391B1B] font-bold text-sm px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0
        ${isProductsMobile ? 'bottom-20 md:bottom-6' : 'bottom-6'}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.72 2 11.25c0 2.84 1.612 5.35 4.075 6.916-.18.633-.655 2.29-.75 2.648-.117.44.16.434.338.316.138-.094 2.19-1.48 3.08-2.082.402.056.814.085 1.257.085 5.523 0 10-3.72 10-8.25S17.523 3 12 3z"/>
      </svg>
      문의
    </a>
  )
}
