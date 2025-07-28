const API_BASE_URL = 'http://localhost:8061/api';

// === TOAST NOTIFICATION SYSTEM ===
class ToastManager {
    constructor() {
        this.container = this.createContainer();
        document.body.appendChild(this.container);
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        return container;
    }

    show(title, message, type = 'info', duration = 5000) {
        const toast = this.createToast(title, message, type);
        this.container.appendChild(toast);

        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto dismiss
        setTimeout(() => this.dismiss(toast), duration);

        return toast;
    }

    createToast(title, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getIcon(type);

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Kapat">&times;</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismiss(toast);
        });

        return toast;
    }

    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle" style="color: #10b981;"></i>',
            error: '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>',
            warning: '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>',
            info: '<i class="fas fa-info-circle" style="color: #2563eb;"></i>'
        };
        return icons[type] || icons.info;
    }

    dismiss(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize Toast Manager
const toast = new ToastManager();

// === LOADING MANAGER ===
class LoadingManager {
    static show(element, text = 'Yükleniyor...') {
        if (element.classList.contains('loading')) return;

        element.classList.add('loading');
        const originalText = element.textContent;
        element.dataset.originalText = originalText;
        element.innerHTML = `<span class="loading-spinner"></span>${text}`;
        element.disabled = true;
    }

    static hide(element) {
        if (!element.classList.contains('loading')) return;

        element.classList.remove('loading');
        element.textContent = element.dataset.originalText || 'Gönder';
        element.disabled = false;
    }
}

// === SCROLL EFFECTS ===
function initScrollEffects() {
    const header = document.querySelector('.main-header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Add scrolled class for backdrop effect
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    });

    // Apple-style scroll animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Staggered animation delay
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, index * 150);
            }
        });
    }, observerOptions);

    // Initialize scroll animations when page loads
    initializeScrollAnimations(observer);
}

function initializeScrollAnimations(observer) {
    // Service cards - animate from bottom
    document.querySelectorAll('.service-card').forEach((card, index) => {
        card.classList.add('scroll-animate');
        if (index % 2 === 0) {
            card.style.transitionDelay = `${index * 0.1}s`;
        }
        observer.observe(card);
    });

    // Blog cards - alternate left/right
    document.querySelectorAll('.post-card').forEach((card, index) => {
        if (index % 2 === 0) {
            card.classList.add('scroll-animate-left');
        } else {
            card.classList.add('scroll-animate-right');
        }
        card.style.transitionDelay = `${index * 0.2}s`;
        observer.observe(card);
    });

    // Team cards - scale animation
    document.querySelectorAll('.team-card').forEach((card, index) => {
        card.classList.add('scroll-animate-scale');
        card.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(card);
    });

    // Section titles - from bottom
    document.querySelectorAll('.section-title, h1, h2').forEach((title, index) => {
        title.classList.add('scroll-animate');
        title.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(title);
    });

    // Buttons and CTAs - scale animation (contact butonlarını hariç tut)
    document.querySelectorAll('.btn, .read-more').forEach((btn, index) => {
        // Contact butonlarını hariç tut
        if (!btn.closest('.service-contact') && !btn.closest('.post-contact')) {
            btn.classList.add('scroll-animate-scale');
            btn.style.transitionDelay = `${index * 0.05}s`;
            observer.observe(btn);
        }
    });

    // Grid containers - staggered children
    document.querySelectorAll('.grid-container').forEach(container => {
        container.classList.add('scroll-animate');
        observer.observe(container);
    });
}

