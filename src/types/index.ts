export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  company_name: string
  phone?: string
  role: UserRole
  approved: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  subcategory?: string
  brand: string
  price: number
  stock: number
  description?: string
  image_url?: string
  specs: Record<string, string>
  is_active: boolean
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  product: Product
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  order_number: string
  status: OrderStatus
  total_amount: number
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_detail: string
  shipping_zipcode: string
  payment_key?: string
  payment_method?: string
  tracking_number?: string
  carrier?: string
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
}
