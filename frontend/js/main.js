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

    // Buttons and CTAs - scale animation
    document.querySelectorAll('.btn, .read-more').forEach((btn, index) => {
        btn.classList.add('scroll-animate-scale');
        btn.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(btn);
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
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Hizmetler yüklenemedi.</p>';
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
    } else if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Blog yazıları yüklenemedi.</p>';
    }
}

// === CONTACT FORM ===
function handleContactFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (!data.name || !data.email || !data.message) {
        toast.show('Hata', 'Lütfen tüm gerekli alanları doldurun.', 'error');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    LoadingManager.show(submitButton, 'Gönderiliyor...');

    // Simulate API call
    setTimeout(() => {
        form.reset();
        LoadingManager.hide(submitButton);
        toast.show('Başarılı', 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.', 'success');
    }, 2000);
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
    // Initialize UI enhancements
    initScrollEffects();
    initMobileNavigation();

    // Page-specific initializations
    if (document.querySelector('#services-preview') && document.querySelector('#blog-preview')) {
        loadServicesPreview();
        loadBlogPreview();
    }

    if (document.querySelector('#services-full-container')) {
        loadAllServices();
    }

    if (document.querySelector('#team-container')) {
        loadTeamMembers();
    }

    if (document.querySelector('#posts-full-container')) {
        loadAllPosts();
    }

    // Contact form
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    // Add smooth scroll behavior to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

    // Show welcome message
    setTimeout(() => {
        toast.show('Hoş Geldiniz', 'Polatlar Hukuk Bürosu\'na hoş geldiniz!', 'info', 4000);
    }, 1000);
});