// === API FUNCTIONS ===
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Fetching data from ${endpoint} failed:`, error);
        toast.show('Hata', 'Veriler yüklenirken bir hata oluştu.', 'error');
        return null;
    }
}

// === CARD CREATION FUNCTIONS ===
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
        <i class="${service.icon_class}"></i>
        <h3>${service.title}</h3>
        <p>${service.description}</p>
        <a href="calisma-alanlarimiz.html#service-${service.id}" class="read-more">
            Devamını Oku
        </a>
    `;
    return card;
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    const postDate = new Date(post.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Service tag with badge styling
    const serviceTag = post.service_name && post.service_name.String ?
        `<span class="service-tag">
            <i class="fas fa-tag"></i>
            ${post.service_name.String}
        </span>` : '';

    // Author info with user icon
    const authorInfo = post.author && post.author.String ?
        `<span class="author-info">
            <i class="fas fa-user"></i>
            ${post.author.String}
        </span>` : '';

    card.innerHTML = `
        <div class="post-card-content">
            <div class="post-tags">
                ${serviceTag}
            </div>
            <h3>${post.title}</h3>
            <p>${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
            <div class="post-meta">
                <span class="post-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${postDate}
                </span>
                ${authorInfo}
            </div>
            <a href="blog.html#post-${post.id}" class="read-more">
                Devamını Oku
            </a>
        </div>
    `;
    return card;
}

function createTeamCard(member) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.innerHTML = `
        <img src="${member.image_url}" alt="${member.name}" class="team-card-img" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="display:none; height: 300px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); 
                    align-items: center; justify-content: center; color: #475569; font-weight: 500;">
            <i class="fas fa-user" style="font-size: 3rem; opacity: 0.5;"></i>
        </div>
        <div class="team-card-info">
            <h3>${member.name}</h3>
            <p class="team-card-title">${member.title}</p>
            <p class="team-card-bio">${member.bio}</p>
        </div>
    `;
    return card;
}

// === LOADING FUNCTIONS ===
async function loadServicesPreview() {
    const container = document.querySelector('#services-container');
    if (!container) return;

    // Show skeleton loading
    container.innerHTML = Array(3).fill(0).map(() => `
        <div class="service-card skeleton" style="height: 300px;"></div>
    `).join('');

    const services = await fetchData('/services');
    if (services && container) {
        container.innerHTML = '';
        services.slice(0, 3).forEach((service, index) => {
            const card = createServiceCard(service);
            card.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(card);
        });
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Hizmetler yüklenemedi. Lütfen sayfayı yenileyin.</p>';
    }
}

async function loadBlogPreview() {
    const container = document.querySelector('#posts-container');
    if (!container) return;

    // Show skeleton loading
    container.innerHTML = Array(2).fill(0).map(() => `
        <div class="post-card skeleton" style="height: 250px;"></div>
    `).join('');

    const posts = await fetchData('/posts');
    if (posts && container) {
        container.innerHTML = '';
        posts.slice(0, 2).forEach((post, index) => {
            const card = createPostCard(post);
            card.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(card);
        });
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Blog yazıları yüklenemedi. Lütfen sayfayı yenileyin.</p>';
    }
}

async function loadAllServices() {
    const container = document.querySelector('#services-full-container');
    if (!container) return;

    const services = await fetchData('/services');
    if (services && container) {
        container.innerHTML = '';
        services.forEach((service, index) => {
            const card = createServiceCard(service);
            card.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(card);
        });
        return true; // Promise çözümü için
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Hizmetler yüklenemedi.</p>';
        return false;
    }
}

async function loadTeamMembers() {
    const container = document.querySelector('#team-container');
    if (!container) return;

    const team = await fetchData('/team');
    if (team && container) {
        container.innerHTML = '';
        team.forEach((member, index) => {
            const card = createTeamCard(member);
            card.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(card);
        });
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Ekip üyeleri yüklenemedi.</p>';
    }
}

async function loadAllPosts() {
    const container = document.querySelector('#posts-full-container');
    if (!container) return;

    const posts = await fetchData('/posts');
    if (posts && container) {
        container.innerHTML = '';
        posts.forEach((post, index) => {
            const card = createPostCard(post);
            card.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(card);
        });
        return true; // Promise çözümü için
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Blog yazıları yüklenemedi.</p>';
        return false;
    }
}

