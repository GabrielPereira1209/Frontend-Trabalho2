// url base da api
const API_BASE_URL = 'http://localhost:8000/api'; 

// estado do usuario atual
let currentUser: any = null;
let currentSection: string = 'home';
let currentEditingSpotId: string | null = null;

// tipo que representa um usuario
interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    user_type: 'tenant' | 'landlord';
}

// tipo que representa uma vaga
interface Spot {
    id: string;
    title: string;
    description: string;
    location: string;
    type: 'covered' | 'uncovered' | 'garage';
    price: number;
    available: boolean;
    owner: string;
    owner_name?: string;
    owner_email?: string;
}

// tipo que representa um aluguel/solicitacao
interface Rental {
    id: string;
    spot: Spot;
    tenant: string;
    tenant_name: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'pending' | 'cancelled';
    monthly_price: number;
}

// mostra uma notificacao toast na tela
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.getElementById('toast') as HTMLElement;
    const toastMessage = document.getElementById('toast-message') as HTMLElement;
    
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// esconde a notificacao toast
function hideToast(): void {
    const toast = document.getElementById('toast') as HTMLElement;
    toast.className = 'toast';
}

// mostra indicador de carregamento em um container
function showLoading(containerId: string): void {
    const container = document.getElementById(containerId);
    const loading = document.getElementById('loading');
    if (container && loading) {
        container.innerHTML = '';
        loading.classList.remove('hidden');
    }
}

// oculta indicador de carregamento global
function hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

// wrapper para chamadas fetch que trata headers, token e erros
async function makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
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
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error: any) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// atualiza elementos da interface conforme estado de autenticacao
function updateAuthState(): void {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const userName = document.getElementById('user-name');
    const mySpotsLink = document.getElementById('my-spots-link');
    const myRentalsLink = document.getElementById('my-rentals-link');
    
    const authLinks = document.querySelectorAll('.nav-link[href*="login"], .nav-link[href*="register"]');
    const userLinks = document.querySelectorAll('.nav-link[href*="profile"], .nav-link[href*="my-spots"], .nav-link[href*="my-rentals"]');
    
    if (currentUser) {
        if (navAuth) navAuth.classList.add('hidden');
        if (navUser) navUser.classList.remove('hidden');
        if (userName) userName.textContent = currentUser.name;
        
        authLinks.forEach(link => {
            (link as HTMLElement).style.display = 'none';
        });
        
        userLinks.forEach(link => {
            (link as HTMLElement).style.display = 'inline-block';
        });
        
        if (currentUser.user_type === 'landlord') {
            if (mySpotsLink) mySpotsLink.classList.remove('hidden');
            if (myRentalsLink) myRentalsLink.classList.add('hidden');
            
            const rentalsNavLink = document.querySelector('.nav-link[href*="my-rentals"]') as HTMLElement;
            const spotsNavLink = document.querySelector('.nav-link[href*="my-spots"]') as HTMLElement;
            if (rentalsNavLink) rentalsNavLink.style.display = 'none';
            if (spotsNavLink) spotsNavLink.style.display = 'inline-block';
            const ownerBtn = document.getElementById('owner-history-btn');
            if (ownerBtn) ownerBtn.style.display = 'inline-block';
        } else {
            if (mySpotsLink) mySpotsLink.classList.add('hidden');
            if (myRentalsLink) myRentalsLink.classList.remove('hidden');
            
            const spotsNavLink = document.querySelector('.nav-link[href*="my-spots"]') as HTMLElement;
            const rentalsNavLink = document.querySelector('.nav-link[href*="my-rentals"]') as HTMLElement;
            if (spotsNavLink) spotsNavLink.style.display = 'none';
            if (rentalsNavLink) rentalsNavLink.style.display = 'inline-block';
            const ownerBtn = document.getElementById('owner-history-btn');
            if (ownerBtn) ownerBtn.style.display = 'none';
        }
    } else {
        if (navAuth) navAuth.classList.remove('hidden');
        if (navUser) navUser.classList.add('hidden');
        
        authLinks.forEach(link => {
            (link as HTMLElement).style.display = 'inline-block';
        });
        
        userLinks.forEach(link => {
            (link as HTMLElement).style.display = 'none';
        });
    }
}

// verifica se ha token e busca dados do usuario autenticado
async function checkAuthStatus(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        currentUser = null;
        updateAuthState();
        return;
    }
    
    try {
        const user = await makeRequest('/auth/me');
        currentUser = user;
        updateAuthState();
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        currentUser = null;
        updateAuthState();
    }
}

