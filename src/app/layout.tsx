import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CustomMyCar — vollkommen 공식 거래처 포털',
  description: 'vollkommen 자동차 부품 거래처 전용 구매 포털',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