// === CONTACT FORM ===
async function handleContactFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (!data.name || !data.email || !data.subject || !data.message) {
        toast.show('Hata', 'Lütfen tüm gerekli alanları doldurun.', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        toast.show('Hata', 'Lütfen geçerli bir email adresi girin.', 'error');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    LoadingManager.show(submitButton, 'Gönderiliyor...');

    try {
        // API'ye mesaj gönder
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                subject: data.subject,
                message: data.message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Form'u temizle
        form.reset();

        // Başarılı mesaj göster
        toast.show('Başarılı', result.message || 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.', 'success');

    } catch (error) {
        console.error('Contact form error:', error);
        toast.show('Hata', 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
        LoadingManager.hide(submitButton);
    }
}

// === MOBILE NAVIGATION ===
function initMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.contains('active');
            mainNav.classList.toggle('active');
            mobileNavToggle.textContent = isOpen ? 'MENU' : 'CLOSE';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !mobileNavToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                mobileNavToggle.textContent = 'MENU';
            }
        });
    }
}

// === PAGE INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Initialize toast manager
    const toast = new ToastManager();

    // Initialize UI enhancements - scroll effects artık tüm sayfalarda
    initScrollEffects();
    initMobileNavigation();

    // Page-specific initializations
    if (document.querySelector('#services-preview') && document.querySelector('#blog-preview')) {
        loadServicesPreview();
        loadBlogPreview();
    }

    if (document.querySelector('#services-full-container')) {
        loadAllServices().then(() => {
            // Servis kartları yüklendikten sonra linkleri güncelle
            updateServiceCardLinks();

            // Sayfa yüklendiğinde hash kontrolü yap
            setTimeout(() => {
                handleHashChange();
            }, 100);
        });
        // Servis detay sistemini başlat
        initServiceDetailSystem();
    }

    if (document.querySelector('#team-container')) {
        loadTeamMembers();
    }

    if (document.querySelector('#posts-full-container')) {
        loadAllPosts().then(() => {
            // Post kartları yüklendikten sonra linkleri güncelle
            updatePostCardLinks();

            // Sayfa yüklendiğinde hash kontrolü yap
            setTimeout(() => {
                handleBlogHashChange();
            }, 100);
        });
        // Blog detay sistemini başlat
        initBlogDetailSystem();
    }

    // Contact form
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    // Add smooth scroll behavior only to same-page anchor links (not navigation links)
    document.querySelectorAll('a[href^="#"]:not(.nav-link)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Show welcome message only on homepage
    const isHomepage = window.location.pathname === '/' ||
        window.location.pathname === '/index.html' ||
        window.location.pathname.endsWith('/index.html') ||
        window.location.pathname === '/c:/Users/Pc/Desktop/polatlar/frontend/index.html';

    if (isHomepage) {
        setTimeout(() => {
            toast.show('Hoş Geldiniz', 'Polat Legal\'e hoş geldiniz!', 'info', 4000);
        }, 1000);
    }
});

