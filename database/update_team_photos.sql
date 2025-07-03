-- Ekip üyelerinin fotoğraflarını güncelle

-- Önce mevcut kayıtları güncelle
UPDATE team_members SET 
    name = 'Av. Çağrı Polat',
    image_url = 'assets/cplt.jpg'
WHERE id = 1;

UPDATE team_members SET 
    name = 'Av. Ertuğrul Polat', 
    image_url = 'assets/ert.jpg'
WHERE id = 2;

-- Blog yazılarındaki yazar isimlerini de doğru şekilde güncelle
UPDATE posts SET author_name = 'Çağrı Polat' WHERE author_id = 1;
UPDATE posts SET author_name = 'Ertuğrul Polat' WHERE author_id = 2; 