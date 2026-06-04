import Header from '@/components/Header'
import KakaoChat from '@/components/KakaoChat'
import BottomCartBar from '@/components/BottomCartBar'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const admin = createAdminClient()
    const { data } = await admin.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <>
      <Header profile={profile} />
      <main className="flex-1 pb-24">{children}</main>
      <KakaoChat />
      <BottomCartBar />
    </>
  )
}