// === SERVİS DETAY SİSTEMİ ===
const serviceDetails = {
    1: {
        title: "Ceza Hukuku",
        icon: "fas fa-gavel",
        description: "Ceza davalarında soruşturma ve kovuşturma aşamalarında hukuki destek sağlıyoruz.",
        content: `
            <h2>Ceza Hukuku Hizmetlerimiz</h2>
            <p>Ceza hukuku alanında geniş deneyime sahip avukatlarımız, müvekkillerimizin haklarını korumak için her türlü ceza davasında hizmet vermektedir.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>Kasten yaralama ve müessir fiil davaları</li>
                <li>Hırsızlık, dolandırıcılık ve güveni kötüye kullanma</li>
                <li>Tehdit, şantaj ve hakaret davaları</li>
                <li>Uyuşturucu madde suçları</li>
                <li>Cinsel suçlar</li>
                <li>Mala zarar verme suçları</li>
                <li>Trafik suçları ve trafik kazaları</li>
                <li>Kamu görevlilerine karşı işlenen suçlar</li>
            </ul>
            
            <h3>Sürecimiz</h3>
            <ul>
                <li>Dosya inceleme ve hukuki analiz</li>
                <li>Savunma stratejisi belirleme</li>
                <li>Soruşturma aşamasında temsil</li>
                <li>Mahkeme aşamasında savunma</li>
                <li>Temyiz ve istinaf süreçleri</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    },
    2: {
        title: "Aile Hukuku",
        icon: "fas fa-users",
        description: "Anlaşmalı ve çekişmeli boşanma, velayet, nafaka ve mal paylaşımı davalarına bakıyoruz.",
        content: `
            <h2>Aile Hukuku Hizmetlerimiz</h2>
            <p>Aile hukuku konularında hassas yaklaşımla, müvekkillerimizin ve çocukların menfaatlerini gözeterek hizmet sunuyoruz.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>Anlaşmalı boşanma davaları</li>
                <li>Çekişmeli boşanma davaları</li>
                <li>Velayet ve kişisel ilişki kurma davaları</li>
                <li>Nafaka davaları (yoksulluk, tedbir, çocuk)</li>
                <li>Mal rejimi ve tasfiye davaları</li>
                <li>Nişanlanma ve evlilik hukuku</li>
                <li>Evlat edinme süreçleri</li>
                <li>Aile içi şiddet ve koruma kararları</li>
            </ul>
            
            <h3>Yaklaşımımız</h3>
            <ul>
                <li>Öncelikle anlaşma yollarını arama</li>
                <li>Çocukların üstün menfaatini gözetme</li>
                <li>Gizlilik ve mahremiyet ilkesi</li>
                <li>Hızlı ve etkili çözüm arayışı</li>
                <li>Psikolojik destek koordinasyonu</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    },
    3: {
        title: "Bilişim Hukuku",
        icon: "fas fa-laptop-code",
        description: "Siber zorbalık, e-ticaret anlaşmazlıkları ve kişisel verilerin korunması konularında hizmet veriyoruz.",
        content: `
            <h2>Bilişim Hukuku Hizmetlerimiz</h2>
            <p>Dijital çağın gereksinimlerine uygun olarak, teknoloji ve hukuk kesişiminde kapsamlı hizmetler sunuyoruz.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>Kişisel Verilerin Korunması Kanunu (KVKK) uyumu</li>
                <li>E-ticaret ve dijital platform hukuku</li>
                <li>Siber suçlar ve siber güvenlik</li>
                <li>Sosyal medya hukuku</li>
                <li>Telif hakkı ve fikri mülkiyet</li>
                <li>Bilişim sistemlerine yönelik suçlar</li>
                <li>E-imza ve elektronik belge hukuku</li>
                <li>Dijital pazarlama ve reklam hukuku</li>
            </ul>
            
            <h3>Sunduğumuz Hizmetler</h3>
            <ul>
                <li>KVKK uyum danışmanlığı</li>
                <li>Gizlilik politikaları hazırlama</li>
                <li>E-ticaret sözleşmeleri</li>
                <li>Siber saldırı sonrası hukuki destek</li>
                <li>Telif hakkı ihlali davaları</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    },
    4: {
        title: "Ticaret Hukuku",
        icon: "fas fa-handshake",
        description: "Şirket kuruluşu, sözleşmeler ve ticari anlaşmazlıklar konularında danışmanlık hizmeti sunuyoruz.",
        content: `
            <h2>Ticaret Hukuku Hizmetlerimiz</h2>
            <p>İş dünyasının dinamik yapısına uygun olarak, ticari faaliyetlerin her aşamasında hukuki destek sağlıyoruz.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>Şirket kuruluşu ve yapısal değişiklikler</li>
                <li>Ticari sözleşmeler ve anlaşmalar</li>
                <li>Ticari dava ve icra takipleri</li>
                <li>Rekabet hukuku danışmanlığı</li>
                <li>Franchise ve distribütörlük anlaşmaları</li>
                <li>Ortaklık anlaşmazlıkları</li>
                <li>Ticari markaların korunması</li>
                <li>İcra ve iflas hukuku</li>
            </ul>
            
            <h3>Süreç Yönetimi</h3>
            <ul>
                <li>Hukuki risklerin analizi</li>
                <li>Sözleşme taslağı hazırlama</li>
                <li>Müzakere sürecinde destek</li>
                <li>Uyuşmazlık çözümü</li>
                <li>Mahkeme sürecinde temsil</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    },
    5: {
        title: "Gayrimenkul Hukuku",
        icon: "fas fa-building",
        description: "Tapu işlemleri, kira sözleşmeleri ve gayrimenkul alım-satım davalarıyla ilgleniyoruz.",
        content: `
            <h2>Gayrimenkul Hukuku Hizmetlerimiz</h2>
            <p>Gayrimenkul sektöründeki deneyimimizle, alım-satımdan kira ilişkilerine kadar her konuda hizmet veriyoruz.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>Gayrimenkul alım-satım işlemleri</li>
                <li>Kira sözleşmeleri ve tahliye davaları</li>
                <li>Tapu tescil ve iptal davaları</li>
                <li>İmar hukuku danışmanlığı</li>
                <li>Arsa payı değişikliği davaları</li>
                <li>Kamulaştırma davaları</li>
                <li>Kat mülkiyeti ve kat irtifakı</li>
                <li>İnşaat sözleşmeleri</li>
            </ul>
            
            <h3>Hukuki Süreçler</h3>
            <ul>
                <li>Tapu araştırması ve due diligence</li>
                <li>Sözleşme hazırlama ve inceleme</li>
                <li>İcra takibi ve dava süreçleri</li>
                <li>Belediye ve idari işlemler</li>
                <li>Emlak vergisi ve harç hesaplamaları</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    },
    6: {
        title: "İcra ve İflas Hukuku",
        icon: "fas fa-dollar-sign",
        description: "Alacak tahsili, haciz işlemleri ve iflas süreçlerinde müvekkillerinizin yanındayız.",
        content: `
            <h2>İcra ve İflas Hukuku Hizmetlerimiz</h2>
            <p>Alacaklarınızın tahsili ve borç sorunlarınızın çözümü için etkin hukuki stratejiler geliştiriyoruz.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>İcra takibi başlatma ve takip etme</li>
                <li>Haciz işlemleri ve satış süreçleri</li>
                <li>İflas davası açma ve savunma</li>
                <li>Konkordato süreçleri</li>
                <li>İtiraz ve menfi tespit davaları</li>
                <li>İcra inkar ve eda davaları</li>
                <li>Ödeme emri itirazları</li>
                <li>Hacze iştirak ve pay paylaştırma</li>
            </ul>
            
            <h3>Stratejik Yaklaşım</h3>
            <ul>
                <li>En uygun takip türünün belirlenmesi</li>
                <li>Hızlı ve etkili icra stratejisi</li>
                <li>Borçlunun mal varlığının araştırılması</li>
                <li>Alternatif çözüm yollarının değerlendirilmesi</li>
                <li>Risk analizi ve maliyet hesaplaması</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    },
    7: {
        title: "Trabzon Hukuku",
        icon: "fas fa-landmark",
        description: "Yerel hukuki konular ve Trabzon özelinde hukuki danışmanlık hizmetleri.",
        content: `
            <h2>Trabzon Özelinde Hukuki Hizmetlerimiz</h2>
            <p>Trabzon ve çevresindeki özel durumlar için yerel deneyimimizle hizmet sunuyoruz.</p>
            
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                <li>Yerel imar uygulamaları</li>
                <li>Tarım arazisi hukuku</li>
                <li>Kıyı hukuku ve kıyı kenar çizgisi</li>
                <li>Orman hukuku uygulamaları</li>
                <li>Yerel yönetim hukuku</li>
                <li>Bölgesel ticaret hukuku</li>
                <li>Turizm hukuku</li>
                <li>Balıkçılık ve denizcilik hukuku</li>
            </ul>
            
            <h3>Bölgesel Uzmanlık</h3>
            <ul>
                <li>Trabzon'a özgü yasal düzenlemeler</li>
                <li>Yerel mahkemelerle işbirliği</li>
                <li>Bölgesel ticaret uygulamaları</li>
                <li>Kültürel ve sosyal özellikler gözetimi</li>
                <li>Yerel ağ ve referanslar</li>
            </ul>
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `
    }
};

