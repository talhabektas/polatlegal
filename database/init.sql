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
    hero_description TEXT,
    icon_class VARCHAR(100),
    service_areas TEXT,
    second_section_title VARCHAR(255),
    second_section_description TEXT,
    second_section_items TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ekip Üyeleri Tablosu
CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL, -- "Kurucu Avukat", "Avukat" etc.
    bio TEXT,
    image_url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Kullanıcıları Tablosu
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek Veri Ekleme (Başlangıç için)

-- Çalışma Alanları
INSERT INTO services (title, description, hero_description, icon_class, service_areas, second_section_title, second_section_description, second_section_items) VALUES
('Ceza Hukuku', 'Ceza davalarında soruşturma ve kovuşturma aşamalarında hukuki destek sağlıyoruz.', 'Deneyimli ceza hukuku ekibimizle yanınızdayız.', 'fas fa-gavel', '["Cinayet Davaları", "Hırsızlık", "Dolandırıcılık", "Uyuşturucu Suçları"]', 'Ceza Hukuku Uzmanlarımız', 'Ceza hukuku alanında yılların deneyimi', '["15+ yıl deneyim", "100+ başarılı dava", "24/7 destek"]'),
('Aile Hukuku', 'Anlaşmalı ve çekişmeli boşanma, velayet, nafaka ve mal paylaşımı davalarına bakıyoruz.', 'Aile içi anlaşmazlıklarınızda yanınızdayız.', 'fas fa-users', '["Boşanma Davaları", "Velayet", "Nafaka", "Mal Paylaşımı"]', 'Aile Hukuku Hizmetlerimiz', 'Hassas süreçlerde güvenilir rehberlik', '["Anlaşmalı boşanma", "Çekişmeli davalar", "Arabuluculuk"]'),
('Bilişim Hukuku', 'Siber zorbalık, e-ticaret anlaşmazlıkları ve kişisel verilerin korunması konularında hizmet veriyoruz.', 'Dijital çağın hukuki ihtiyaçlarınız için buradayız.', 'fas fa-laptop-code', '["KVKK Danışmanlığı", "E-ticaret", "Siber Suçlar", "Telif Hakları"]', 'Bilişim Hukuku Uzmanlığımız', 'Teknoloji ve hukuk alanında öncü yaklaşım', '["KVKK uyumluluk", "Dijital sözleşmeler", "Veri güvenliği"]'),
('Ticaret Hukuku', 'Şirket kuruluşu, sözleşmeler ve ticari anlaşmazlıklar konularında danışmanlık hizmeti sunuyoruz.', 'İş dünyasının hukuki çözüm ortağı.', 'fas fa-handshake', '["Şirket Kuruluşu", "Ticari Sözleşmeler", "Ticari Davalar", "Şirket Birleşmeleri"]', 'Ticari Hukuk Danışmanlığımız', 'İş dünyasında güvenilir hukuki destek', '["Kurumsal danışmanlık", "Sözleşme yönetimi", "Uyuşmazlık çözümü"]'),
('Gayrimenkul Hukuku', 'Tapu işlemleri, kira sözleşmeleri ve gayrimenkul alım-satım davalarıyla ilgileniyoruz.', 'Gayrimenkul yatırımlarınızın güvencesi.', 'fas fa-building', '["Tapu İşlemleri", "Kira Sözleşmeleri", "Alım-Satım", "İnşaat Hukuku"]', 'Gayrimenkul Hukuku Hizmetlerimiz', 'Emlak işlemlerinde profesyonel destek', '["Due diligence", "Sözleşme hazırlama", "Dava takibi"]'),
('İcra ve İflas Hukuku', 'Alacak tahsili, haciz işlemleri ve iflas süreçlerinde müvekkillerimizin yanındayız.', 'Alacaklarınızın tahsili için etkin çözümler.', 'fas fa-file-invoice-dollar', '["Alacak Tahsili", "Haciz İşlemleri", "İflas Davaları", "İcra Takibi"]', 'İcra ve İflas Hukuku Uzmanlarımız', 'Etkili icra ve tahsilat stratejileri', '["Hızlı tahsilat", "Hukuki koruma", "Stratejik yaklaşım"]');

-- Ekip Üyeleri
INSERT INTO team_members (name, title, bio, image_url) VALUES
('Av. Salih Çağrı Polat', 'Kurucu Avukat', 'İstanbul Üniversitesi Hukuk Fakültesi mezunu olan Av. Salih Çağrı POLAT, hukuki birikimini çeşitli sivil toplum örgütlerinde aktif rol alarak, yerel basının önemli mecraları olan gazete ve haber kanallarında düzenli olarak hukuki yorumlar yaparak ve köşe yazıları kaleme alarak kamuoyuyla paylaşmaktadır. Hukukun karmaşık dilini anlaşılır bir şekilde aktarma misyonuyla hareket eden Av. Salih Çağrı POLAT, hukuki farkındalığın artırılmasına yönelik çalışmalarını sürdürmektedir.', 'assets/av-s-cagri-polat-1704710940-684_small.jpg');

-- Blog Yazıları
INSERT INTO posts (title, content, author_name, author_id, service_id) VALUES
('Boşanma Davalarında Mal Paylaşımı Nasıl Yapılır?', 'Bu yazımızda boşanma süreçlerinde mal paylaşımının hukuki çerçevesini ve sıkça sorulan soruları ele alıyoruz...', 'Av. Salih Çağrı Polat', 1, 1),
('Kişisel Verilerin Korunması Kanunu (KVKK) ve Şirketlerin Yükümlülükleri', 'KVKK kapsamında şirketlerin alması gereken önlemler ve hukuki sorumluluklar hakkında detaylı bir rehber.', 'Av. Salih Çağrı Polat', 1, 2),
('Aile Hukukunda Arabuluculuğun Önemi', 'Aile içi anlaşmazlıkların çözümünde arabuluculuk, mahkeme süreçlerine göre daha hızlı ve daha az maliyetli bir alternatif sunmaktadır. Tarafların iletişimini koruyarak ortak bir zemin bulmalarına yardımcı olur.', 'Av. Salih Çağrı Polat', 1, 1),
('Şirket Birleşme ve Devralmalarında Dikkat Edilmesi Gerekenler', 'Birleşme ve devralma süreçleri, hukuki, finansal ve operasyonel birçok detayı içerir. Doğru bir hukuki danışmanlık, sürecin pürüzsüz ilerlemesi için kritik öneme sahiptir.', 'Av. Salih Çağrı Polat', 1, 2),
('Miras Paylaşımında Sıkça Yapılan Hatalar', 'Miras hukuku, hassas ve karmaşık bir alandır. Vasiyetnamenin doğru hazırlanmaması veya saklı payların ihlal edilmesi gibi hatalar, uzun süren davalara yol açabilir.', 'Av. Salih Çağrı Polat', 1, 1);

-- Admin Kullanıcısı (Şifre: 'AdminPolat2024!Legal@Strong#Password$9876')
INSERT INTO admins (username, password_hash) VALUES
('admin', 'AdminPolat2024!Legal@Strong#Password$9876'); -- Production'da bcrypt hash kullanılacak
