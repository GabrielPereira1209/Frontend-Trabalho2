"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// url base da api
const API_BASE_URL = 'http://localhost:8000/api';
// estado do usuario atual
let currentUser = null;
let currentSection = 'home';
let currentEditingSpotId = null;
// mostra uma notificacao toast na tela
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
// esconde a notificacao toast
function hideToast() {
    const toast = document.getElementById('toast');
    toast.className = 'toast';
}
// mostra indicador de carregamento em um container
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    const loading = document.getElementById('loading');
    if (container && loading) {
        container.innerHTML = '';
        loading.classList.remove('hidden');
    }
}
// oculta indicador de carregamento global
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}
// wrapper para chamadas fetch que trata headers, token e erros
function makeRequest(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, options = {}) {
        const token = localStorage.getItem('auth_token');
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        try {
            let endpoint = url;
            const [path, query] = endpoint.split('?');
            let fixedPath = path;
            if (!fixedPath.endsWith('/')) {
                fixedPath += '/';
            }
            endpoint = query ? `${fixedPath}?${query}` : fixedPath;
            const response = yield fetch(`${API_BASE_URL}${endpoint}`, Object.assign(Object.assign({}, options), { headers }));
            if (!response.ok) {
                const errorData = yield response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
            }
            return yield response.json();
        }
        catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    });
}
// atualiza elementos da interface conforme estado de autenticacao
function updateAuthState() {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const userName = document.getElementById('user-name');
    const mySpotsLink = document.getElementById('my-spots-link');
    const myRentalsLink = document.getElementById('my-rentals-link');
    const authLinks = document.querySelectorAll('.nav-link[href*="login"], .nav-link[href*="register"]');
    const userLinks = document.querySelectorAll('.nav-link[href*="profile"], .nav-link[href*="my-spots"], .nav-link[href*="my-rentals"]');
    if (currentUser) {
        if (navAuth)
            navAuth.classList.add('hidden');
        if (navUser)
            navUser.classList.remove('hidden');
        if (userName)
            userName.textContent = currentUser.name;
        authLinks.forEach(link => {
            link.style.display = 'none';
        });
        userLinks.forEach(link => {
            link.style.display = 'inline-block';
        });
        if (currentUser.user_type === 'landlord') {
            if (mySpotsLink)
                mySpotsLink.classList.remove('hidden');
            if (myRentalsLink)
                myRentalsLink.classList.add('hidden');
            const rentalsNavLink = document.querySelector('.nav-link[href*="my-rentals"]');
            const spotsNavLink = document.querySelector('.nav-link[href*="my-spots"]');
            if (rentalsNavLink)
                rentalsNavLink.style.display = 'none';
            if (spotsNavLink)
                spotsNavLink.style.display = 'inline-block';
            const ownerBtn = document.getElementById('owner-history-btn');
            if (ownerBtn)
                ownerBtn.style.display = 'inline-block';
        }
        else {
            if (mySpotsLink)
                mySpotsLink.classList.add('hidden');
            if (myRentalsLink)
                myRentalsLink.classList.remove('hidden');
            const spotsNavLink = document.querySelector('.nav-link[href*="my-spots"]');
            const rentalsNavLink = document.querySelector('.nav-link[href*="my-rentals"]');
            if (spotsNavLink)
                spotsNavLink.style.display = 'none';
            if (rentalsNavLink)
                rentalsNavLink.style.display = 'inline-block';
            const ownerBtn = document.getElementById('owner-history-btn');
            if (ownerBtn)
                ownerBtn.style.display = 'none';
        }
    }
    else {
        if (navAuth)
            navAuth.classList.remove('hidden');
        if (navUser)
            navUser.classList.add('hidden');
        authLinks.forEach(link => {
            link.style.display = 'inline-block';
        });
        userLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}
// verifica se ha token e busca dados do usuario autenticado
function checkAuthStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            currentUser = null;
            updateAuthState();
            return;
        }
        try {
            const user = yield makeRequest('/auth/me');
            currentUser = user;
            updateAuthState();
        }
        catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
            currentUser = null;
            updateAuthState();
        }
    });
}
// trata submissao do form de login
function handleLogin(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        try {
            const response = yield makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            localStorage.setItem('auth_token', response.access_token);
            currentUser = response.user;
            updateAuthState();
            showToast('Login realizado com sucesso!');
            form.reset();
        }
        catch (error) {
            showToast(error.message || 'Erro ao fazer login', 'error');
        }
    });
}
// trata criacao de nova conta
function handleRegister(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        if (password !== confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }
        const registerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            user_type: formData.get('user_type'),
            password: password
        };
        try {
            yield makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(registerData)
            });
            showToast('Conta criada com sucesso! Faça login para continuar.');
            form.reset();
        }
        catch (error) {
            showToast(error.message || 'Erro ao criar conta', 'error');
        }
    });
}
// trata envio de email de recuparacao
function handleForgotPassword(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        try {
            yield makeRequest('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            showToast('Link de recuperação enviado para seu email!');
            form.reset();
        }
        catch (error) {
            showToast(error.message || 'Erro ao enviar link de recuperação', 'error');
        }
    });
}
// realiza logout local removendo token
function logout() {
    localStorage.removeItem('auth_token');
    currentUser = null;
    updateAuthState();
    showToast('Logout realizado com sucesso!');
}
// carrega dados do perfil no formulario
function loadProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentUser) {
            yield checkAuthStatus();
            if (!currentUser) {
                showToast('Faça login para acessar o perfil', 'error');
                return;
            }
        }
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        const userTypeSelect = document.getElementById('profile-user-type');
        if (nameInput)
            nameInput.value = currentUser.name || '';
        if (emailInput)
            emailInput.value = currentUser.email || '';
        if (phoneInput)
            phoneInput.value = currentUser.phone || '';
        if (userTypeSelect)
            userTypeSelect.value = currentUser.user_type || '';
    });
}
// envia atualizacao do perfil para a api
function handleProfileUpdate(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const profileData = {
            name: formData.get('name'),
            phone: formData.get('phone')
        };
        try {
            const updatedUser = yield makeRequest('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            currentUser = updatedUser;
            updateAuthState();
            showToast('Perfil atualizado com sucesso!');
        }
        catch (error) {
            showToast(error.message || 'Erro ao atualizar perfil', 'error');
        }
    });
}
// abre modal para trocar senha
function changePassword() {
    const modal = document.getElementById('password-modal');
    modal.classList.add('show');
}
// fecha modal de troca de senha e reseta formulario
function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    const form = document.getElementById('password-form');
    modal.classList.remove('show');
    form.reset();
}
// processa alteracao de senha enviando para a api
function handlePasswordChange(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const newPassword = formData.get('new_password');
        const confirmNewPassword = formData.get('confirm_new_password');
        if (newPassword !== confirmNewPassword) {
            showToast('As novas senhas não coincidem', 'error');
            return;
        }
        const passwordData = {
            current_password: formData.get('current_password'),
            new_password: newPassword
        };
        try {
            yield makeRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify(passwordData)
            });
            showToast('Senha alterada com sucesso!');
            closePasswordModal();
        }
        catch (error) {
            showToast(error.message || 'Erro ao alterar senha', 'error');
        }
    });
}
// carrega lista de vagas com filtros opcionais
function loadSpots() {
    return __awaiter(this, arguments, void 0, function* (filters = {}) {
        const container = document.getElementById('spots-grid');
        if (container) {
            container.innerHTML = '<div class="loading">Carregando...</div>';
        }
        try {
            const queryParams = new URLSearchParams();
            if (filters.location)
                queryParams.append('location', filters.location);
            if (filters.type)
                queryParams.append('type', filters.type);
            if (filters.max_price)
                queryParams.append('max_price', filters.max_price);
            const endpoint = `/spots/?${queryParams.toString()}`;
            console.log('Fetching spots from endpoint:', endpoint);
            const spots = yield makeRequest(endpoint);
            console.log('loadSpots received:', spots);
            renderSpots(spots, 'spots-grid');
        }
        catch (error) {
            showToast(error.message || 'Erro ao carregar vagas', 'error');
            if (container) {
                container.innerHTML = '<p class="text-center">Erro ao carregar vagas</p>';
            }
        }
    });
}
// carrega vagas do proprietario atual (dashboard)
function loadMySpots() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentUser) {
            yield checkAuthStatus();
            if (!currentUser) {
                showToast('Faça login para ver suas vagas', 'error');
                return;
            }
        }
        if (currentUser.user_type !== 'landlord') {
            const container = document.getElementById('my-spots-grid');
            if (container) {
                container.innerHTML = '<p class="text-center">Apenas proprietários podem gerenciar vagas</p>';
            }
            return;
        }
        const container = document.getElementById('my-spots-grid');
        if (container) {
            container.innerHTML = '<div class="loading">Carregando...</div>';
        }
        try {
            const spots = yield makeRequest('/spots/my-spots/');
            let pendingMap;
            try {
                const rentals = yield makeRequest('/rentals/my-rentals/');
                pendingMap = {};
                (rentals || []).forEach((r) => {
                    if (r.status === 'pending' && r.spot && r.spot.id) {
                        const sid = String(r.spot.id);
                        pendingMap[sid] = (pendingMap[sid] || 0) + 1;
                    }
                });
            }
            catch (err) {
                console.debug('Could not load rentals for pending map', err);
                pendingMap = undefined;
            }
            renderSpots(spots, 'my-spots-grid', true, pendingMap);
        }
        catch (error) {
            showToast(error.message || 'Erro ao carregar suas vagas', 'error');
            if (container) {
                container.innerHTML = '<p class="text-center">Erro ao carregar suas vagas</p>';
            }
        }
    });
}
// renderiza cards de vagas dentro de um container
function renderSpots(spots, containerId, isOwner = false, pendingMap) {
    const container = document.getElementById(containerId);
    console.log(`renderSpots called for container="${containerId}" with spots:`, spots);
    console.debug('renderSpots currentUser:', currentUser);
    if (spots.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhuma vaga encontrada</p>';
        return;
    }
    container.innerHTML = spots.map(spot => {
        let spotIsOwner = false;
        if (isOwner) {
            spotIsOwner = true;
        }
        else if (currentUser) {
            const userId = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) !== undefined ? String(currentUser.id) : undefined;
            const userEmail = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.email) ? String(currentUser.email).toLowerCase().trim() : undefined;
            let ownerId;
            let ownerEmail;
            if (spot && typeof spot.owner === 'object' && spot.owner !== null) {
                ownerId = spot.owner.id !== undefined ? String(spot.owner.id) : undefined;
                ownerEmail = spot.owner.email !== undefined ? String(spot.owner.email).toLowerCase().trim() : undefined;
            }
            else {
                ownerId = spot.owner !== undefined && spot.owner !== null ? String(spot.owner) : undefined;
                ownerEmail = spot.owner_email ? String(spot.owner_email).toLowerCase().trim() : undefined;
            }
            if (userId && ownerId && ownerId === userId) {
                spotIsOwner = true;
            }
            else if (userEmail && ownerEmail && ownerEmail === userEmail) {
                spotIsOwner = true;
            }
            else if (userEmail && ownerId && ownerId === userEmail) {
                spotIsOwner = true;
            }
            if (!spotIsOwner) {
                console.debug('renderSpots ownership check: not owner', {
                    spotId: spot.id,
                    ownerRaw: spot.owner,
                    ownerId,
                    ownerEmail,
                    userId,
                    userEmail,
                    isOwnerFlag: isOwner
                });
            }
            else {
                console.debug('renderSpots ownership check: owner detected', { spotId: spot.id, ownerId, ownerEmail, userId, userEmail });
            }
        }
        const showOwnerActions = spotIsOwner && currentUser && currentUser.user_type === 'landlord';
        if (spotIsOwner && currentUser && currentUser.user_type !== 'landlord') {
            console.debug('renderSpots: owner detected but current user is not landlord — hiding owner actions', { spotId: spot.id, userType: currentUser.user_type });
        }
        const pendingCount = pendingMap && pendingMap[String(spot.id)] ? pendingMap[String(spot.id)] : 0;
        const showViewRequests = pendingCount > 0 && spotIsOwner && currentUser && currentUser.user_type === 'landlord';
        let actions;
        if (showViewRequests) {
            actions = `
                <button class="btn btn-outline" onclick="window.location.href='my-rentals.html'">Ver pedidos (${pendingCount})</button>
            `;
        }
        else if (showOwnerActions) {
            actions = `
                <button class="btn btn-secondary" onclick="editSpot('${spot.id}')">Editar</button>
                <button class="btn btn-danger" onclick="deleteSpot('${spot.id}')">Excluir</button>
            `;
        }
        else {
            actions = spot.available ? `
                <button class="btn btn-primary" onclick="rentSpot('${spot.id}')">Alugar</button>
            ` : `
                <button class="btn btn-secondary" disabled>Indisponível</button>
            `;
        }
        return `
        <div class="spot-card" data-id="${spot.id}" data-price="${spot.price}">
            <div class="spot-card-image">🅿️</div>
            <div class="spot-card-content">
                <h3>${spot.title}</h3>
                <p>${spot.description}</p>
                <div class="spot-location">${spot.location}</div>
                <div class="spot-details">
                    <span class="spot-price">R$ ${spot.price.toFixed(2)}/mês</span>
                    <span class="spot-type">${getTypeLabel(spot.type)}</span>
                </div>
                <div class="spot-actions">
                    ${actions}
                </div>
            </div>
        </div>
    `;
    }).join('');
}
// retorna label legivel para o tipo da vaga
function getTypeLabel(type) {
    const labels = {
        'covered': 'Coberta',
        'uncovered': 'Descoberta',
        'garage': 'Garagem'
    };
    return labels[type] || type;
}
// monta filtros e dispara busca de vagas
function searchSpots() {
    const location = document.getElementById('search-location').value;
    const type = document.getElementById('search-type').value;
    const maxPrice = document.getElementById('search-max-price').value;
    const filters = {};
    if (location)
        filters.location = location;
    if (type)
        filters.type = type;
    if (maxPrice)
        filters.max_price = maxPrice;
    loadSpots(filters);
}
// abre modal para adicionar uma nova vaga
function showAddSpotModal() {
    if (!currentUser) {
        showToast('Faça login para adicionar uma vaga', 'error');
        return;
    }
    currentEditingSpotId = null;
    const modal = document.getElementById('spot-modal');
    const title = document.getElementById('spot-modal-title');
    const form = document.getElementById('spot-form');
    title.textContent = 'Adicionar Vaga';
    form.reset();
    modal.classList.add('show');
}
// carrega dados de uma vaga para edicao
function editSpot(spotId) {
    return __awaiter(this, void 0, void 0, function* () {
        currentEditingSpotId = spotId;
        try {
            const spot = yield makeRequest(`/spots/${spotId}/`);
            const modal = document.getElementById('spot-modal');
            const title = document.getElementById('spot-modal-title');
            title.textContent = 'Editar Vaga';
            document.getElementById('spot-title').value = spot.title;
            document.getElementById('spot-description').value = spot.description;
            document.getElementById('spot-location').value = spot.location;
            document.getElementById('spot-type').value = spot.type;
            document.getElementById('spot-price').value = spot.price;
            document.getElementById('spot-available').value = spot.available.toString();
            modal.classList.add('show');
        }
        catch (error) {
            showToast(error.message || 'Erro ao carregar vaga', 'error');
        }
    });
}
// fecha modal de vaga e reseta estado
function closeSpotModal() {
    const modal = document.getElementById('spot-modal');
    const form = document.getElementById('spot-form');
    modal.classList.remove('show');
    form.reset();
    currentEditingSpotId = null;
}
// envia criacao ou atualizacao de vaga para a api
function handleSpotSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const spotData = {
            title: formData.get('title'),
            description: formData.get('description'),
            location: formData.get('location'),
            type: formData.get('type'),
            price: parseFloat(formData.get('price')),
            available: formData.get('available') === 'true'
        };
        try {
            if (currentEditingSpotId) {
                yield makeRequest(`/spots/${currentEditingSpotId}/`, {
                    method: 'PUT',
                    body: JSON.stringify(spotData)
                });
                showToast('Vaga atualizada com sucesso!');
            }
            else {
                yield makeRequest('/spots/', {
                    method: 'POST',
                    body: JSON.stringify(spotData)
                });
                showToast('Vaga adicionada com sucesso!');
            }
            closeSpotModal();
            const currentPath = window.location.pathname;
            if (currentPath.includes('my-spots.html')) {
                loadMySpots();
            }
            else if (currentPath.includes('search.html')) {
                loadSpots();
            }
        }
        catch (error) {
            showToast(error.message || 'Erro ao salvar vaga', 'error');
        }
    });
}
// exclui vaga por id apos confirmacao
function deleteSpot(spotId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Tem certeza que deseja excluir esta vaga?')) {
            return;
        }
        try {
            yield makeRequest(`/spots/${spotId}/`, { method: 'DELETE' });
            showToast('Vaga excluída com sucesso!');
            loadMySpots();
        }
        catch (error) {
            showToast(error.message || 'Erro ao excluir vaga', 'error');
        }
    });
}
// inicia fluxo para solicitar aluguel de uma vaga
function rentSpot(spotId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentUser) {
            showToast('Faça login para alugar uma vaga', 'error');
            return;
        }
        if (currentUser.user_type !== 'tenant') {
            showToast('Apenas locatários podem alugar vagas', 'error');
            return;
        }
        openRentModal(spotId);
    });
}
// abre modal de solicitacao de aluguel e preenche preco
function openRentModal(spotId, price) {
    const modal = document.getElementById('rent-modal');
    const title = document.getElementById('rent-modal-title');
    const spotIdInput = document.getElementById('rent-spot-id');
    title.textContent = 'Solicitar Aluguel';
    if (spotIdInput)
        spotIdInput.value = spotId;
    const priceElem = document.getElementById('rent-price-month');
    let usedPrice = 0;
    if (typeof price === 'number') {
        usedPrice = price;
    }
    else {
        const spotCard = document.querySelector(`.spot-card[data-id="${spotId}"]`);
        if (spotCard) {
            const priceAttr = spotCard.getAttribute('data-price');
            usedPrice = priceAttr ? parseFloat(priceAttr) : 0;
        }
    }
    if (priceElem) {
        priceElem.textContent = `R$ ${usedPrice.toFixed(2)}`;
        priceElem._price = usedPrice;
    }
    modal.classList.add('show');
    const start = document.getElementById('rent-start');
    const end = document.getElementById('rent-end');
    [start, end].forEach(el => {
        if (el) {
            el.addEventListener('change', calculateRentTotal);
            el.addEventListener('focus', () => {
                rentCalendarActiveInput = el;
                const sid = document.getElementById('rent-spot-id').value;
                ensureBookingsAndRenderCalendar(sid).catch(err => console.debug('calendar load err', err));
            });
        }
    });
    calculateRentTotal();
}
// fecha modal de aluguel e limpa campos temporarios
function closeRentModal() {
    const modal = document.getElementById('rent-modal');
    const form = document.getElementById('rent-form');
    modal.classList.remove('show');
    form.reset();
    window._calendarSelection = { start: null, end: null };
    rentCalendarActiveInput = null;
    const priceElem = document.getElementById('rent-price-month');
    if (priceElem) {
        priceElem.textContent = 'R$ 0,00';
        priceElem._price = 0;
    }
    const duration = document.getElementById('rent-duration');
    if (duration)
        duration.textContent = '0 dias';
    const total = document.getElementById('rent-total');
    if (total)
        total.textContent = 'R$ 0,00';
}
// calcula duracao e total estimado com base nas datas e preco mensal
function calculateRentTotal() {
    const start = document.getElementById('rent-start').value;
    const end = document.getElementById('rent-end').value;
    const priceElem = document.getElementById('rent-price-month');
    const durationElem = document.getElementById('rent-duration');
    const totalElem = document.getElementById('rent-total');
    const price = priceElem ? priceElem._price || 0 : 0;
    if (!start || !end) {
        if (durationElem)
            durationElem.textContent = '0 dias';
        if (totalElem)
            totalElem.textContent = 'R$ 0,00';
        return;
    }
    const s = parseDateSafe(start);
    const e = parseDateSafe(end);
    if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
        if (durationElem)
            durationElem.textContent = 'Período inválido';
        if (totalElem)
            totalElem.textContent = 'R$ 0,00';
        return;
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((e.getTime() - s.getTime()) / msPerDay);
    if (durationElem)
        durationElem.textContent = `${days} dias`;
    const dailyPrice = price / 30;
    const total = dailyPrice * days;
    if (totalElem)
        totalElem.textContent = `R$ ${total.toFixed(2)}`;
}
// submete pedido de aluguel checando disponibilidade localmente
function submitRentRequest(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        if (!currentUser) {
            showToast('Faça login antes de solicitar aluguel', 'error');
            return;
        }
        if (currentUser.user_type !== 'tenant') {
            showToast('Apenas locatários podem solicitar aluguéis', 'error');
            return;
        }
        const spotId = document.getElementById('rent-spot-id').value;
        const start = document.getElementById('rent-start').value;
        const end = document.getElementById('rent-end').value;
        if (!spotId || !start || !end) {
            showToast('Preencha as datas corretamente', 'error');
            return;
        }
        const s = parseDateSafe(start);
        const e = parseDateSafe(end);
        if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
            showToast('Período inválido: a data final deve ser posterior à inicial', 'error');
            return;
        }
        try {
            try {
                const existing = (yield makeRequest(`/rentals/?spot_id=${spotId}`)) || [];
                console.debug('submitRentRequest: existing rentals for spot', { spotId, existing });
                const overlaps = existing.filter(r => r.status === 'active' && r.start_date && r.end_date).some(r => {
                    const rs = parseDateSafe(r.start_date);
                    const re = parseDateSafe(r.end_date);
                    if (!rs || !re)
                        return false;
                    return s <= re && rs <= e;
                });
                if (overlaps) {
                    showToast('Período indisponível: já existe reserva ativa para parte desse intervalo', 'error');
                    return;
                }
            }
            catch (err) {
                console.debug('submitRentRequest: could not verify availability', err);
            }
            yield makeRequest('/rentals/', {
                method: 'POST',
                body: JSON.stringify({ spot_id: spotId, start_date: start, end_date: end })
            });
            showToast('Solicitação de aluguel enviada com sucesso!');
            closeRentModal();
            loadSpots();
        }
        catch (error) {
            showToast(error.message || 'Erro ao solicitar aluguel', 'error');
        }
    });
}
// carrega aluguels do usuario atual (inquilino ou proprietario)
function loadMyRentals() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentUser) {
            yield checkAuthStatus();
            if (!currentUser) {
                showToast('Faça login para ver seus aluguéis', 'error');
                return;
            }
        }
        const container = document.getElementById('my-rentals-list');
        if (container) {
            container.innerHTML = '<div class="loading">Carregando...</div>';
        }
        try {
            const rentals = yield makeRequest('/rentals/my-rentals/');
            renderRentals(rentals);
        }
        catch (error) {
            showToast(error.message || 'Erro ao carregar aluguéis', 'error');
            if (container) {
                container.innerHTML = '<p class="text-center">Erro ao carregar aluguéis</p>';
            }
        }
    });
}
// carrega historico de reservas para o proprietario
function loadOwnerHistory() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentUser) {
            yield checkAuthStatus();
            if (!currentUser) {
                showToast('Faça login para ver o histórico do proprietário', 'error');
                return;
            }
        }
        if (currentUser.user_type !== 'landlord') {
            const container = document.getElementById('owner-history-list');
            if (container)
                container.innerHTML = '<p class="text-center">Apenas proprietários têm acesso a este painel</p>';
            return;
        }
        const container = document.getElementById('owner-history-list');
        if (container)
            container.innerHTML = '<div class="loading">Carregando...</div>';
        try {
            const rentals = yield makeRequest('/rentals/owner-history/');
            window._ownerHistoryCache = rentals || [];
            renderOwnerHistory(rentals || []);
        }
        catch (error) {
            showToast(error.message || 'Erro ao carregar histórico do proprietário', 'error');
            if (container)
                container.innerHTML = '<p class="text-center">Erro ao carregar histórico</p>';
        }
    });
}
// renderiza painel com historico de reservas do proprietario
function renderOwnerHistory(rentals) {
    const container = document.getElementById('owner-history-list');
    if (!rentals || rentals.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhuma solicitação encontrada</p>';
        return;
    }
    container.innerHTML = rentals.map(rental => {
        const actions = rental.status === 'pending' ? `
            <div class="rental-actions">
                <button class="btn btn-primary" onclick="acceptRental('${rental.id}')">Aceitar</button>
                <button class="btn btn-secondary" onclick="rejectRental('${rental.id}')">Recusar</button>
            </div>
        ` : '';
        const s = parseDateSafe(rental.start_date);
        const e = parseDateSafe(rental.end_date);
        const msPerDay = 1000 * 60 * 60 * 24;
        let days = 0;
        if (s && e && !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
            days = Math.ceil((e.getTime() - s.getTime()) / msPerDay);
        }
        const total = days > 0 ? (rental.monthly_price / 30) * days : rental.monthly_price;
        return `
        <div class="rental-card">
            <div class="rental-info">
                <h3>${rental.spot.title} <small class="muted">(ID: ${rental.spot.id})</small></h3>
                <p>📍 ${rental.spot.location}</p>
                <p>Solicitante: ${rental.tenant_name || rental.tenant}</p>
                <p>💰 R$ ${rental.monthly_price.toFixed(2)}/mês</p>
                <p>Estimativa prevista: <strong>R$ ${total.toFixed(2)}</strong> para ${days} dias</p>
                <p>📅 ${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</p>
                <p class="muted">Criado em: ${formatDate(rental.created_at || rental.start_date)}</p>
            </div>
            <div class="rental-status ${rental.status}">${getStatusLabel(rental.status)}</div>
            ${actions}
        </div>
    `;
    }).join('');
}
// filtra historico do proprietario por status
function filterOwnerHistory(status) {
    const all = window._ownerHistoryCache || [];
    if (status === 'all') {
        renderOwnerHistory(all);
    }
    else {
        renderOwnerHistory(all.filter(r => r.status === status));
    }
}
// renderiza lista de alugueis do usuario
function renderRentals(rentals) {
    const container = document.getElementById('my-rentals-list');
    if (rentals.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhum aluguel encontrado</p>';
        return;
    }
    container.innerHTML = rentals.map(rental => {
        const isLandlord = currentUser && currentUser.user_type === 'landlord';
        const actions = isLandlord && rental.status === 'pending' ? `
            <div class="rental-actions">
                <button class="btn btn-primary" onclick="acceptRental('${rental.id}')">Aceitar</button>
                <button class="btn btn-secondary" onclick="rejectRental('${rental.id}')">Recusar</button>
            </div>
        ` : '';
        return `
        <div class="rental-card">
            <div class="rental-info">
                <h3>${rental.spot.title}</h3>
                <p>📍 ${rental.spot.location}</p>
                <p>💰 R$ ${rental.monthly_price.toFixed(2)}/mês</p>
                <p>📅 ${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</p>
            </div>
            <div class="rental-status ${rental.status}">${getStatusLabel(rental.status)}</div>
            ${actions}
        </div>
    `;
    }).join('');
}
// aceita uma solicitacao de aluguel alterando status para active
function acceptRental(rentalId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Aceitar este pedido de aluguel?'))
            return;
        try {
            yield makeRequest(`/rentals/${rentalId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'active' })
            });
            showToast('Reserva aceita.');
            yield loadMyRentals();
        }
        catch (error) {
            showToast(error.message || 'Erro ao aceitar reserva', 'error');
        }
    });
}
// recusa uma solicitacao de aluguel alterando status para cancelled
function rejectRental(rentalId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Recusar este pedido de aluguel?'))
            return;
        try {
            yield makeRequest(`/rentals/${rentalId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'cancelled' })
            });
            showToast('Reserva recusada.');
            yield loadMyRentals();
        }
        catch (error) {
            showToast(error.message || 'Erro ao recusar reserva', 'error');
        }
    });
}
// retorna label legivel para status de aluguel
function getStatusLabel(status) {
    const labels = {
        'active': 'Ativo',
        'pending': 'Pendente',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}
// formata uma string de data para formato local pt-BR
function formatDate(dateString) {
    const d = parseDateSafe(dateString);
    if (!d || isNaN(d.getTime()))
        return String(dateString || '');
    return d.toLocaleDateString('pt-BR');
}
// converte varias representacoes de data para objeto Date com cuidado de timezone
function parseDateSafe(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number') {
        return value < 1e12 ? new Date(value * 1000) : new Date(value);
    }
    if (typeof value === 'string') {
        const s = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            return new Date(s + 'T00:00:00');
        }
        if (/^\d+$/.test(s)) {
            const n = parseInt(s, 10);
            return n < 1e12 ? new Date(n * 1000) : new Date(n);
        }
        const parsed = new Date(s);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}
