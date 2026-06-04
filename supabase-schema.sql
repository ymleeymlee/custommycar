-- =============================================
-- CustomMyCar - Supabase Schema
-- =============================================

-- 프로필 (auth.users 확장)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제품
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT DEFAULT 'vollkommen',
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  specs JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 장바구니
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 주문
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled')),
  total_amount INTEGER NOT NULL,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_detail TEXT,
  shipping_zipcode TEXT,
  payment_key TEXT,
  payment_method TEXT,
  tracking_number TEXT,
  carrier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 주문 상품
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "본인 프로필 조회" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 프로필 수정" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "관리자 전체 프로필 조회" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "관리자 프로필 수정" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- products (승인된 유저만 조회)
CREATE POLICY "승인된 유저 제품 조회" ON products FOR SELECT USING (
  is_active = TRUE AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND approved = TRUE
  )
);
CREATE POLICY "관리자 제품 전체 관리" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- cart_items
CREATE POLICY "본인 장바구니" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- orders
CREATE POLICY "본인 주문 조회" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 주문 생성" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "관리자 주문 전체" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- order_items
CREATE POLICY "본인 주문 상품 조회" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "관리자 주문 상품 전체" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- 트리거: 회원가입 시 자동 프로필 생성
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 샘플 제품 데이터
-- =============================================

INSERT INTO products (sku, name, category, subcategory, price, stock, description, specs) VALUES
('VK-ENG-001', '고성능 에어 필터 (스포츠)', '엔진', '흡기/배기', 89000, 50, '고유량 코튼 게즈 필터. 일반 필터 대비 흡기량 30% 향상. K&N 호환 규격.', '{"size": "280x180mm", "material": "코튼 게즈", "service_life": "50,000km", "compatibility": "국산 2.0L 이상"}'),
('VK-ENG-002', '스포츠 오일 필터', '엔진', '오일', 35000, 120, '고압 실링으로 오일 누유 방지. 내부 우회 밸브 장착. 일반 오일 필터 대비 여과 효율 40% 향상.', '{"thread": "M20x1.5", "height": "95mm", "bypass_valve": "1.0 bar"}'),
('VK-ENG-003', '이그니션 코일 세트 (4개)', '엔진', '점화', 240000, 30, '독일 생산 고출력 이그니션 코일. 점화 에너지 150mJ. OEM 대비 20% 향상 출력.', '{"output": "150mJ", "voltage": "12V", "quantity": "4pcs", "compatibility": "현대/기아 1.6T, 2.0T"}'),
('VK-SUS-001', '단조 스트럿 바 (프론트)', '서스펜션', '보강재', 185000, 20, '알루미늄 6061-T6 단조. 차체 비틀림 강성 35% 향상. CNC 정밀 가공.', '{"material": "알루미늄 6061-T6", "weight": "680g", "finish": "아노다이징"}'),
('VK-SUS-002', '쇼크업소버 세트 (4개)', '서스펜션', '쇼크/스프링', 680000, 15, '가스 충전식 투웨이 조정 댐퍼. 리바운드/압축 각 32단 조정. 서킷 및 스트리트 겸용.', '{"type": "가스 충전식", "adjustment": "32단", "quantity": "4pcs"}'),
('VK-BRK-001', '스포츠 브레이크 패드 세트 (프론트)', '제동', '패드', 95000, 60, '세미-메탈릭 컴파운드. 초기 제동력 강화. 페이드 방지 홈 가공. WVA 규격 적합.', '{"compound": "세미-메탈릭", "thickness": "15mm", "temperature": "0-650°C"}'),
('VK-BRK-002', '드릴드 슬롯 브레이크 디스크 (프론트 2개)', '제동', '디스크', 210000, 25, '구멍/슬롯 복합 가공. 방열성 향상. 고탄소 주철 소재. OE 규격 대비 15% 경량.', '{"diameter": "300mm", "thickness": "28mm", "material": "고탄소 주철", "quantity": "2pcs"}'),
('VK-EXH-001', '스테인레스 다운파이프 (200셀)', '배기', '촉매/다운파이프', 320000, 10, 'SUS304 스테인레스. 200셀 메탈 촉매. 배기 저항 최소화. TIG 용접 마감.', '{"material": "SUS304", "cat_cell": "200 cell", "diameter": "63mm"}'),
('VK-EXH-002', '리얼 사운드 머플러 팁 세트', '배기', '머플러', 145000, 40, '듀얼 팁 머플러. 직경 90mm. 폴리쉬드 SUS304. 보편적 차량 장착 가능.', '{"tip_diameter": "90mm", "material": "SUS304", "finish": "폴리쉬드", "quantity": "2pcs"}'),
('VK-INT-001', '알칸타라 스티어링 휠 커버', '인테리어', '스티어링', 75000, 35, '정품 알칸타라 소재. 미끄럼 방지 처리. 직경 37-38cm 범용. 빨간 스티치.', '{"material": "알칸타라", "diameter": "37-38cm", "stitch": "레드"}'),
('VK-INT-002', '카본 파이버 시프트 노브', '인테리어', '변속기', 65000, 45, '실제 카본 파이버 + 알루미늄 결합. 무게 230g. M12x1.25 범용 나사산.', '{"material": "카본파이버/알루미늄", "weight": "230g", "thread": "M12x1.25"}'),
('VK-LIG-001', 'LED 헤드라이트 킷 H7 (2개)', '라이팅', '헤드라이트', 128000, 55, 'CSP LED 칩. 10000Lm (쌍). 6500K 순백광. IP68 방수. 팬리스 설계.', '{"bulb_type": "H7", "lumens": "10000lm/pair", "color_temp": "6500K", "ip_rating": "IP68"}');