// Hash routing sistemi
let serviceHashListenerAdded = false;

function initServiceDetailSystem() {
    // Hash değişikliklerini sadece bir kez dinle
    if (!serviceHashListenerAdded) {
        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('load', handleHashChange);
        serviceHashListenerAdded = true;
    }

    // Geri dön butonu
    const backButton = document.getElementById('back-to-services');
    if (backButton && !backButton.hasAttribute('data-listener-added')) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            showServicesList();
        });
        backButton.setAttribute('data-listener-added', 'true');
    }
}

function handleHashChange() {
    const hash = window.location.hash;

    // Sadece servis sayfasındaysak hash değişikliklerini handle et
    if (window.location.pathname.includes('calisma-alanlarimiz.html')) {
        if (hash.startsWith('#service-')) {
            const serviceId = parseInt(hash.replace('#service-', ''));
            if (!isNaN(serviceId)) {
                showServiceDetail(serviceId);
            } else {
                showServicesList();
            }
        } else {
            showServicesList();
        }
    }
}

async function showServiceDetail(serviceId) {
    try {
        const response = await fetch(`http://localhost:8061/api/services/${serviceId}`);
        if (!response.ok) {
            throw new Error('Service not found');
        }

        const service = await response.json();

        // Parse JSON fields safely
        let serviceAreas = [];
        let secondSectionItems = [];

        try {
            serviceAreas = service.service_areas ? JSON.parse(service.service_areas) : [];
        } catch (e) {
            serviceAreas = [];
        }

        try {
            secondSectionItems = service.second_section_items ? JSON.parse(service.second_section_items) : [];
        } catch (e) {
            secondSectionItems = [];
        }

        // Build service areas HTML
        const serviceAreasHtml = serviceAreas.length > 0 ? `
            <h3>Hizmet Verdiğimiz Alanlar</h3>
            <ul>
                ${serviceAreas.map(area => `<li>${area}</li>`).join('')}
            </ul>
        ` : '';

        // Build second section HTML
        const secondSectionHtml = (service.second_section_title && secondSectionItems.length > 0) ? `
            <h3>${service.second_section_title}</h3>
            ${service.second_section_description ? `<p>${service.second_section_description}</p>` : ''}
            <ul>
                ${secondSectionItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
        ` : '';

        // Build complete content
        const content = `
            <h2>${service.title}</h2>
            <p>${service.hero_description || service.description}</p>
            
            ${serviceAreasHtml}
            ${secondSectionHtml}
            
            <div class="service-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `;

        // Detay bilgilerini güncelle
        document.getElementById('detail-icon').className = service.icon_class;
        document.getElementById('detail-title').textContent = service.title;
        document.getElementById('detail-description').textContent = service.description;
        document.getElementById('detail-content').innerHTML = content;

        // Görünümleri değiştir
        document.getElementById('services-list').style.display = 'none';
        document.getElementById('service-detail').style.display = 'block';

        // Sayfayı başa kaydır
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Scroll animasyonları için
        setTimeout(() => {
            initializeScrollAnimations(new IntersectionObserver(() => { }, {}));
        }, 100);

    } catch (error) {
        console.error('Error fetching service:', error);
        console.log('Hizmet bulunamadı.');
        showServicesList();
    }
}