// trata submissao do form de login
async function handleLogin(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const loginData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string
    };
    
    try {
        const response = await makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });
        
        localStorage.setItem('auth_token', response.access_token);
        currentUser = response.user;
        updateAuthState();
        showToast('Login realizado com sucesso!');
        form.reset();
    } catch (error: any) {
        showToast(error.message || 'Erro ao fazer login', 'error');
    }
}

// trata criacao de nova conta
async function handleRegister(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    const registerData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        user_type: formData.get('user_type') as string,
        password: password
    };
    
    try {
        await makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        showToast('Conta criada com sucesso! Faça login para continuar.');
        form.reset();
    } catch (error: any) {
        showToast(error.message || 'Erro ao criar conta', 'error');
    }
}

// trata envio de email de recuparacao
async function handleForgotPassword(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    
    try {
        await makeRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        showToast('Link de recuperação enviado para seu email!');
        form.reset();
    } catch (error: any) {
        showToast(error.message || 'Erro ao enviar link de recuperação', 'error');
    }
}

// realiza logout local removendo token
function logout(): void {
    localStorage.removeItem('auth_token');
    currentUser = null;
    updateAuthState();
    showToast('Logout realizado com sucesso!');
}

// carrega dados do perfil no formulario
async function loadProfile(): Promise<void> {
    if (!currentUser) {
        await checkAuthStatus();
        if (!currentUser) {
            showToast('Faça login para acessar o perfil', 'error');
            return;
        }
    }
    
    const nameInput = document.getElementById('profile-name') as HTMLInputElement;
    const emailInput = document.getElementById('profile-email') as HTMLInputElement;
    const phoneInput = document.getElementById('profile-phone') as HTMLInputElement;
    const userTypeSelect = document.getElementById('profile-user-type') as HTMLSelectElement;
    
    if (nameInput) nameInput.value = currentUser.name || '';
    if (emailInput) emailInput.value = currentUser.email || '';
    if (phoneInput) phoneInput.value = currentUser.phone || '';
    if (userTypeSelect) userTypeSelect.value = currentUser.user_type || '';
}

// envia atualizacao do perfil para a api
async function handleProfileUpdate(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const profileData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string
    };
    
    try {
        const updatedUser = await makeRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        currentUser = updatedUser;
        updateAuthState();
        showToast('Perfil atualizado com sucesso!');
    } catch (error: any) {
        showToast(error.message || 'Erro ao atualizar perfil', 'error');
    }
}

// abre modal para trocar senha
function changePassword(): void {
    const modal = document.getElementById('password-modal') as HTMLElement;
    modal.classList.add('show');
}

// fecha modal de troca de senha e reseta formulario
function closePasswordModal(): void {
    const modal = document.getElementById('password-modal') as HTMLElement;
    const form = document.getElementById('password-form') as HTMLFormElement;
    modal.classList.remove('show');
    form.reset();
}

// processa alteracao de senha enviando para a api
async function handlePasswordChange(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const newPassword = formData.get('new_password') as string;
    const confirmNewPassword = formData.get('confirm_new_password') as string;
    
    if (newPassword !== confirmNewPassword) {
        showToast('As novas senhas não coincidem', 'error');
        return;
    }
    
    const passwordData = {
        current_password: formData.get('current_password') as string,
        new_password: newPassword
    };
    
    try {
        await makeRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
        
        showToast('Senha alterada com sucesso!');
        closePasswordModal();
    } catch (error: any) {
        showToast(error.message || 'Erro ao alterar senha', 'error');
    }
}

// carrega lista de vagas com filtros opcionais
async function loadSpots(filters: any = {}): Promise<void> {
    const container = document.getElementById('spots-grid');

    if (container) {
        container.innerHTML = '<div class="loading">Carregando...</div>';
    }

    try {
        const queryParams = new URLSearchParams();
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.max_price) queryParams.append('max_price', filters.max_price);
        
        const endpoint = `/spots/?${queryParams.toString()}`;
        console.log('Fetching spots from endpoint:', endpoint);
        const spots = await makeRequest(endpoint);
        console.log('loadSpots received:', spots);
        renderSpots(spots, 'spots-grid');
        
    } catch (error: any) {
        showToast(error.message || 'Erro ao carregar vagas', 'error');
        if (container) {
            container.innerHTML = '<p class="text-center">Erro ao carregar vagas</p>';
        }
    }
}

