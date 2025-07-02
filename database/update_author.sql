-- Posts tablosuna author_name alanını ekle
ALTER TABLE posts ADD COLUMN author_name VARCHAR(255);

-- Mevcut blog yazılarına author bilgisi ekle
UPDATE posts SET author_name = 'Ertuğrul Polat' WHERE id IN (1, 3, 5);
UPDATE posts SET author_name = 'Çağrı Polat' WHERE id IN (2, 4);

-- Sonuç kontrolü
SELECT id, title, author_name, service_id FROM posts; 