function showServicesList() {
    const serviceDetail = document.getElementById('service-detail');
    const servicesList = document.getElementById('services-list');

    if (serviceDetail) serviceDetail.style.display = 'none';
    if (servicesList) servicesList.style.display = 'block';

    // URL'den hash'i kaldır
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }

    // Sayfayı başa kaydır
    window.scrollTo({ top: 0, behavior: 'auto' });
}

// Service card'lardaki linkleri yakalamak için
function updateServiceCardLinks() {
    document.querySelectorAll('.service-card .read-more').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            const hash = href.split('#')[1];
            window.location.hash = hash;
        });
    });
}

// === BLOG DETAY SİSTEMİ ===


// Blog hash routing sistemi
let blogHashListenerAdded = false;

function initBlogDetailSystem() {
    // Hash değişikliklerini sadece bir kez dinle
    if (!blogHashListenerAdded) {
        window.addEventListener('hashchange', handleBlogHashChange);
        window.addEventListener('load', handleBlogHashChange);
        blogHashListenerAdded = true;
    }

    // Geri dön butonu
    const backButton = document.getElementById('back-to-posts');
    if (backButton && !backButton.hasAttribute('data-listener-added')) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            showPostsList();
        });
        backButton.setAttribute('data-listener-added', 'true');
    }
}

