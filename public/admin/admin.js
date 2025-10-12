// VERSÃO FINAL COMPLETA E CORRIGIDA
let allNewsData = [], allPlayersData = [];
let isEditingNews = false, editingNewsId = null;
let isEditingPlayer = false, editingPlayerId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    // --- LÓGICA DA PÁGINA DE LOGIN ---
    if (path.includes('index.html') || path.endsWith('/admin/')) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                try {
                    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                    if (!response.ok) { // Trata erros como 401 (senha errada)
                        alert('Usuário ou senha inválidos!');
                        return;
                    }
                    const result = await response.json();
                    if (result.success) {
                        window.location.href = 'dashboard.html';
                    } else {
                        alert('Usuário ou senha inválidos!');
                    }
                } catch (error) {
                    alert('Erro ao tentar fazer login.');
                }
            });
        }
    }
    // --- LÓGICA DA PÁGINA DO DASHBOARD (COM PROTEÇÃO) ---
    else if (path.includes('dashboard.html')) {
        try {
            const authResponse = await fetch('/api/check-auth');
            const authResult = await authResponse.json();
            if (authResult.loggedIn) {
                carregarNoticiasAdmin();
                carregarElencoAdmin();
                carregarPartidasAdmin();
                setupNewsForm();
                setupPlayerForm();
                setupPartidasForm();
            } else {
                alert("Acesso negado. Por favor, faça o login.");
                window.location.href = '/admin/';
            }
        } catch (error) {
            console.error("Erro na verificação de autenticação", error);
            window.location.href = '/admin/';
        }
    }
});

