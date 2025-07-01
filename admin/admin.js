// === NOTIFICATION SYSTEM ===
class NotificationManager {
    static show(message, type = 'info', duration = 4000) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger show animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto dismiss
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }
}

// === LOADING MANAGER ===
class LoadingManager {
    static show(element, text = 'İşleniyor...') {
        if (element.classList && element.classList.contains('loading')) return;

        if (element.classList) {
            element.classList.add('loading');
            const originalText = element.textContent;
            element.dataset.originalText = originalText;
            element.innerHTML = `<span class="loading-spinner"></span>${text}`;
            element.disabled = true;
        }
    }

    static hide(element) {
        if (!element.classList || !element.classList.contains('loading')) return;

        element.classList.remove('loading');
        element.textContent = element.dataset.originalText || 'Kaydet';
        element.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const adminPanelContainer = document.getElementById('admin-panel-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const adminNav = document.querySelector('.admin-nav');
    const managementSections = document.getElementById('management-sections');
    const loginError = document.getElementById('login-error');
    const serviceModal = document.getElementById('service-modal');
    const serviceForm = document.getElementById('service-form');
    const closeModalBtn = document.querySelector('.close-btn');
    const teamModal = document.getElementById('team-modal');
    const teamForm = document.getElementById('team-form');
    const postModal = document.getElementById('post-modal');
    const postForm = document.getElementById('post-form');

    const API_URL = 'http://localhost:8061/api/admin';

    // === AUTH & NAVIGATION ===
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            loginContainer.classList.remove('active');
            adminPanelContainer.classList.add('active');
            loadSectionData('services');
            loadServicesIntoPostForm();
            NotificationManager.success('Admin paneline hoş geldiniz!');
        } else {
            loginContainer.classList.add('active');
            adminPanelContainer.classList.remove('active');
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        loginError.textContent = '';

        const submitBtn = e.target.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn, 'Giriş yapılıyor...');

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                throw new Error('Kullanıcı adı veya şifre hatalı.');
            }

