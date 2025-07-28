-- Polatlar Hukuk Bürosu Veritabanı Başlangıç Script'i

-- Önce mevcut tabloları sil (isteğe bağlı, geliştirme için yararlı)
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS services;

-- Çalışma Alanları (Hizmetler) Tablosu
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_class VARCHAR(100) -- Font Awesome gibi bir kütüphane için ikon sınıfı
);

-- Ekip Üyeleri Tablosu
CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL, -- "Kurucu Avukat", "Avukat" etc.
    bio TEXT,
    image_url VARCHAR(255)
);

-- Blog Yazıları Tablosu
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(255), -- Yazar adı (Ertuğrul Polat, Çağrı Polat)
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service_id INT,
    FOREIGN KEY (author_id) REFERENCES team_members(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- Admin Kullanıcıları Tablosu
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- Örnek Veri Ekleme (Başlangıç için)

-- Çalışma Alanları
INSERT INTO services (title, description, icon_class) VALUES
('Ceza Hukuku', 'Ceza davalarında soruşturma ve kovuşturma aşamalarında hukuki destek sağlıyoruz.', 'fas fa-gavel'),
('Aile Hukuku', 'Anlaşmalı ve çekişmeli boşanma, velayet, nafaka ve mal paylaşımı davalarına bakıyoruz.', 'fas fa-users'),
('Bilişim Hukuku', 'Siber zorbalık, e-ticaret anlaşmazlıkları ve kişisel verilerin korunması konularında hizmet veriyoruz.', 'fas fa-laptop-code'),
('Ticaret Hukuku', 'Şirket kuruluşu, sözleşmeler ve ticari anlaşmazlıklar konularında danışmanlık hizmeti sunuyoruz.', 'fas fa-handshake'),
('Gayrimenkul Hukuku', 'Tapu işlemleri, kira sözleşmeleri ve gayrimenkul alım-satım davalarıyla ilgileniyoruz.', 'fas fa-building'),
('İcra ve İflas Hukuku', 'Alacak tahsili, haciz işlemleri ve iflas süreçlerinde müvekkillerimizin yanındayız.', 'fas fa-file-invoice-dollar');

-- Ekip Üyeleri
INSERT INTO team_members (name, title, bio, image_url) VALUES
('Av. Ahmet Polat', 'Kurucu Avukat', 'İstanbul Üniversitesi Hukuk Fakültesi mezunu olan Ahmet Polat, 15 yılı aşkın süredir ceza hukuku alanında uzmanlaşmıştır.', 'assets/team1.jpg'),
('Av. Zeynep Kaya', 'Avukat', 'Marmara Üniversitesi Hukuk Fakültesi mezunu olan Zeynep Kaya, özellikle aile hukuku ve bilişim hukuku konularında deneyimlidir.', 'assets/team2.jpg');

-- Blog Yazıları
INSERT INTO posts (title, content, author_name, author_id, service_id) VALUES
('Boşanma Davalarında Mal Paylaşımı Nasıl Yapılır?', 'Bu yazımızda boşanma süreçlerinde mal paylaşımının hukuki çerçevesini ve sıkça sorulan soruları ele alıyoruz...', 'Ertuğrul Polat', 1, 1),
('Kişisel Verilerin Korunması Kanunu (KVKK) ve Şirketlerin Yükümlülükleri', 'KVKK kapsamında şirketlerin alması gereken önlemler ve hukuki sorumluluklar hakkında detaylı bir rehber.', 'Çağrı Polat', 2, 2),
('Aile Hukukunda Arabuluculuğun Önemi', 'Aile içi anlaşmazlıkların çözümünde arabuluculuk, mahkeme süreçlerine göre daha hızlı ve daha az maliyetli bir alternatif sunmaktadır. Tarafların iletişimini koruyarak ortak bir zemin bulmalarına yardımcı olur.', 'Ertuğrul Polat', 1, 1),
('Şirket Birleşme ve Devralmalarında Dikkat Edilmesi Gerekenler', 'Birleşme ve devralma süreçleri, hukuki, finansal ve operasyonel birçok detayı içerir. Doğru bir hukuki danışmanlık, sürecin pürüzsüz ilerlemesi için kritik öneme sahiptir.', 'Çağrı Polat', 2, 2),
('Miras Paylaşımında Sıkça Yapılan Hatalar', 'Miras hukuku, hassas ve karmaşık bir alandır. Vasiyetnamenin doğru hazırlanmaması veya saklı payların ihlal edilmesi gibi hatalar, uzun süren davalara yol açabilir.', 'Ertuğrul Polat', 1, 1);

-- Admin Kullanıcısı (Şifre: 'AdminPolat2024!Legal@Strong#Password$9876')
INSERT INTO admins (username, password_hash) VALUES
('admin', 'AdminPolat2024!Legal@Strong#Password$9876'); -- Production'da bcrypt hash kullanılacak
