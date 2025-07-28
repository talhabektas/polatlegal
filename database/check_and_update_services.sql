-- Services tablosunun mevcut yapısını kontrol et
DESCRIBE services;

-- Sadece eksik olan kolonları ekle (eğer yoksa)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS service_areas JSON AFTER hero_description,
ADD COLUMN IF NOT EXISTS second_section_title VARCHAR(255) AFTER service_areas,
ADD COLUMN IF NOT EXISTS second_section_description TEXT AFTER second_section_title,
ADD COLUMN IF NOT EXISTS second_section_items JSON AFTER second_section_description;

-- Kontrol: Güncellenmiş tablo yapısı
DESCRIBE services;

-- Mevcut verileri kontrol et
SELECT id, title, hero_description, service_areas, second_section_title FROM services LIMIT 3; 