function handleBlogHashChange() {
    const hash = window.location.hash;

    // Sadece blog sayfasındaysak hash değişikliklerini handle et
    if (window.location.pathname.includes('blog.html')) {
        if (hash.startsWith('#post-')) {
            const postId = parseInt(hash.replace('#post-', ''));
            if (!isNaN(postId)) {
                showPostDetail(postId);
            } else {
                showPostsList();
            }
        } else {
            showPostsList();
        }
    }
}

async function showPostDetail(postId) {
    try {
        const response = await fetch(`http://localhost:8061/api/posts/${postId}`);
        if (!response.ok) {
            throw new Error('Post not found');
        }

        const post = await response.json();

        // Format date
        const date = new Date(post.created_at);
        const formattedDate = date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get author name (fallback to default if null)
        const authorName = post.author && post.author.String ? post.author.String : "Av. Mehmet Polat";

        // Get service name (fallback to default if null)
        const serviceName = post.service_name && post.service_name.String ? post.service_name.String : "Hukuk";

        // Detay bilgilerini güncelle
        document.getElementById('detail-post-title').textContent = post.title;
        document.getElementById('detail-post-date').textContent = formattedDate;
        document.getElementById('detail-post-author').textContent = authorName;
        document.getElementById('detail-post-service').textContent = serviceName;

        // Post content'e iletişim butonu da ekliyoruz
        document.getElementById('detail-post-content').innerHTML = post.content + `
            <div class="post-contact">
                <h3>Bu Konuda Hukuki Desteğe İhtiyacınız Var mı?</h3>
                <p>Uzman avukatlarımızla hemen iletişime geçin.</p>
                <a href="iletisim.html" class="btn">
                    <i class="fas fa-phone"></i> İletişime Geçin
                </a>
            </div>
        `;

        // Görünümleri değiştir
        const postsList = document.getElementById('posts-list');
        const postDetail = document.getElementById('post-detail');

        if (postsList) postsList.style.display = 'none';
        if (postDetail) postDetail.style.display = 'block';

        // Sayfayı başa kaydır
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Scroll animasyonları için
        setTimeout(() => {
            initializeScrollAnimations(new IntersectionObserver(() => { }, {}));
        }, 100);

    } catch (error) {
        console.error('Error fetching blog post:', error);
        ToastManager.error('Blog yazısı bulunamadı.');
        showPostsList();
    }
}

function showPostsList() {
    const postDetail = document.getElementById('post-detail');
    const postsList = document.getElementById('posts-list');

    if (postDetail) postDetail.style.display = 'none';
    if (postsList) postsList.style.display = 'block';

    // URL'den hash'i kaldır
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }

    // Sayfayı başa kaydır
    window.scrollTo({ top: 0, behavior: 'auto' });
}

// Post card'lardaki linkleri yakalamak için
function updatePostCardLinks() {
    document.querySelectorAll('.post-card .read-more').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            const hash = href.split('#')[1];
            window.location.hash = hash;
        });
    });
}