// carrega vagas do proprietario atual (dashboard)
async function loadMySpots(): Promise<void> {
    if (!currentUser) {
        await checkAuthStatus();
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
        const spots = await makeRequest('/spots/my-spots/');

        let pendingMap: Record<string, number> | undefined;
        try {
            const rentals = await makeRequest('/rentals/my-rentals/');
            pendingMap = {};
            (rentals || []).forEach((r: any) => {
                if (r.status === 'pending' && r.spot && r.spot.id) {
                    const sid = String(r.spot.id);
                    pendingMap![sid] = (pendingMap![sid] || 0) + 1;
                }
            });
        } catch (err) {
            console.debug('Could not load rentals for pending map', err);
            pendingMap = undefined;
        }

        renderSpots(spots, 'my-spots-grid', true, pendingMap);
    } catch (error: any) {
        showToast(error.message || 'Erro ao carregar suas vagas', 'error');
        if (container) {
            container.innerHTML = '<p class="text-center">Erro ao carregar suas vagas</p>';
        }
    }
}

// renderiza cards de vagas dentro de um container
function renderSpots(spots: Spot[], containerId: string, isOwner: boolean = false, pendingMap?: Record<string, number>): void {
    const container = document.getElementById(containerId)!;
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
        } else if (currentUser) {

            const userId = currentUser?.id !== undefined ? String(currentUser.id) : undefined;
            const userEmail = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : undefined;

            let ownerId: string | undefined;
            let ownerEmail: string | undefined;

            if (spot && typeof (spot as any).owner === 'object' && (spot as any).owner !== null) {
                ownerId = (spot as any).owner.id !== undefined ? String((spot as any).owner.id) : undefined;
                ownerEmail = (spot as any).owner.email !== undefined ? String((spot as any).owner.email).toLowerCase().trim() : undefined;
            } else {
                ownerId = spot.owner !== undefined && spot.owner !== null ? String(spot.owner) : undefined;
                ownerEmail = spot.owner_email ? String(spot.owner_email).toLowerCase().trim() : undefined;
            }

            if (userId && ownerId && ownerId === userId) {
                spotIsOwner = true;
            } else if (userEmail && ownerEmail && ownerEmail === userEmail) {
                spotIsOwner = true;
            } else if (userEmail && ownerId && ownerId === userEmail) {

                spotIsOwner = true;
            }

            if (!spotIsOwner) {
                console.debug('renderSpots ownership check: not owner', {
                    spotId: spot.id,
                    ownerRaw: (spot as any).owner,
                    ownerId,
                    ownerEmail,
                    userId,
                    userEmail,
                    isOwnerFlag: isOwner
                });
            } else {
                console.debug('renderSpots ownership check: owner detected', { spotId: spot.id, ownerId, ownerEmail, userId, userEmail });
            }
        }

        const showOwnerActions = spotIsOwner && currentUser && currentUser.user_type === 'landlord';

        if (spotIsOwner && currentUser && currentUser.user_type !== 'landlord') {
            console.debug('renderSpots: owner detected but current user is not landlord — hiding owner actions', { spotId: spot.id, userType: currentUser.user_type });
        }

        const pendingCount = pendingMap && pendingMap[String(spot.id)] ? pendingMap[String(spot.id)] : 0;

        const showViewRequests = pendingCount > 0 && spotIsOwner && currentUser && currentUser.user_type === 'landlord';

        let actions: string;
        if (showViewRequests) {
            actions = `
                <button class="btn btn-outline" onclick="window.location.href='my-rentals.html'">Ver pedidos (${pendingCount})</button>
            `;
        } else if (showOwnerActions) {
            actions = `
                <button class="btn btn-secondary" onclick="editSpot('${spot.id}')">Editar</button>
                <button class="btn btn-danger" onclick="deleteSpot('${spot.id}')">Excluir</button>
            `;
        } else {
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
function getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
        'covered': 'Coberta',
        'uncovered': 'Descoberta',
        'garage': 'Garagem'
    };

    return labels[type] || type;
}

// monta filtros e dispara busca de vagas
function searchSpots(): void {
    const location = (document.getElementById('search-location') as HTMLInputElement).value;
    const type = (document.getElementById('search-type') as HTMLSelectElement).value;
    const maxPrice = (document.getElementById('search-max-price') as HTMLInputElement).value;
    
    const filters: any = {};

    if (location) filters.location = location;
    if (type) filters.type = type;
    if (maxPrice) filters.max_price = maxPrice;
    
    loadSpots(filters);
}

