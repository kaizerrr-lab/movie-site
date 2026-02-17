const API_KEY = 'b2dff7f1be49cb77505c027c69fb310b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const movieGrid = document.getElementById('movie-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const playerModal = document.getElementById('playerModal');
const seriesControls = document.getElementById('series-controls');
const sideMenu = document.getElementById('side-menu');
const clickTrap = document.getElementById('click-trap');
const pageNumDisplay = document.getElementById('page-num');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const paginationBar = document.querySelector('.pagination');

let currentVideoId = null;
let currentType = 'movie';
let currentSeason = 1;
let currentEpisode = 1;
let currentPage = 1;
let totalPages = 1;
let currentEndpoint = 'trending/all/week';
let isSearch = false;
let searchQuery = '';
let currentGenreId = null;

window.onload = () => fetchTrending();

function toggleMenu() {
    sideMenu.classList.toggle('active');
}

function hideTrap() {
    clickTrap.style.display = 'none';
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('kaiStreamFavs')) || [];
}

function getHistory() {
    return JSON.parse(localStorage.getItem('kaiStreamHistory')) || [];
}

function toggleFavorite(id, title, poster, type) {
    let favs = getFavorites();
    const index = favs.findIndex(f => f.id === id);
    if (index > -1) {
        favs.splice(index, 1);
    } else {
        favs.push({ id, title, poster, type });
    }
    localStorage.setItem('kaiStreamFavs', JSON.stringify(favs));
    if (currentEndpoint === 'favorites') fetchFavorites();
    else displayContent(lastFetchedResults);
}

function addToHistory(id, title, poster, type) {
    let history = getHistory();
    history = history.filter(h => h.id !== id);
    history.unshift({ id, title, poster, type, date: new Date().toLocaleDateString() });
    if (history.length > 20) history.pop();
    localStorage.setItem('kaiStreamHistory', JSON.stringify(history));
}

function fetchFavorites() {
    if (sideMenu.classList.contains('active')) toggleMenu();
    currentEndpoint = 'favorites';
    sectionTitle.innerText = "My Watchlist";
    const favs = getFavorites();
    displayContent(favs);
    paginationBar.classList.add('hidden');
}

function fetchHistory() {
    if (sideMenu.classList.contains('active')) toggleMenu();
    currentEndpoint = 'history';
    sectionTitle.innerText = "Recently Watched";
    const history = getHistory();
    displayContent(history);
    paginationBar.classList.add('hidden');
}

let lastFetchedResults = [];
function displayContent(items) {
    lastFetchedResults = items;
    movieGrid.innerHTML = '';
    const favs = getFavorites();
    items.forEach(item => {
        const id = item.id;
        const title = item.title || item.name;
        const poster = item.poster_path ? IMG_URL + item.poster_path : item.poster;
        const type = item.media_type || item.type || 'movie';
        if (!poster) return;

        const isFav = favs.some(f => f.id === id);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${poster}" alt="${title}">
            <div class="card-info">${title}</div>
            <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite(${id}, '${title.replace(/'/g, "\\'")}', '${poster}', '${type}')">
                <i class="${isFav ? 'fas' : 'far'} fa-heart" style="color: ${isFav ? 'red' : 'white'}"></i>
            </button>
        `;
        card.onclick = () => {
            addToHistory(id, title, poster, type);
            openPlayer(id, type);
        };
        movieGrid.appendChild(card);
    });
}

async function fetchTrending(page = 1) {
    currentEndpoint = 'trending/all/week';
    paginationBar.classList.remove('hidden');
    isSearch = false;
    currentGenreId = null;
    currentPage = page;
    sectionTitle.innerText = "Trending Now";
    const res = await fetch(`${BASE_URL}/${currentEndpoint}?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results);
}

async function fetchContent(type, page = 1) {
    currentType = type;
    currentEndpoint = `${type}/popular`;
    paginationBar.classList.remove('hidden');
    isSearch = false;
    currentGenreId = null;
    currentPage = page;
    sectionTitle.innerText = type === 'movie' ? "Popular Movies" : "Popular TV Shows";
    const res = await fetch(`${BASE_URL}/${currentEndpoint}?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results.map(item => ({ ...item, media_type: type })));
}

async function searchContent(page = 1) {
    const query = searchInput.value || searchQuery;
    if(!query) return;
    searchQuery = query;
    isSearch = true;
    paginationBar.classList.remove('hidden');
    currentGenreId = null;
    currentPage = page;
    sectionTitle.innerText = `Results for: ${query}`;
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&page=${page}`);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results);
}

