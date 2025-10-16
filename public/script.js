// VERSÃO FINAL E COMPLETA - COM A LIMPEZA DOS BOTÕES DA HOME
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO MENU HAMBÚRGUER ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburgerMenu.classList.toggle('active');
        });
    }

    // Efeito de sombra no header ao rolar
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { header.classList.add('scrolled'); }
            else { header.classList.remove('scrolled'); }
        });
    }

    // --- LÓGICA DE ROTEAMENTO SIMPLES ---
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        carregarPartidasDestaque();
        carregarElencoDestaque();
    } else if (path.endsWith('noticias.html')) {
        carregarPaginaNoticias();
    } else if (path.endsWith('elenco.html')) {
        carregarPaginaElenco();
    }
});

// ==========================================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// ==========================================================================

async function carregarPartidasDestaque() {
    try {
        const response = await fetch('/api/partidas');
        const { data } = await response.json();
        const container = document.getElementById('partidas-destaque');
        if (!container) return;
        container.innerHTML = '';
        const proximoJogo = data.find(p => p.tipo === 'proximo');
        const ultimoJogo = data.find(p => p.tipo === 'ultimo');
        
        // Card do Próximo Jogo (SEM O BOTÃO)
        if (proximoJogo) {
            container.innerHTML += `
                <div class="card">
                    <h3>Próximo Jogo</h3>
                    <p>${proximoJogo.adversario}</p>
                    <small>${new Date(proximoJogo.data_hora).toLocaleString('pt-BR')}</small>
                </div>
            `;
        }
        // Card do Último Resultado (SEM O BOTÃO)
        if (ultimoJogo) {
            container.innerHTML += `
                <div class="card">
                    <h3>Último Resultado</h3>
                    <p>${ultimoJogo.placar}</p>
                    <small>${ultimoJogo.adversario}</small>
                </div>
            `;
        }
    } catch (error) { console.error('Erro ao carregar partidas:', error); }
}

async function carregarElencoDestaque() {
    try {
        const response = await fetch('/api/elenco');
        const { data } = await response.json();
        const container = document.getElementById('elenco-destaque');
        if (!container) return;
        container.innerHTML = '';
        const diretoria = data.filter(membro => membro.posicao === 'Presidente' || membro.posicao === 'Vice-Presidente');
        diretoria.forEach(membro => {
            container.innerHTML += `<div class="avatar"><img src="${membro.avatar_url}" alt="Foto de ${membro.nome}"><div class="info"><strong>${membro.nome}</strong><br><span>${membro.posicao}</span></div></div>`;
        });
    } catch (error) { console.error('Erro ao carregar elenco em destaque:', error); }
}

async function carregarPaginaNoticias() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    try {
        const response = await fetch('/api/noticias');
        const { data } = await response.json();
        if (data.length === 0) { grid.innerHTML = '<p>Nenhuma notícia encontrada.</p>'; return; }
        
        grid.innerHTML = '';
        data.forEach(noticia => {
            grid.innerHTML += `
                <div class="news-card">
                    <img src="${noticia.imagem}" alt="Imagem da notícia">
                    <div class="news-card-content">
                        <h3>${noticia.titulo}</h3>
                        <p>${noticia.resumo}</p>
                    </div>
                </div>
            `;
        });
    } catch (error) { 
        console.error('Erro ao carregar notícias:', error); 
        grid.innerHTML = '<p>Erro ao carregar notícias.</p>'; 
    }
}

async function carregarPaginaElenco() {
    const rosterGrid = document.getElementById('roster-grid');
    const scorersList = document.getElementById('top-scorers-list');
    if (!rosterGrid || !scorersList) return;
    try {
        const response = await fetch('/api/elenco');
        const { data } = await response.json();
        if (data.length === 0) { rosterGrid.innerHTML = '<p>Nenhuma equipe encontrada.</p>'; return; }
        rosterGrid.innerHTML = '';
        scorersList.innerHTML = '';
        const jogadoresExcluidos = ['Allex IPTV', 'Flavio Melo', 'Gbgood', 'Fernando Sérgio'];
        const elencoPrincipal = data.filter(membro => !jogadoresExcluidos.includes(membro.nome));
        elencoPrincipal.forEach(membro => {
            rosterGrid.innerHTML += `<div class="player-card"><div class="player-avatar"><img src="${membro.avatar_url}" alt="Foto de ${membro.nome}"></div><div class="player-info"><h3>${membro.nome}</h3><p>${membro.posicao}</p></div></div>`;
        });
        const artilheiros = data.sort((a, b) => b.gols - a.gols);
        artilheiros.forEach(artilheiro => {
            const textoGol = artilheiro.gols === 1 ? 'Gol' : 'Gols';
            scorersList.innerHTML += `<div class="scorer-item"><span class="name">${artilheiro.nome}</span><span class="goals">${artilheiro.gols} ${textoGol}</span></div>`;
        });
    } catch (error) { console.error('Erro ao carregar o elenco:', error); rosterGrid.innerHTML = '<p>Houve um erro ao carregar o elenco.</p>'; }
}