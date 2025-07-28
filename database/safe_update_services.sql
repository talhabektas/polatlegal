-- Güvenli şekilde services tablosunu güncelle

-- Önce mevcut yapıyı kontrol et
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'polats' 
AND TABLE_NAME = 'services'
ORDER BY ORDINAL_POSITION;

-- Her kolonu ayrı ayrı ekle (hata alırsa devam et)
-- service_areas kolonu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'polats' 
     AND TABLE_NAME = 'services' 
     AND COLUMN_NAME = 'service_areas') = 0,
    'ALTER TABLE services ADD COLUMN service_areas JSON AFTER hero_description',
    'SELECT "service_areas already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- second_section_title kolonu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'polats' 
     AND TABLE_NAME = 'services' 
     AND COLUMN_NAME = 'second_section_title') = 0,
    'ALTER TABLE services ADD COLUMN second_section_title VARCHAR(255) AFTER service_areas',
    'SELECT "second_section_title already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- second_section_description kolonu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'polats' 
     AND TABLE_NAME = 'services' 
     AND COLUMN_NAME = 'second_section_description') = 0,
    'ALTER TABLE services ADD COLUMN second_section_description TEXT AFTER second_section_title',
    'SELECT "second_section_description already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- second_section_items kolonu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'polats' 
     AND TABLE_NAME = 'services' 
     AND COLUMN_NAME = 'second_section_items') = 0,
    'ALTER TABLE services ADD COLUMN second_section_items JSON AFTER second_section_description',
    'SELECT "second_section_items already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Son kontrolü yap
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'polats' 
AND TABLE_NAME = 'services'
ORDER BY ORDINAL_POSITION; 