// abre modal para adicionar uma nova vaga
function showAddSpotModal(): void {
    if (!currentUser) {
        showToast('Faça login para adicionar uma vaga', 'error');
        return;
    }
    
    currentEditingSpotId = null;
    const modal = document.getElementById('spot-modal') as HTMLElement;
    const title = document.getElementById('spot-modal-title') as HTMLElement;
    const form = document.getElementById('spot-form') as HTMLFormElement;
    
    title.textContent = 'Adicionar Vaga';
    form.reset();
    modal.classList.add('show');
}

// carrega dados de uma vaga para edicao
async function editSpot(spotId: string): Promise<void> {
    currentEditingSpotId = spotId;
    
    try {
        const spot = await makeRequest(`/spots/${spotId}/`);
        
        const modal = document.getElementById('spot-modal') as HTMLElement;
        const title = document.getElementById('spot-modal-title') as HTMLElement;
        
        title.textContent = 'Editar Vaga';
        
        (document.getElementById('spot-title') as HTMLInputElement).value = spot.title;
        (document.getElementById('spot-description') as HTMLTextAreaElement).value = spot.description;
        (document.getElementById('spot-location') as HTMLInputElement).value = spot.location;
        (document.getElementById('spot-type') as HTMLSelectElement).value = spot.type;
        (document.getElementById('spot-price') as HTMLInputElement).value = spot.price;
        (document.getElementById('spot-available') as HTMLSelectElement).value = spot.available.toString();
        
        modal.classList.add('show');
    } catch (error: any) {
        showToast(error.message || 'Erro ao carregar vaga', 'error');
    }
}

// fecha modal de vaga e reseta estado
function closeSpotModal(): void {
    const modal = document.getElementById('spot-modal') as HTMLElement;
    const form = document.getElementById('spot-form') as HTMLFormElement;
    modal.classList.remove('show');
    form.reset();
    currentEditingSpotId = null;
}

// envia criacao ou atualizacao de vaga para a api
async function handleSpotSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const spotData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        type: formData.get('type') as string,
        price: parseFloat(formData.get('price') as string),
        available: formData.get('available') === 'true'
    };
    
    try {
        if (currentEditingSpotId) {
            await makeRequest(`/spots/${currentEditingSpotId}/`, {
                method: 'PUT',
                body: JSON.stringify(spotData)
            });

            showToast('Vaga atualizada com sucesso!');
        } else {
            await makeRequest('/spots/', {
                method: 'POST',
                body: JSON.stringify(spotData)
            });

            showToast('Vaga adicionada com sucesso!');
        }
        
        closeSpotModal();

        const currentPath = window.location.pathname;
        if (currentPath.includes('my-spots.html')) {
            loadMySpots();
        } else if (currentPath.includes('search.html')) {
            loadSpots();
        }
    } catch (error: any) {
        showToast(error.message || 'Erro ao salvar vaga', 'error');
    }
}

// exclui vaga por id apos confirmacao
async function deleteSpot(spotId: string): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir esta vaga?')) {
        return;
    }
    
    try {
        await makeRequest(`/spots/${spotId}/`, { method: 'DELETE' });
        showToast('Vaga excluída com sucesso!');

        loadMySpots();
    } catch (error: any) {
        showToast(error.message || 'Erro ao excluir vaga', 'error');
    }
}

// inicia fluxo para solicitar aluguel de uma vaga
async function rentSpot(spotId: string): Promise<void> {
    if (!currentUser) {
        showToast('Faça login para alugar uma vaga', 'error');
        return;
    }
    
    if (currentUser.user_type !== 'tenant') {
        showToast('Apenas locatários podem alugar vagas', 'error');

        return;
    }

    openRentModal(spotId);
}

// abre modal de solicitacao de aluguel e preenche preco
function openRentModal(spotId: string, price?: number): void {
    const modal = document.getElementById('rent-modal') as HTMLElement;
    const title = document.getElementById('rent-modal-title') as HTMLElement;
    const spotIdInput = document.getElementById('rent-spot-id') as HTMLInputElement;

    title.textContent = 'Solicitar Aluguel';
    if (spotIdInput) spotIdInput.value = spotId;

    const priceElem = document.getElementById('rent-price-month');
    let usedPrice = 0;
    if (typeof price === 'number') {
        usedPrice = price;
    } else {
        const spotCard = document.querySelector(`.spot-card[data-id="${spotId}"]`);
        if (spotCard) {
            const priceAttr = (spotCard as HTMLElement).getAttribute('data-price');
            usedPrice = priceAttr ? parseFloat(priceAttr) : 0;
        }
    }

    if (priceElem) {
        priceElem.textContent = `R$ ${usedPrice.toFixed(2)}`;
        (priceElem as any)._price = usedPrice;
    }

    modal.classList.add('show');

    const start = document.getElementById('rent-start') as HTMLInputElement;
    const end = document.getElementById('rent-end') as HTMLInputElement;
    [start, end].forEach(el => {
        if (el) {
            el.addEventListener('change', calculateRentTotal);
            el.addEventListener('focus', () => {
                rentCalendarActiveInput = el;
                const sid = (document.getElementById('rent-spot-id') as HTMLInputElement).value;
                ensureBookingsAndRenderCalendar(sid).catch(err => console.debug('calendar load err', err));
            });
        }
    });
    calculateRentTotal();
}