async function carregarPartidasAdmin(){try{const e=await fetch("/api/partidas"),{data:t}=await e.json(),a=t.find(e=>"proximo"===e.tipo),o=t.find(e=>"ultimo"===e.tipo);a&&(document.getElementById("proximo-jogo-adversario").value=a.adversario,document.getElementById("proximo-jogo-data").value=a.data_hora?a.data_hora.slice(0,16):"");o&&(document.getElementById("ultimo-resultado-adversario").value=o.adversario,document.getElementById("ultimo-resultado-placar").value=o.placar)}catch(e){console.error("Erro ao carregar partidas:",e)}}
function setupPartidasForm(){document.getElementById("proximo-jogo-form").addEventListener("submit",e=>{e.preventDefault(),salvarPartida({tipo:"proximo",adversario:document.getElementById("proximo-jogo-adversario").value,data_hora:document.getElementById("proximo-jogo-data").value})}),document.getElementById("ultimo-resultado-form").addEventListener("submit",e=>{e.preventDefault(),salvarPartida({tipo:"ultimo",adversario:document.getElementById("ultimo-resultado-adversario").value,placar:document.getElementById("ultimo-resultado-placar").value})})}
async function salvarPartida(e){try{const t=await fetch("/api/partidas",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error("Falha ao salvar partida.");alert("Partida salva com sucesso!")}catch(e){console.error("Erro ao salvar partida:",e),alert("Houve um erro ao salvar a partida.")}}
function setupNewsForm(){const e=document.getElementById("add-news-form"),t=document.getElementById("lista-noticias");e.addEventListener("submit",async t=>{t.preventDefault();const a=document.getElementById("submit-button-news"),o={titulo:document.getElementById("news-title").value,resumo:document.getElementById("news-summary").value,imagem:document.getElementById("news-image").value};try{const t=isEditingNews?`/api/noticias/${editingNewsId}`:"/api/noticias",n=isEditingNews?"PUT":"POST",d=await fetch(t,{method:n,headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!d.ok)throw new Error("Falha na operação com a notícia.");alert(`Notícia ${isEditingNews?"atualizada":"adicionada"} com sucesso!`),e.reset(),isEditingNews=!1,editingNewsId=null,a.innerText="Adicionar Notícia",carregarNoticiasAdmin()}catch(t){console.error("Erro no formulário de notícias:",t),alert("Houve um erro. Verifique o console.")}}),t.addEventListener("click",e=>{const a=e.target,o=a.dataset.id;if(a.classList.contains("btn-edit")){const e=allNewsData.find(e=>e.id==o);e&&(document.getElementById("news-title").value=e.titulo,document.getElementById("news-summary").value=e.resumo,document.getElementById("news-image").value=e.imagem,isEditingNews=!0,editingNewsId=o,document.getElementById("submit-button-news").innerText="Salvar Alterações",window.scrollTo({top:t.offsetTop-20,behavior:"smooth"}))}a.classList.contains("btn-delete")&&confirm("Tem certeza que deseja excluir esta notícia?")&&fetch(`/api/noticias/${o}`,{method:"DELETE"}).then(e=>{if(!e.ok)throw new Error("Falha ao excluir.");alert("Notícia excluída com sucesso!"),carregarNoticiasAdmin()}).catch(e=>alert("Erro ao excluir notícia."))})}
async function carregarNoticiasAdmin(){const e=document.getElementById("lista-noticias");try{const t=await fetch("/api/noticias"),{data:a}=await t.json();allNewsData=a,e.innerHTML="",a.forEach(t=>{const a=document.createElement("div");a.className="news-item",a.innerHTML=`<p>${t.titulo}</p><div class="item-actions"><button class="btn-edit" data-id="${t.id}">Editar</button><button class="btn-delete" data-id="${t.id}">Excluir</button></div>`,e.appendChild(a)})}catch(e){console.error("Erro ao carregar notícias:",e)}}
function setupPlayerForm(){const e=document.getElementById("add-player-form"),t=document.getElementById("lista-elenco");e.addEventListener("submit",async t=>{t.preventDefault();const a=document.getElementById("submit-button-player"),o={nome:document.getElementById("player-name").value,posicao:document.getElementById("player-position").value,gols:document.getElementById("player-goals").value,avatar_url:document.getElementById("player-avatar").value};try{const t=isEditingPlayer?`/api/elenco/${editingPlayerId}`:"/api/elenco",n=isEditingPlayer?"PUT":"POST",d=await fetch(t,{method:n,headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!d.ok)throw new Error("Falha na operação com o membro.");alert(`Membro ${isEditingPlayer?"atualizado":"adicionado"} com sucesso!`),e.reset(),isEditingPlayer=!1,editingPlayerId=null,a.innerText="Adicionar Membro",carregarElencoAdmin()}catch(t){console.error("Erro no formulário de elenco:",t),alert("Houve um erro. Verifique o console.")}}),t.addEventListener("click",e=>{const a=e.target,o=a.dataset.id;if(a.classList.contains("btn-edit")){const e=allPlayersData.find(e=>e.id==o);e&&(document.getElementById("player-name").value=e.nome,document.getElementById("player-position").value=e.posicao,document.getElementById("player-goals").value=e.gols,document.getElementById("player-avatar").value=e.avatar_url,isEditingPlayer=!0,editingPlayerId=o,document.getElementById("submit-button-player").innerText="Salvar Alterações",window.scrollTo({top:t.offsetTop-20,behavior:"smooth"}))}a.classList.contains("btn-delete")&&confirm("Tem certeza que deseja excluir este membro?")&&fetch(`/api/elenco/${o}`,{method:"DELETE"}).then(e=>{if(!e.ok)throw new Error("Falha ao excluir.");alert("Membro excluído com sucesso!"),carregarElencoAdmin()}).catch(e=>alert("Erro ao excluir membro."))})}
async function carregarElencoAdmin(){const e=document.getElementById("lista-elenco");try{const t=await fetch("/api/elenco"),{data:a}=await t.json();allPlayersData=a,e.innerHTML="",a.forEach(t=>{const a=document.createElement("div");a.className="player-item",a.innerHTML=`<p>${t.nome} <small>(${t.posicao})</small></p><div class="item-actions"><button class="btn-edit" data-id="${t.id}">Editar</button><button class="btn-delete" data-id="${t.id}">Excluir</button></div>`,e.appendChild(a)})}catch(e){console.error("Erro ao carregar elenco:",e)}}