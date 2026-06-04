-- 검색으로 확인된 실제 자동차 부품 이미지 URL
-- 브레이크 디스크 (al01Ad0f_KI = 실제 brake disc/rotor 사진)
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' WHERE sku = 'VK-BRK-002';
-- 브레이크 패드 (jgssLDQlFwo = 실제 red brake pad 사진)
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1600661653561-629509216228?w=400&q=80' WHERE sku = 'VK-BRK-001';

-- 나머지 제품들은 수정 기능으로 직접 업로드
