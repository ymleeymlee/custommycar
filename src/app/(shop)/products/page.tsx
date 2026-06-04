import { createAdminClient } from '@/lib/supabase/admin'
import ProductsClient from './ProductsClient'

export default async function ProductsPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category')

  return <ProductsClient initialProducts={products || []} />
}