// formata Date para string iso local no formato yyyy-mm-dd
function formatISODate(d) {
    const y = d.getFullYear();
    const pad2 = (n) => (n < 10 ? '0' + n : String(n));
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
}
// busca reservas ativas por vaga e monta cache por dia
function loadBookingsForSpot(spotId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rentals = (yield makeRequest(`/rentals/?spot_id=${spotId}`)) || [];
            const booked = new Set();
            const infoMap = {};
            (rentals || []).forEach(r => {
                if (r.status !== 'active')
                    return;
                const rs = parseDateSafe(r.start_date);
                const re = parseDateSafe(r.end_date);
                if (!rs || !re)
                    return;
                const cur = new Date(rs.getTime());
                while (cur <= re) {
                    const iso = formatISODate(cur);
                    booked.add(iso);
                    infoMap[iso] = { tenant: r.tenant, tenant_name: r.tenant_name, start_date: r.start_date, end_date: r.end_date };
                    cur.setDate(cur.getDate() + 1);
                }
            });
            window._spotBookingsCache = window._spotBookingsCache || {};
            window._spotBookingsCache[spotId] = booked;
            window._spotBookingsInfo = window._spotBookingsInfo || {};
            window._spotBookingsInfo[spotId] = infoMap;
            return booked;
        }
        catch (err) {
            console.debug('loadBookingsForSpot failed', err);
            return new Set();
        }
    });
}
let rentCalendarActiveInput = null;
let rentCalendarMonthOffset = 0;
// injeta estilos do calendario quando necessario
function ensureRentCalendarStyles() {
    if (document.getElementById('rent-calendar-styles'))
        return;
    const style = document.createElement('style');
    style.id = 'rent-calendar-styles';
    style.textContent = `
    .rent-calendar { border:1px solid #ddd; padding:6px; background:#fff; max-width:520px; max-height:260px; overflow:auto; margin:6px auto; font-size:13px }
    .rent-calendar .cal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
    .cal-two{display:flex;gap:8px;flex-wrap:wrap}
    .cal-month{flex:1;min-width:200px}
    .cal-caption{font-weight:600;margin-bottom:6px;font-size:14px}
    .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
    .rent-day{padding:6px 4px;text-align:center;cursor:pointer;border-radius:4px;line-height:1}
    .rent-day.head{background:transparent;cursor:default;font-weight:600}
    .rent-day.booked{background:#fdecea;color:#721c24;cursor:not-allowed}
    .rent-day.available{background:#eaf8ef;color:#155724}
    .rent-day.other-month{opacity:0.4}
    .rent-day.today{outline:2px solid #007bff}
    .rent-day.selected-start{box-shadow:0 0 0 2px #0d6efd inset;background:#0d6efd;color:#fff}
    .rent-day.selected-end{box-shadow:0 0 0 2px #0d6efd inset;background:#0d6efd;color:#fff}
    .rent-day.in-range{background:rgba(13,110,253,0.12)}
    `;
    document.head.appendChild(style);
}
// renderiza calendario compacto dentro do modal permitindo selecao de intervalo
function renderCalendarModal(spotId) {
    ensureRentCalendarStyles();
    const modal = document.getElementById('rent-modal');
    if (!modal)
        return;
    let container = document.getElementById('rent-calendar');
    const form = document.getElementById('rent-form');
    if (!container) {
        container = document.createElement('div');
        container.id = 'rent-calendar';
        container.className = 'rent-calendar';
        if (form) {
            const spotHidden = form.querySelector('#rent-spot-id');
            if (spotHidden && spotHidden.parentElement) {
                spotHidden.insertAdjacentElement('afterend', container);
            }
            else {
                form.insertBefore(container, form.firstElementChild);
            }
        }
    }
    else {
        if (form) {
            const spotHidden = form.querySelector('#rent-spot-id');
            if (spotHidden && spotHidden.parentElement && container.parentElement !== spotHidden.parentElement) {
                spotHidden.insertAdjacentElement('afterend', container);
            }
        }
    }
    const booked = (window._spotBookingsCache || {})[spotId] || new Set();
    const today = new Date();
    const base1 = new Date(today.getFullYear(), today.getMonth() + rentCalendarMonthOffset, 1);
    container.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'cal-header';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.textContent = '<';
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '>';
    const title = document.createElement('div');
    title.textContent = `${base1.toLocaleString('pt-BR', { month: 'long' })} ${base1.getFullYear()}`;
    prev.addEventListener('click', () => { rentCalendarMonthOffset -= 1; renderCalendarModal(spotId); });
    next.addEventListener('click', () => { rentCalendarMonthOffset += 1; renderCalendarModal(spotId); });
    header.appendChild(prev);
    header.appendChild(title);
    header.appendChild(next);
    container.appendChild(header);
    const wrapper = document.createElement('div');
    wrapper.className = 'cal-one';
    container.appendChild(wrapper);
    const months = [base1];
    window._calendarSelection = window._calendarSelection || { start: null, end: null };
    const sel = window._calendarSelection;
    months.forEach((base) => {
        const monthBox = document.createElement('div');
        monthBox.className = 'cal-month';
        const caption = document.createElement('div');
        caption.className = 'cal-caption';
        caption.textContent = `${base.toLocaleString('pt-BR', { month: 'long' })} ${base.getFullYear()}`;
        monthBox.appendChild(caption);
        const dow = document.createElement('div');
        dow.className = 'cal-grid';
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        daysOfWeek.forEach(d => {
            const el = document.createElement('div');
            el.className = 'rent-day head';
            el.style.fontWeight = '600';
            el.textContent = d;
            dow.appendChild(el);
        });
        const year = base.getFullYear();
        const month = base.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const startDate = new Date(year, month, 1 - firstWeekday);
        for (let i = 0; i < 42; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
            const iso = formatISODate(d);
            const cell = document.createElement('div');
            cell.className = 'rent-day';
            if (d.getMonth() !== month)
                cell.classList.add('other-month');
            if (iso === formatISODate(new Date()))
                cell.classList.add('today');
            const isBooked = booked.has(iso);
            if (isBooked)
                cell.classList.add('booked');
            if (sel.start && sel.start === iso)
                cell.classList.add('selected-start');
            if (sel.end && sel.end === iso)
                cell.classList.add('selected-end');
            if (sel.start && sel.end && sel.start <= iso && iso <= sel.end)
                cell.classList.add('in-range');
            cell.textContent = String(d.getDate());
            const nowIso = formatISODate(new Date());
            const infoMapForSpot = (window._spotBookingsInfo || {})[spotId] || {};
            if (isBooked) {
                const info = infoMapForSpot[iso];
                const text = info ? `${info.tenant_name || info.tenant || 'Reservado'}: ${info.start_date} → ${info.end_date}` : 'Reservado';
                cell.setAttribute('title', text);
            }
            if (!isBooked && iso >= nowIso) {
                cell.classList.add('available');
                cell.addEventListener('click', () => {
                    if (!rentCalendarActiveInput)
                        rentCalendarActiveInput = document.getElementById('rent-start');
                    if (!sel.start || (sel.start && sel.end)) {
                        sel.start = iso;
                        sel.end = null;
                    }
                    else {
                        if (iso < sel.start) {
                            sel.end = sel.start;
                            sel.start = iso;
                        }
                        else {
                            sel.end = iso;
                        }
                    }
                    if (sel.start && sel.end) {
                        const ds = parseDateSafe(sel.start);
                        const de = parseDateSafe(sel.end);
                        let cur2 = new Date(ds.getTime());
                        let blocked = false;
                        while (cur2 <= de) {
                            if (booked.has(formatISODate(cur2))) {
                                blocked = true;
                                break;
                            }
                            cur2.setDate(cur2.getDate() + 1);
                        }
                        if (blocked) {
                            showToast('Seleção inválida: o intervalo inclui dias já reservados', 'error');
                            sel.end = null;
                            const startInput = document.getElementById('rent-start');
                            const endInput = document.getElementById('rent-end');
                            if (startInput)
                                startInput.value = sel.start || '';
                            if (endInput)
                                endInput.value = sel.end || '';
                            renderCalendarModal(spotId);
                            return;
                        }
                    }
                    const startInput = document.getElementById('rent-start');
                    const endInput = document.getElementById('rent-end');
                    if (startInput)
                        startInput.value = sel.start || '';
                    if (endInput)
                        endInput.value = sel.end || '';
                    calculateRentTotal();
                    renderCalendarModal(spotId);
                });
            }
            dow.appendChild(cell);
        }
        monthBox.appendChild(dow);
        wrapper.appendChild(monthBox);
    });
    const controls = document.createElement('div');
    controls.style.marginTop = '6px';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = 'Limpar seleção';
    clearBtn.addEventListener('click', () => {
        window._calendarSelection = { start: null, end: null };
        const si = document.getElementById('rent-start');
        const ei = document.getElementById('rent-end');
        if (si)
            si.value = '';
        if (ei)
            ei.value = '';
        calculateRentTotal();
        renderCalendarModal(spotId);
    });
    controls.appendChild(clearBtn);
    container.appendChild(controls);
}
// garante cache de bookings e renderiza calendario fresquinho
function ensureBookingsAndRenderCalendar(spotId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadBookingsForSpot(spotId);
        rentCalendarMonthOffset = 0;
        renderCalendarModal(spotId);
    });
}
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    yield checkAuthStatus();
    const currentPath = window.location.pathname;
    if (currentPath.includes('search.html')) {
        yield loadSpots();
    }
    else if (currentPath.includes('my-spots.html')) {
        yield loadMySpots();
    }
    else if (currentPath.includes('my-rentals.html')) {
        yield loadMyRentals();
    }
    else if (currentPath.includes('profile.html')) {
        yield loadProfile();
    }
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');
    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            userMenu.classList.remove('show');
        });
    }
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    const searchInputs = ['search-location', 'search-max-price'];
    searchInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (typeof searchSpots === 'function') {
                        searchSpots();
                    }
                }
            });
        }
    });
}));
window.editSpot = editSpot;
window.deleteSpot = deleteSpot;
window.rentSpot = rentSpot;
window.showAddSpotModal = showAddSpotModal;
window.closeSpotModal = closeSpotModal;
window.loadOwnerHistory = loadOwnerHistory;
window.filterOwnerHistory = filterOwnerHistory;
window.openRentModal = openRentModal;
window.closeRentModal = closeRentModal;
window.submitRentRequest = submitRentRequest;