async function fetchByGenre(genreId, genreName, page = 1) {
    if (sideMenu.classList.contains('active')) toggleMenu();
    currentGenreId = genreId;
    searchQuery = genreName;
    paginationBar.classList.remove('hidden');
    isSearch = false;
    currentEndpoint = 'discover/movie';
    currentPage = page;
    sectionTitle.innerText = `${genreName} Content`;
    let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`;
    if (genreId === 16) url += '&without_genres=10759,10765&with_original_language=en|fr|es';
    const res = await fetch(url);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results.map(item => ({ ...item, media_type: 'movie' })));
}

async function fetchAnime(page = 1) {
    if (sideMenu.classList.contains('active')) toggleMenu();
    currentGenreId = 'anime';
    paginationBar.classList.remove('hidden');
    isSearch = false;
    currentEndpoint = 'discover/tv';
    currentPage = page;
    sectionTitle.innerText = "Anime Series";
    const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16&page=${page}`);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results.map(item => ({ ...item, media_type: 'tv' })));
}

async function fetchKDrama(page = 1) {
    if (sideMenu.classList.contains('active')) toggleMenu();
    currentGenreId = 'kdrama';
    paginationBar.classList.remove('hidden');
    isSearch = false;
    currentEndpoint = 'discover/tv';
    currentPage = page;
    sectionTitle.innerText = "K-Dramas (Korean)";
    const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ko&with_genres=18&page=${page}`);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results.map(item => ({ ...item, media_type: 'tv' })));
}

function updatePagination(results) {
    displayContent(results);
    const limit = totalPages > 500 ? 500 : totalPages;
    pageNumDisplay.innerText = `Page ${currentPage} of ${limit}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === limit;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(step) {
    const newPage = currentPage + step;
    if (isSearch) searchContent(newPage);
    else if (currentGenreId === 'kdrama') fetchKDrama(newPage);
    else if (currentGenreId === 'anime') fetchAnime(newPage);
    else if (currentGenreId) fetchByGenre(currentGenreId, searchQuery, newPage);
    else if (currentEndpoint.includes('trending')) fetchTrending(newPage);
    else fetchContent(currentEndpoint.split('/')[0], newPage);
}

async function openPlayer(id, type) {
    currentVideoId = id;
    currentType = type === 'tv' ? 'tv' : 'movie';
    playerModal.style.display = 'block';
    clickTrap.style.display = 'block';
    currentSeason = 1;
    currentEpisode = 1;
    if (currentType === 'tv') {
        seriesControls.style.display = 'block';
        await loadSeasons(id);
    } else {
        seriesControls.style.display = 'none';
        switchServer(1);
    }
}

async function loadSeasons(id) {
    const res = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`);
    const data = await res.json();
    const select = document.getElementById('season-select');
    select.innerHTML = '';
    data.seasons.forEach(s => {
        if (s.season_number === 0) return; 
        const opt = document.createElement('option');
        opt.value = s.season_number;
        opt.innerText = `Season ${s.season_number}`;
        select.appendChild(opt);
    });
    loadEpisodes();
}

async function loadEpisodes() {
    currentSeason = document.getElementById('season-select').value;
    const res = await fetch(`${BASE_URL}/tv/${currentVideoId}/season/${currentSeason}?api_key=${API_KEY}`);
    const data = await res.json();
    const grid = document.getElementById('episode-grid');
    grid.innerHTML = '';
    data.episodes.forEach(ep => {
        const btn = document.createElement('div');
        btn.className = 'ep-btn';
        if(ep.episode_number === currentEpisode) btn.classList.add('active');
        btn.innerText = ep.episode_number;
        btn.onclick = () => {
            currentEpisode = ep.episode_number;
            document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            clickTrap.style.display = 'block';
            switchServer(1);
        };
        grid.appendChild(btn);
    });
    switchServer(1);
}

function switchServer(serverNum) {
    const frame = document.getElementById('video-frame');
    let url = "";

    if (currentType === 'tv') {
        if (serverNum === 1) {
            url = `https://embed.su/embed/tv/${currentVideoId}/${currentSeason}/${currentEpisode}`;
        } else {
            url = `https://vidsrc.xyz/embed/tv/${currentVideoId}/${currentSeason}/${currentEpisode}`;
        }
    } else {
        if (serverNum === 1) {
            url = `https://embed.su/embed/movie/${currentVideoId}`;
        } else {
            url = `https://vidsrc.xyz/embed/movie/${currentVideoId}`;
        }
    }
    frame.src = url;
}

function closePlayer() {
    playerModal.style.display = 'none';
    document.getElementById('video-frame').src = "";
    clickTrap.style.display = 'none';
}

searchBtn.onclick = () => searchContent(1);
searchInput.onkeypress = (e) => { if(e.key === 'Enter') searchContent(1); };