// fecha modal de aluguel e limpa campos temporarios
function closeRentModal(): void {
    const modal = document.getElementById('rent-modal') as HTMLElement;
    const form = document.getElementById('rent-form') as HTMLFormElement;
    modal.classList.remove('show');
    form.reset();

    (window as any)._calendarSelection = { start: null, end: null };
    rentCalendarActiveInput = null;

    const priceElem = document.getElementById('rent-price-month');
    if (priceElem) {
        priceElem.textContent = 'R$ 0,00';
        (priceElem as any)._price = 0;
    }
    const duration = document.getElementById('rent-duration');
    if (duration) duration.textContent = '0 dias';
    const total = document.getElementById('rent-total');
    if (total) total.textContent = 'R$ 0,00';
}

// calcula duracao e total estimado com base nas datas e preco mensal
function calculateRentTotal(): void {
    const start = (document.getElementById('rent-start') as HTMLInputElement).value;
    const end = (document.getElementById('rent-end') as HTMLInputElement).value;
    const priceElem = document.getElementById('rent-price-month') as HTMLElement;
    const durationElem = document.getElementById('rent-duration') as HTMLElement;
    const totalElem = document.getElementById('rent-total') as HTMLElement;

    const price = priceElem ? (priceElem as any)._price || 0 : 0;

    if (!start || !end) {
        if (durationElem) durationElem.textContent = '0 dias';
        if (totalElem) totalElem.textContent = 'R$ 0,00';
        return;
    }

    const s = parseDateSafe(start);
    const e = parseDateSafe(end);
    if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
        if (durationElem) durationElem.textContent = 'Período inválido';
        if (totalElem) totalElem.textContent = 'R$ 0,00';
        return;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((e.getTime() - s.getTime()) / msPerDay);
    if (durationElem) durationElem.textContent = `${days} dias`;

    const dailyPrice = price / 30;
    const total = dailyPrice * days;
    if (totalElem) totalElem.textContent = `R$ ${total.toFixed(2)}`;
}

// submete pedido de aluguel checando disponibilidade localmente
async function submitRentRequest(event: Event): Promise<void> {
    event.preventDefault();

    if (!currentUser) {
        showToast('Faça login antes de solicitar aluguel', 'error');
        return;
    }
    if (currentUser.user_type !== 'tenant') {
        showToast('Apenas locatários podem solicitar aluguéis', 'error');
        return;
    }

    const spotId = (document.getElementById('rent-spot-id') as HTMLInputElement).value;
    const start = (document.getElementById('rent-start') as HTMLInputElement).value;
    const end = (document.getElementById('rent-end') as HTMLInputElement).value;

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
            const existing: any[] = await makeRequest(`/rentals/?spot_id=${spotId}`) || [];
            console.debug('submitRentRequest: existing rentals for spot', { spotId, existing });

            const overlaps = existing.filter(r => r.status === 'active' && r.start_date && r.end_date).some(r => {
                const rs = parseDateSafe(r.start_date);
                const re = parseDateSafe(r.end_date);
                if (!rs || !re) return false;

                return s <= re && rs <= e;
            });

            if (overlaps) {
                showToast('Período indisponível: já existe reserva ativa para parte desse intervalo', 'error');
                return;
            }
        } catch (err) {
            console.debug('submitRentRequest: could not verify availability', err);

        }

        await makeRequest('/rentals/', {
            method: 'POST',
            body: JSON.stringify({ spot_id: spotId, start_date: start, end_date: end })
        });

        showToast('Solicitação de aluguel enviada com sucesso!');
        closeRentModal();

        loadSpots();
    } catch (error: any) {
        showToast(error.message || 'Erro ao solicitar aluguel', 'error');
    }
}

