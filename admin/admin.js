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
            initializeIconSelector();
            initializeDynamicLists();
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
            // Cache bypass için timestamp ekliyoruz
            const timestamp = new Date().getTime();
            const url = `/api/admin/${endpoint}?_t=${timestamp}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
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
        // Form'u temizle
        document.getElementById('service-form').reset();
        document.getElementById('service-id').value = '';
        // İkon preview'ını sıfırla
        updateIconPreview('');
        // Dinamik listeleri temizle
        updateServiceAreasList([]);
        updateSecondItemsList([]);
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
            document.getElementById('service-hero-description').value = item.hero_description || '';
            document.getElementById('service-icon').value = item.icon_class;
            document.getElementById('service-second-title').value = item.second_section_title || '';
            document.getElementById('service-second-description').value = item.second_section_description || '';

            // JSON alanları parse et
            const serviceAreas = item.service_areas ? JSON.parse(item.service_areas) : [];
            const secondItems = item.second_section_items ? JSON.parse(item.second_section_items) : [];

            // Dinamik listeleri güncelle
            updateServiceAreasList(serviceAreas);
            updateSecondItemsList(secondItems);

            updateIconPreview(item.icon_class); // Preview'ı güncelle
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
            document.getElementById('post-author').value = item.author?.String || '';
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

        // Form verilerini topla
        const serviceAreas = getServiceAreasFromForm();
        const secondItems = getSecondItemsFromForm();

        const serviceData = {
            title: document.getElementById('service-title').value,
            description: document.getElementById('service-description').value,
            hero_description: document.getElementById('service-hero-description').value,
            icon_class: document.getElementById('service-icon').value,
            service_areas: JSON.stringify(serviceAreas),
            second_section_title: document.getElementById('service-second-title').value,
            second_section_description: document.getElementById('service-second-description').value,
            second_section_items: JSON.stringify(secondItems)
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

        // File upload kontrolü
        const fileInput = document.getElementById('team-image-file');
        const imageUrlInput = document.getElementById('team-image');
        let imageUrl = imageUrlInput.value;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn, id ? 'Güncelleniyor...' : 'Kaydediliyor...');

        // Eğer dosya seçilmişse, önce dosyayı yükle
        if (fileInput.files && fileInput.files[0]) {
            try {
                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);

                const uploadResponse = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: formData
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    imageUrl = uploadResult.url;
                } else {
                    const errorText = await uploadResponse.text();
                    NotificationManager.error('Dosya yükleme başarısız: ' + errorText);
                    LoadingManager.hide(submitBtn);
                    return;
                }
            } catch (error) {
                NotificationManager.error('Dosya yükleme hatası: ' + error.message);
                LoadingManager.hide(submitBtn);
                return;
            }
        }

        const teamData = {
            name: document.getElementById('team-name').value,
            title: document.getElementById('team-title').value,
            bio: document.getElementById('team-bio').value,
            image_url: imageUrl
        };

        try {
            await saveFormData('team', id, teamData);
            closeModal(teamModal);
            loadSectionData('team');

            // Form'u temizle
            document.getElementById('team-name').value = '';
            document.getElementById('team-title').value = '';
            document.getElementById('team-bio').value = '';
            document.getElementById('team-image').value = '';
            document.getElementById('team-image-file').value = '';

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

        // CKEditor'den içeriği al
        let content = '';
        if (ckEditor && ckEditor.getData) {
            try {
                content = ckEditor.getData();
            } catch (error) {
                console.error('CKEditor getData failed:', error);
                content = document.getElementById('post-content').value;
            }
        } else {
            content = document.getElementById('post-content').value;
        }

        // İçerik kontrolü
        if (!content || content.trim() === '' || content === '<p>&nbsp;</p>' || content === '<p></p>') {
            NotificationManager.error('Lütfen blog yazısı içeriğini doldurun.');
            return;
        }

        const postData = {
            title: document.getElementById('post-title').value,
            content: content,
            author: document.getElementById('post-author').value,
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

    // === CKEDITOR 5 RICH TEXT EDITOR ===
    let ckEditor = null;

    function initializeCKEditor() {
        if (ckEditor) return Promise.resolve();

        return ClassicEditor
            .create(document.querySelector('#post-content'), {
                toolbar: {
                    items: [
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        '|',
                        'bulletedList',
                        'numberedList',
                        '|',
                        'outdent',
                        'indent',
                        '|',
                        'undo',
                        'redo'
                    ]
                }
            })
            .then(editor => {
                ckEditor = editor;

                // Editor container'ına custom class ekle
                editor.ui.view.element.classList.add('custom-ckeditor');

                // Orijinal textarea'nın required attribute'unu kaldır
                const textarea = document.getElementById('post-content');
                textarea.removeAttribute('required');
                textarea.style.display = 'none';

                return editor;
            })
            .catch(error => {
                console.error('CKEditor initialization failed:', error);
                // Hata durumunda normal textarea'yı göster
                const textarea = document.getElementById('post-content');
                textarea.style.display = 'block';
                textarea.setAttribute('required', 'required');
            });
    }

    // Modal açılırken CKEditor'ü initialize et
    const originalOpenModal = openModal;
    openModal = function (modal) {
        originalOpenModal(modal);

        if (modal === postModal) {
            // Form'a CKEditor class'ını ekle
            postForm.classList.add('ckeditor-active');

            // CKEditor'ü modal açıldıktan sonra initialize et
            setTimeout(() => {
                if (typeof ClassicEditor !== 'undefined') {
                    initializeCKEditor()
                        .then(() => {
                            console.log('CKEditor initialized successfully');
                        })
                        .catch(error => {
                            console.error('CKEditor initialization failed:', error);
                            // Hata durumunda normal textarea'yı göster ve class'ı kaldır
                            const textarea = document.getElementById('post-content');
                            textarea.style.display = 'block';
                            textarea.setAttribute('required', 'required');
                            postForm.classList.remove('ckeditor-active');
                        });
                } else {
                    console.error('ClassicEditor not loaded');
                    // CKEditor yüklenmemişse normal textarea'yı göster
                    const textarea = document.getElementById('post-content');
                    textarea.style.display = 'block';
                    textarea.setAttribute('required', 'required');
                    postForm.classList.remove('ckeditor-active');
                }
            }, 200);
        }
    };

    // Modal kapanırken CKEditor'ü temizle
    const originalCloseModal = closeModal;
    closeModal = function (modal) {
        if (modal === postModal) {
            if (ckEditor && ckEditor.destroy) {
                // CKEditor'ü destroy et
                ckEditor.destroy()
                    .then(() => {
                        ckEditor = null;
                        console.log('CKEditor destroyed successfully');
                    })
                    .catch(error => {
                        console.error('CKEditor destroy failed:', error);
                        ckEditor = null;
                    })
                    .finally(() => {
                        // Her durumda class'ı kaldır ve textarea'yı eski haline getir
                        postForm.classList.remove('ckeditor-active');
                        const textarea = document.getElementById('post-content');
                        textarea.style.display = 'block';
                        textarea.setAttribute('required', 'required');
                    });
            } else {
                // CKEditor yoksa sadece class'ı kaldır ve textarea'yı normal haline getir
                postForm.classList.remove('ckeditor-active');
                const textarea = document.getElementById('post-content');
                textarea.style.display = 'block';
                textarea.setAttribute('required', 'required');
            }
        }

        originalCloseModal(modal);
    };

    // Edit fonksiyonunu güncelle - CKEditor'a content'i set et
    const originalHandleEdit = handleEdit;
    handleEdit = function (item, sectionName) {
        if (sectionName === 'posts') {
            document.querySelector('#post-modal h2').textContent = 'Blog Yazısını Düzenle';
            document.getElementById('post-id').value = item.id;
            document.getElementById('post-title').value = item.title;
            document.getElementById('post-author').value = item.author?.String || '';
            document.getElementById('post-service').value = item.service_id?.Int64 || '';

            openModal(postModal);

            // CKEditor yüklendikten sonra content'i set et
            setTimeout(() => {
                if (ckEditor && ckEditor.setData) {
                    try {
                        ckEditor.setData(item.content || '');
                    } catch (error) {
                        console.error('CKEditor setData failed:', error);
                        // Fallback olarak normal textarea'yı kullan
                        const textarea = document.getElementById('post-content');
                        textarea.style.display = 'block';
                        textarea.setAttribute('required', 'required');
                        textarea.value = item.content || '';
                    }
                } else {
                    // CKEditor hazır değilse normal textarea'yı kullan
                    const textarea = document.getElementById('post-content');
                    textarea.style.display = 'block';
                    textarea.setAttribute('required', 'required');
                    textarea.value = item.content || '';
                }
            }, 500);
        } else {
            originalHandleEdit(item, sectionName);
        }
    };

    // Ekip üyesi ekleme
    async function addTeamMember() {
        const name = document.getElementById('teamMemberName').value;
        const title = document.getElementById('teamMemberTitle').value;
        const bio = document.getElementById('teamMemberBio').value;
        const imageUrl = document.getElementById('teamMemberImageUrl').value;
        const imageFile = document.getElementById('teamMemberImageFile').files[0];

        if (!name || !title || !bio) {
            alert('Tüm alanları doldurun!');
            return;
        }

        let finalImageUrl = imageUrl;

        // Eğer dosya seçilmişse, önce dosyayı yükle
        if (imageFile) {
            try {
                const formData = new FormData();
                formData.append('file', imageFile);

                const uploadResponse = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: formData
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    finalImageUrl = uploadResult.url;
                } else {
                    const errorText = await uploadResponse.text();
                    alert('Dosya yükleme başarısız: ' + errorText);
                    return;
                }
            } catch (error) {
                alert('Dosya yükleme hatası: ' + error.message);
                return;
            }
        }

        // Şimdi ekip üyesini database'e ekle
        try {
            const response = await fetch('/api/admin/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    name,
                    title,
                    bio,
                    image_url: finalImageUrl
                })
            });

            if (response.ok) {
                loadSectionData('team');
                document.getElementById('teamMemberName').value = '';
                document.getElementById('teamMemberTitle').value = '';
                document.getElementById('teamMemberBio').value = '';
                document.getElementById('teamMemberImageUrl').value = '';
                document.getElementById('teamMemberImageFile').value = '';
                alert('Ekip üyesi başarıyla eklendi!');
            } else {
                alert('Ekip üyesi eklenirken hata oluştu!');
            }
        } catch (error) {
            alert('Bağlantı hatası: ' + error.message);
        }
    }
});

// === ICON SELECTOR ===
function initializeIconSelector() {
    const iconSelect = document.getElementById('service-icon');
    const iconPreview = document.getElementById('icon-preview');

    // Popüler FontAwesome ikonları
    const icons = [
        { class: 'fas fa-gavel', name: 'Tokmak (Hukuk)' },
        { class: 'fas fa-balance-scale', name: 'Adalet Terazisi' },
        { class: 'fas fa-briefcase', name: 'Çanta (İş)' },
        { class: 'fas fa-file-contract', name: 'Sözleşme' },
        { class: 'fas fa-shield-alt', name: 'Koruma' },
        { class: 'fas fa-handshake', name: 'Anlaşma' },
        { class: 'fas fa-building', name: 'Bina' },
        { class: 'fas fa-home', name: 'Ev' },
        { class: 'fas fa-heart', name: 'Kalp (Aile)' },
        { class: 'fas fa-users', name: 'Kişiler' },
        { class: 'fas fa-user-tie', name: 'İş Adamı' },
        { class: 'fas fa-laptop', name: 'Bilgisayar' },
        { class: 'fas fa-globe', name: 'Dünya' },
        { class: 'fas fa-money-bill', name: 'Para' },
        { class: 'fas fa-chart-line', name: 'Grafik' },
        { class: 'fas fa-cogs', name: 'Ayarlar' },
        { class: 'fas fa-university', name: 'Banka/Kurum' },
        { class: 'fas fa-car', name: 'Araba' },
        { class: 'fas fa-plane', name: 'Uçak' },
        { class: 'fas fa-ship', name: 'Gemi' },
        { class: 'fas fa-truck', name: 'Kamyon' },
        { class: 'fas fa-industry', name: 'Sanayi' },
        { class: 'fas fa-hammer', name: 'Çekiç' },
        { class: 'fas fa-wrench', name: 'İngiliz Anahtarı' },
        { class: 'fas fa-hard-hat', name: 'Baret' },
        { class: 'fas fa-stethoscope', name: 'Stetoskop' },
        { class: 'fas fa-pills', name: 'İlaç' },
        { class: 'fas fa-graduation-cap', name: 'Mezuniyet' },
        { class: 'fas fa-book', name: 'Kitap' },
        { class: 'fas fa-pen', name: 'Kalem' },
        { class: 'fas fa-clipboard', name: 'Pano' },
        { class: 'fas fa-folder', name: 'Klasör' },
        { class: 'fas fa-archive', name: 'Arşiv' },
        { class: 'fas fa-lock', name: 'Kilit' },
        { class: 'fas fa-key', name: 'Anahtar' },
        { class: 'fas fa-certificate', name: 'Sertifika' },
        { class: 'fas fa-award', name: 'Ödül' },
        { class: 'fas fa-star', name: 'Yıldız' },
        { class: 'fas fa-check', name: 'Onay' },
        { class: 'fas fa-times', name: 'İptal' },
        { class: 'fas fa-exclamation', name: 'Uyarı' },
        { class: 'fas fa-info', name: 'Bilgi' },
        { class: 'fas fa-question', name: 'Soru' },
        { class: 'fas fa-search', name: 'Arama' },
        { class: 'fas fa-eye', name: 'Göz' },
        { class: 'fas fa-phone', name: 'Telefon' },
        { class: 'fas fa-envelope', name: 'Mektup' },
        { class: 'fas fa-comments', name: 'Konuşma' },
        { class: 'fas fa-microphone', name: 'Mikrofon' }
    ];

    // Select box'ı doldur
    iconSelect.innerHTML = '<option value="">-- İkon Seçin --</option>';
    icons.forEach(icon => {
        const option = document.createElement('option');
        option.value = icon.class;
        option.textContent = `${icon.name}`;
        iconSelect.appendChild(option);
    });

    // Seçim değiştiğinde preview'ı güncelle
    iconSelect.addEventListener('change', function () {
        updateIconPreview(this.value);
    });

    // İlk yüklemede preview'ı temizle
    updateIconPreview('');
}

function updateIconPreview(iconClass) {
    const iconPreview = document.getElementById('icon-preview');

    if (!iconClass || iconClass === '') {
        iconPreview.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">İkon seçilmedi</span>';
        iconPreview.classList.remove('has-icon');
        return;
    }

    // İkon adını bul
    const iconSelect = document.getElementById('service-icon');
    const selectedOption = iconSelect.querySelector(`option[value="${iconClass}"]`);
    const iconName = selectedOption ? selectedOption.textContent : iconClass;

    iconPreview.innerHTML = `
        <i class="${iconClass}"></i>
        <div class="icon-name">${iconName}</div>
    `;
    iconPreview.classList.add('has-icon');
}

// === DYNAMIC LISTS MANAGEMENT ===
function initializeDynamicLists() {
    // Hizmet alanları listesi
    const addServiceAreaBtn = document.getElementById('add-service-area');
    const addSecondItemBtn = document.getElementById('add-second-item');

    if (addServiceAreaBtn) {
        addServiceAreaBtn.addEventListener('click', () => addServiceArea());
    }

    if (addSecondItemBtn) {
        addSecondItemBtn.addEventListener('click', () => addSecondItem());
    }

    // İlk yüklemede boş listeler göster
    updateServiceAreasList([]);
    updateSecondItemsList([]);
}

function addServiceArea(value = '') {
    const container = document.getElementById('service-areas-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'dynamic-item';

    itemDiv.innerHTML = `
        <input type="text" placeholder="Hizmet alanı girin..." value="${value}" required>
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
    `;

    container.appendChild(itemDiv);

    // Focus yeni eklenen input'a
    if (!value) {
        itemDiv.querySelector('input').focus();
    }

    // Boş mesajını kaldır
    removeEmptyMessage(container);
}

function addSecondItem(value = '') {
    const container = document.getElementById('service-second-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'dynamic-item';

    itemDiv.innerHTML = `
        <input type="text" placeholder="Madde girin..." value="${value}" required>
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
    `;

    container.appendChild(itemDiv);

    // Focus yeni eklenen input'a
    if (!value) {
        itemDiv.querySelector('input').focus();
    }

    // Boş mesajını kaldır
    removeEmptyMessage(container);
}

function removeItem(button) {
    const item = button.parentElement;
    const container = item.parentElement;
    item.remove();

    // Eğer liste boşsa, boş mesajı göster
    if (container.children.length === 0) {
        showEmptyMessage(container);
    }
}

function updateServiceAreasList(areas) {
    const container = document.getElementById('service-areas-container');
    container.innerHTML = '';

    if (areas && areas.length > 0) {
        areas.forEach(area => addServiceArea(area));
    } else {
        showEmptyMessage(container, 'Henüz hizmet alanı eklenmedi');
    }
}

function updateSecondItemsList(items) {
    const container = document.getElementById('service-second-items-container');
    container.innerHTML = '';

    if (items && items.length > 0) {
        items.forEach(item => addSecondItem(item));
    } else {
        showEmptyMessage(container, 'Henüz madde eklenmedi');
    }
}

function showEmptyMessage(container, message = 'Liste boş') {
    container.innerHTML = `<div class="empty-list">${message}</div>`;
}

function removeEmptyMessage(container) {
    const emptyMsg = container.querySelector('.empty-list');
    if (emptyMsg) {
        emptyMsg.remove();
    }
}

function getServiceAreasFromForm() {
    const inputs = document.querySelectorAll('#service-areas-container input');
    return Array.from(inputs).map(input => input.value.trim()).filter(value => value);
}

function getSecondItemsFromForm() {
    const inputs = document.querySelectorAll('#service-second-items-container input');
    return Array.from(inputs).map(input => input.value.trim()).filter(value => value);
}

