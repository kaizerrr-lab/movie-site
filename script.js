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

async function fetchTrending(page = 1) {
    currentEndpoint = 'trending/all/week';
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
    isSearch = false;
    currentEndpoint = 'discover/movie';
    currentPage = page;
    sectionTitle.innerText = `${genreName} Content`;
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`);
    const data = await res.json();
    totalPages = data.total_pages;
    updatePagination(data.results.map(item => ({ ...item, media_type: 'movie' })));
}

async function fetchKDrama(page = 1) {
    if (sideMenu.classList.contains('active')) toggleMenu();
    currentGenreId = 'kdrama';
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
    pageNumDisplay.innerText = `Page ${currentPage} of ${totalPages > 500 ? 500 : totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === (totalPages > 500 ? 500 : totalPages);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(step) {
    const newPage = currentPage + step;
    if (isSearch) {
        searchContent(newPage);
    } else if (currentGenreId === 'kdrama') {
        fetchKDrama(newPage);
    } else if (currentGenreId) {
        fetchByGenre(currentGenreId, searchQuery, newPage);
    } else if (currentEndpoint.includes('trending')) {
        fetchTrending(newPage);
    } else {
        const type = currentEndpoint.split('/')[0];
        fetchContent(type, newPage);
    }
}

function displayContent(items) {
    movieGrid.innerHTML = '';
    items.forEach(item => {
        if (!item.poster_path) return;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${IMG_URL + item.poster_path}" alt="${item.title || item.name}">
            <div class="card-info">${item.title || item.name}</div>
        `;
        card.onclick = () => openPlayer(item.id, item.media_type || 'movie');
        movieGrid.appendChild(card);
    });
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
        url = serverNum === 1 
            ? `https://vidsrc.to/embed/tv/${currentVideoId}/${currentSeason}/${currentEpisode}`
            : `https://multiembed.mov/?video_id=${currentVideoId}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`;
    } else {
        url = serverNum === 1 
            ? `https://vidsrc.to/embed/movie/${currentVideoId}` 
            : `https://multiembed.mov/?video_id=${currentVideoId}&tmdb=1`;
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
        