// carrega aluguels do usuario atual (inquilino ou proprietario)
async function loadMyRentals(): Promise<void> {
    if (!currentUser) {
        await checkAuthStatus();
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
        const rentals = await makeRequest('/rentals/my-rentals/');

        renderRentals(rentals);
    } catch (error: any) {
        showToast(error.message || 'Erro ao carregar aluguéis', 'error');

        if (container) {
            container.innerHTML = '<p class="text-center">Erro ao carregar aluguéis</p>';
        }
    }
}

// carrega historico de reservas para o proprietario
async function loadOwnerHistory(): Promise<void> {
    if (!currentUser) {
        await checkAuthStatus();
        if (!currentUser) {
            showToast('Faça login para ver o histórico do proprietário', 'error');
            return;
        }
    }

    if (currentUser.user_type !== 'landlord') {
        const container = document.getElementById('owner-history-list');
        if (container) container.innerHTML = '<p class="text-center">Apenas proprietários têm acesso a este painel</p>';
        return;
    }

    const container = document.getElementById('owner-history-list');
    if (container) container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const rentals = await makeRequest('/rentals/owner-history/');

        (window as any)._ownerHistoryCache = rentals || [];

        renderOwnerHistory(rentals || []);
    } catch (error: any) {
        showToast(error.message || 'Erro ao carregar histórico do proprietário', 'error');
        if (container) container.innerHTML = '<p class="text-center">Erro ao carregar histórico</p>';
    }
}

// renderiza painel com historico de reservas do proprietario
function renderOwnerHistory(rentals: Rental[]): void {
    const container = document.getElementById('owner-history-list')!;

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
                <p>Solicitante: ${(rental as any).tenant_name || rental.tenant}</p>
                <p>💰 R$ ${rental.monthly_price.toFixed(2)}/mês</p>
                <p>Estimativa prevista: <strong>R$ ${total.toFixed(2)}</strong> para ${days} dias</p>
                <p>📅 ${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</p>
                <p class="muted">Criado em: ${formatDate((rental as any).created_at || rental.start_date)}</p>
            </div>
            <div class="rental-status ${rental.status}">${getStatusLabel(rental.status)}</div>
            ${actions}
        </div>
    `;
    }).join('');
}

// filtra historico do proprietario por status
function filterOwnerHistory(status: string): void {
    const all: Rental[] = (window as any)._ownerHistoryCache || [];
    if (status === 'all') {
        renderOwnerHistory(all);
    } else {
        renderOwnerHistory(all.filter(r => r.status === status));
    }
}

// renderiza lista de alugueis do usuario
function renderRentals(rentals: Rental[]): void {
    const container = document.getElementById('my-rentals-list')!;
    
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
async function acceptRental(rentalId: string): Promise<void> {
    if (!confirm('Aceitar este pedido de aluguel?')) return;
    try {
        await makeRequest(`/rentals/${rentalId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'active' })
        });
        showToast('Reserva aceita.');
        await loadMyRentals();
    } catch (error: any) {
        showToast(error.message || 'Erro ao aceitar reserva', 'error');
    }
}