            const data = await res.json();
            localStorage.setItem('authToken', data.token);
            LoadingManager.hide(submitBtn);
            checkAuth();
        } catch (error) {
            LoadingManager.hide(submitBtn);
            loginError.textContent = error.message;
            NotificationManager.error(error.message);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        NotificationManager.success('Başarıyla çıkış yapıldı.');
        checkAuth();
    });

    // === MODAL MANAGEMENT ===
    function openModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
        const hiddenId = modal.querySelector('input[type="hidden"]');
        if (hiddenId) hiddenId.value = '';
    }

    // Close modal handlers
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });

    // === TAB MANAGEMENT ===
    adminNav.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const targetId = e.target.dataset.target;

            // Update active states
            adminNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            managementSections.querySelectorAll('.management-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Load data for selected section
            const sectionName = targetId.split('-')[0];
            loadSectionData(sectionName);
        }
    });

    // === ENHANCED DATA LOADING ===
    async function fetchProtectedData(endpoint) {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`/api/admin/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                logoutBtn.click();
                throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
            }

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            NotificationManager.error(error.message);
            throw error;
        }
    }

    async function loadSectionData(sectionName) {
        try {
            const data = await fetchProtectedData(sectionName);

            if (sectionName === 'services') {
                populateTable('services-table-body', data, ['title', 'icon_class']);
            } else if (sectionName === 'team') {
                populateTable('team-table-body', data, ['name', 'title']);
            } else if (sectionName === 'posts') {
                populateTable('posts-table-body', data, ['title', 'service_name']);
            }
        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
        }
    }

    function populateTable(tbodyId, data, columns) {
        const tbody = document.getElementById(tbodyId);
        const section = tbodyId.split('-')[0];

        if (!tbody) return;

        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${columns.length + 1}" style="text-align: center; padding: 2rem; color: #64748b;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Henüz veri bulunmamaktadır.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${index * 0.05}s`;

            columns.forEach(col => {
                const td = document.createElement('td');
                let value = item[col];

                if (col === 'service_name' && value && value.String) {
                    value = value.String;
                } else if (!value) {
                    value = 'İlişkilendirilmemiş';
                }

                td.textContent = value;
                tr.appendChild(td);
            });

            // Actions column
            const actionsTd = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Düzenle';
            editBtn.addEventListener('click', () => handleEdit(item, section));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
            deleteBtn.addEventListener('click', () => handleDelete(item.id, section, item.title || item.name));

            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            tr.appendChild(actionsTd);

            tbody.appendChild(tr);
        });
    }

    // === ADD NEW BUTTONS ===
    document.querySelector('#services-management .btn-primary').addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Yeni Hizmet Ekle';
        openModal(serviceModal);
    });

    document.querySelector('#team-management .btn-primary').addEventListener('click', () => {
        document.querySelector('#team-modal h2').textContent = 'Yeni Ekip Üyesi Ekle';
        openModal(teamModal);
    });

    document.querySelector('#posts-management .btn-primary').addEventListener('click', () => {
        document.querySelector('#post-modal h2').textContent = 'Yeni Blog Yazısı Ekle';
        openModal(postModal);
    });

    // === EDIT FUNCTIONALITY ===
    function handleEdit(item, sectionName) {
        if (sectionName === 'services') {
            document.getElementById('modal-title').textContent = 'Hizmeti Düzenle';
            document.getElementById('service-id').value = item.id;
            document.getElementById('service-title').value = item.title;
            document.getElementById('service-description').value = item.description;
            document.getElementById('service-icon').value = item.icon_class;
            openModal(serviceModal);
        } else if (sectionName === 'team') {
            document.querySelector('#team-modal h2').textContent = 'Ekip Üyesini Düzenle';
            document.getElementById('team-id').value = item.id;
            document.getElementById('team-name').value = item.name;
            document.getElementById('team-title').value = item.title;
            document.getElementById('team-bio').value = item.bio;
            document.getElementById('team-image').value = item.image_url;
            openModal(teamModal);
        } else if (sectionName === 'posts') {
            document.querySelector('#post-modal h2').textContent = 'Blog Yazısını Düzenle';
            document.getElementById('post-id').value = item.id;
            document.getElementById('post-title').value = item.title;
            document.getElementById('post-content').value = item.content;
            document.getElementById('post-service').value = item.service_id?.Int64 || '';
            openModal(postModal);
        }
    }

    // === DELETE FUNCTIONALITY ===
    async function handleDelete(id, sectionName, itemName) {
        const confirmed = confirm(`"${itemName}" öğesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/${sectionName}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Silme işlemi başarısız oldu.');
            }

            NotificationManager.success(`"${itemName}" başarıyla silindi.`);
            loadSectionData(sectionName);
        } catch (error) {
            NotificationManager.error(error.message);
        }
    }

    // === FORM SUBMISSIONS ===
    serviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('service-id').value;
        const serviceData = {
            title: document.getElementById('service-title').value,
            description: document.getElementById('service-description').value,
            icon_class: document.getElementById('service-icon').value
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn, id ? 'Güncelleniyor...' : 'Kaydediliyor...');

        try {
            await saveFormData('services', id, serviceData);
            closeModal(serviceModal);
            loadSectionData('services');
            NotificationManager.success(id ? 'Hizmet başarıyla güncellendi!' : 'Yeni hizmet başarıyla eklendi!');
        } catch (error) {
            NotificationManager.error(error.message);
        } finally {
            LoadingManager.hide(submitBtn);
        }
    });

    teamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('team-id').value;
        const teamData = {
            name: document.getElementById('team-name').value,
            title: document.getElementById('team-title').value,
            bio: document.getElementById('team-bio').value,
            image_url: document.getElementById('team-image').value
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn, id ? 'Güncelleniyor...' : 'Kaydediliyor...');

        try {
            await saveFormData('team', id, teamData);
            closeModal(teamModal);
            loadSectionData('team');
            NotificationManager.success(id ? 'Ekip üyesi başarıyla güncellendi!' : 'Yeni ekip üyesi başarıyla eklendi!');
        } catch (error) {
            NotificationManager.error(error.message);
        } finally {
            LoadingManager.hide(submitBtn);
        }
    });

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('post-id').value;
        const postData = {
            title: document.getElementById('post-title').value,
            content: document.getElementById('post-content').value,
            service_id: document.getElementById('post-service').value || null
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn, id ? 'Güncelleniyor...' : 'Kaydediliyor...');

        try {
            await saveFormData('posts', id, postData);
            closeModal(postModal);
            loadSectionData('posts');
            NotificationManager.success(id ? 'Blog yazısı başarıyla güncellendi!' : 'Yeni blog yazısı başarıyla eklendi!');
        } catch (error) {
            NotificationManager.error(error.message);
        } finally {
            LoadingManager.hide(submitBtn);
        }
    });

    // === SAVE FORM DATA ===
    async function saveFormData(sectionName, id, data) {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/${sectionName}/${id}` : `/api/admin/${sectionName}`;
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Kayıt işlemi başarısız oldu.');
        }

        return response.json();
    }

    // === LOAD SERVICES FOR POST FORM ===
    async function loadServicesIntoPostForm() {
        try {
            const services = await fetchProtectedData('services');
            const select = document.getElementById('post-service');

            if (select && services) {
                select.innerHTML = '<option value="">-- Hizmet Seçin --</option>';
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = service.title;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Hizmetler yüklenemedi:', error);
        }
    }

    // === ENHANCED TABLE STYLING ===
    function wrapTablesInContainers() {
        document.querySelectorAll('table').forEach(table => {
            if (!table.parentElement.classList.contains('table-container')) {
                const container = document.createElement('div');
                container.className = 'table-container';
                table.parentNode.insertBefore(container, table);
                container.appendChild(table);
            }
        });
    }

    // Initialize
    checkAuth();
    wrapTablesInContainers();

    // Show welcome message after delay
    setTimeout(() => {
        if (localStorage.getItem('authToken')) {
            NotificationManager.success('Yönetim paneline hoş geldiniz! 👋');
        }
    }, 1500);
});

