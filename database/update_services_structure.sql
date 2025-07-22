-- Services tablosuna zengin içerik alanları ekleme

ALTER TABLE services 
ADD COLUMN hero_description TEXT AFTER description,
ADD COLUMN service_areas JSON AFTER hero_description,
ADD COLUMN second_section_title VARCHAR(255) AFTER service_areas,
ADD COLUMN second_section_description TEXT AFTER second_section_title,
ADD COLUMN second_section_items JSON AFTER second_section_description;

-- Mevcut description'ı hero_description'a kopyala
UPDATE services SET hero_description = description;

-- Örnek veri yapısı (isteğe bağlı, test için)
UPDATE services SET 
    service_areas = JSON_ARRAY(
        'Kasten yaralama ve müessir fiil davaları',
        'Hırsızlık, dolandırıcılık ve güveni kötüye kullanma',
        'Tehdit, şantaj ve hakaret davaları',
        'Uyuşturucu madde suçları'
    ),
    second_section_title = 'Sürecimiz',
    second_section_description = 'Ceza davalarında izlediğimiz profesyonel süreç:',
    second_section_items = JSON_ARRAY(
        'Dosya inceleme ve hukuki analiz',
        'Savunma stratejisi belirleme',
        'Soruşturma aşamasında temsil',
        'Mahkeme aşamasında savunma'
    )
WHERE id = 1; 