// recusa uma solicitacao de aluguel alterando status para cancelled
async function rejectRental(rentalId: string): Promise<void> {
    if (!confirm('Recusar este pedido de aluguel?')) return;
    try {
        await makeRequest(`/rentals/${rentalId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' })
        });
        showToast('Reserva recusada.');
        await loadMyRentals();
    } catch (error: any) {
        showToast(error.message || 'Erro ao recusar reserva', 'error');
    }
}

// retorna label legivel para status de aluguel
function getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
        'active': 'Ativo',
        'pending': 'Pendente',
        'cancelled': 'Cancelado'
    };

    return labels[status] || status;
}

// formata uma string de data para formato local pt-BR
function formatDate(dateString: string): string {
    const d = parseDateSafe(dateString);
    if (!d || isNaN(d.getTime())) return String(dateString || '');
    return d.toLocaleDateString('pt-BR');
}

// converte varias representacoes de data para objeto Date com cuidado de timezone
function parseDateSafe(value: any): Date | null {
    if (value === null || value === undefined) return null;

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
function formatISODate(d: Date): string {
    const y = d.getFullYear();
    const pad2 = (n: number) => (n < 10 ? '0' + n : String(n));
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
}

// busca reservas ativas por vaga e monta cache por dia
async function loadBookingsForSpot(spotId: string): Promise<Set<string>> {
    try {
        const rentals: any[] = await makeRequest(`/rentals/?spot_id=${spotId}`) || [];
        const booked = new Set<string>();
        const infoMap: Record<string, any> = {};
        (rentals || []).forEach(r => {
            if (r.status !== 'active') return;
            const rs = parseDateSafe(r.start_date);
            const re = parseDateSafe(r.end_date);
            if (!rs || !re) return;
            const cur = new Date(rs.getTime());
            while (cur <= re) {
                const iso = formatISODate(cur);
                booked.add(iso);
                infoMap[iso] = { tenant: r.tenant, tenant_name: r.tenant_name, start_date: r.start_date, end_date: r.end_date };
                cur.setDate(cur.getDate() + 1);
            }
        });
        (window as any)._spotBookingsCache = (window as any)._spotBookingsCache || {};
        (window as any)._spotBookingsCache[spotId] = booked;
        (window as any)._spotBookingsInfo = (window as any)._spotBookingsInfo || {};
        (window as any)._spotBookingsInfo[spotId] = infoMap;
        return booked;
    } catch (err) {
        console.debug('loadBookingsForSpot failed', err);
        return new Set();
    }
}

let rentCalendarActiveInput: HTMLInputElement | null = null;
let rentCalendarMonthOffset = 0;

// injeta estilos do calendario quando necessario
function ensureRentCalendarStyles(): void {
    if (document.getElementById('rent-calendar-styles')) return;
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
function renderCalendarModal(spotId: string): void {
    ensureRentCalendarStyles();
    const modal = document.getElementById('rent-modal') as HTMLElement;
    if (!modal) return;

    let container = document.getElementById('rent-calendar') as HTMLElement | null;
    const form = document.getElementById('rent-form') as HTMLElement;
    if (!container) {
        container = document.createElement('div');
        container.id = 'rent-calendar';
        container.className = 'rent-calendar';
        if (form) {
            const spotHidden = form.querySelector('#rent-spot-id');
            if (spotHidden && spotHidden.parentElement) {
                spotHidden.insertAdjacentElement('afterend', container);
            } else {
                form.insertBefore(container, form.firstElementChild);
            }
        }
    } else {

        if (form) {
            const spotHidden = form.querySelector('#rent-spot-id');
            if (spotHidden && spotHidden.parentElement && container.parentElement !== spotHidden.parentElement) {
                spotHidden.insertAdjacentElement('afterend', container);
            }
        }
    }

    const booked: Set<string> = ((window as any)._spotBookingsCache || {})[spotId] || new Set();

    const today = new Date();
    const base1 = new Date(today.getFullYear(), today.getMonth() + rentCalendarMonthOffset, 1);

    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'cal-header';
    const prev = document.createElement('button'); prev.type = 'button'; prev.textContent = '<';
    const next = document.createElement('button'); next.type = 'button'; next.textContent = '>';
    const title = document.createElement('div'); title.textContent = `${base1.toLocaleString('pt-BR', { month: 'long' })} ${base1.getFullYear()}`;
    prev.addEventListener('click', () => { rentCalendarMonthOffset -= 1; renderCalendarModal(spotId); });
    next.addEventListener('click', () => { rentCalendarMonthOffset += 1; renderCalendarModal(spotId); });
    header.appendChild(prev); header.appendChild(title); header.appendChild(next);
    container.appendChild(header);

    const wrapper = document.createElement('div'); wrapper.className = 'cal-one';
    container.appendChild(wrapper);

    const months = [base1];

    (window as any)._calendarSelection = (window as any)._calendarSelection || { start: null as string | null, end: null as string | null };
    const sel = (window as any)._calendarSelection;

    months.forEach((base) => {
        const monthBox = document.createElement('div'); monthBox.className = 'cal-month';
        const caption = document.createElement('div'); caption.className = 'cal-caption';
        caption.textContent = `${base.toLocaleString('pt-BR', { month: 'long' })} ${base.getFullYear()}`;
        monthBox.appendChild(caption);

        const dow = document.createElement('div'); dow.className = 'cal-grid';
        const daysOfWeek = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
        daysOfWeek.forEach(d => {
            const el = document.createElement('div'); el.className = 'rent-day head'; el.style.fontWeight = '600'; el.textContent = d;
            dow.appendChild(el);
        });

        const year = base.getFullYear();
        const month = base.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const startDate = new Date(year, month, 1 - firstWeekday);

        for (let i=0;i<42;i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
            const iso = formatISODate(d);
            const cell = document.createElement('div');
            cell.className = 'rent-day';
            if (d.getMonth() !== month) cell.classList.add('other-month');
            if (iso === formatISODate(new Date())) cell.classList.add('today');

            const isBooked = booked.has(iso);
            if (isBooked) cell.classList.add('booked');

            if (sel.start && sel.start === iso) cell.classList.add('selected-start');
            if (sel.end && sel.end === iso) cell.classList.add('selected-end');
            if (sel.start && sel.end && sel.start <= iso && iso <= sel.end) cell.classList.add('in-range');

            cell.textContent = String(d.getDate());

            const nowIso = formatISODate(new Date());
            const infoMapForSpot = ((window as any)._spotBookingsInfo || {})[spotId] || {};
            if (isBooked) {
                const info = infoMapForSpot[iso];
                const text = info ? `${info.tenant_name || info.tenant || 'Reservado'}: ${info.start_date} → ${info.end_date}` : 'Reservado';
                cell.setAttribute('title', text);
            }

            if (!isBooked && iso >= nowIso) {
                cell.classList.add('available');
                cell.addEventListener('click', () => {
                    if (!rentCalendarActiveInput) rentCalendarActiveInput = document.getElementById('rent-start') as HTMLInputElement;
                    if (!sel.start || (sel.start && sel.end)) {
                        sel.start = iso;
                        sel.end = null;
                    } else {
                        if (iso < sel.start) {
                            sel.end = sel.start;
                            sel.start = iso;
                        } else {
                            sel.end = iso;
                        }
                    }

                    if (sel.start && sel.end) {
                        const ds = parseDateSafe(sel.start)!;
                        const de = parseDateSafe(sel.end)!;
                        let cur2 = new Date(ds.getTime());
                        let blocked = false;
                        while (cur2 <= de) {
                            if (booked.has(formatISODate(cur2))) { blocked = true; break; }
                            cur2.setDate(cur2.getDate() + 1);
                        }
                        if (blocked) {
                            showToast('Seleção inválida: o intervalo inclui dias já reservados', 'error');
                            sel.end = null;
                            const startInput = document.getElementById('rent-start') as HTMLInputElement;
                            const endInput = document.getElementById('rent-end') as HTMLInputElement;
                            if (startInput) startInput.value = sel.start || '';
                            if (endInput) endInput.value = sel.end || '';
                            renderCalendarModal(spotId);
                            return;
                        }
                    }

                    const startInput = document.getElementById('rent-start') as HTMLInputElement;
                    const endInput = document.getElementById('rent-end') as HTMLInputElement;
                    if (startInput) startInput.value = sel.start || '';
                    if (endInput) endInput.value = sel.end || '';
                    calculateRentTotal();
                    renderCalendarModal(spotId);
                });
            }

            dow.appendChild(cell);
        }

        monthBox.appendChild(dow);
        wrapper.appendChild(monthBox);
    });

    const controls = document.createElement('div'); controls.style.marginTop = '6px';
    const clearBtn = document.createElement('button'); clearBtn.type = 'button'; clearBtn.textContent = 'Limpar seleção';
    clearBtn.addEventListener('click', () => {
        (window as any)._calendarSelection = { start: null, end: null };
        const si = document.getElementById('rent-start') as HTMLInputElement;
        const ei = document.getElementById('rent-end') as HTMLInputElement;
        if (si) si.value = '';
        if (ei) ei.value = '';
        calculateRentTotal();
        renderCalendarModal(spotId);
    });
    controls.appendChild(clearBtn);
    container.appendChild(controls);
}

// garante cache de bookings e renderiza calendario fresquinho
async function ensureBookingsAndRenderCalendar(spotId: string): Promise<void> {
    await loadBookingsForSpot(spotId);
    rentCalendarMonthOffset = 0;
    renderCalendarModal(spotId);
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();

    const currentPath = window.location.pathname;
    if (currentPath.includes('search.html')) {
        await loadSpots();
    } else if (currentPath.includes('my-spots.html')) {
        await loadMySpots();
    } else if (currentPath.includes('my-rentals.html')) {
        await loadMyRentals();
    } else if (currentPath.includes('profile.html')) {
        await loadProfile();
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
});

(window as any).editSpot = editSpot;
(window as any).deleteSpot = deleteSpot;
(window as any).rentSpot = rentSpot;
(window as any).showAddSpotModal = showAddSpotModal;
(window as any).closeSpotModal = closeSpotModal;
(window as any).loadOwnerHistory = loadOwnerHistory;
(window as any).filterOwnerHistory = filterOwnerHistory;
(window as any).openRentModal = openRentModal;
(window as any).closeRentModal = closeRentModal;
(window as any).submitRentRequest = submitRentRequest;