const API_KEY = 'b2dff7f1be49cb77505c027c69fb310b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const movieGrid = document.getElementById('movie-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');

let currentVideoId = null;
let currentType = 'movie';

// Para sa loading ata?
window.onload = fetchTrending;

async function fetchTrending() {
    sectionTitle.innerText = "Trending Now";
    const res = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}`);
    const data = await res.json();
    displayContent(data.results);
}

async function fetchContent(type) {
    sectionTitle.innerText = type === 'movie' ? "Popular Movies" : "Popular TV Shows";
    const res = await fetch(`${BASE_URL}/${type}/popular?api_key=${API_KEY}`);
    const data = await res.json();
    displayContent(data.results.map(item => ({ ...item, media_type: type })));
}

async function searchContent() {
    const query = searchInput.value;
    if(!query) return;
    sectionTitle.innerText = `Results for: ${query}`;
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();
    displayContent(data.results);
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

function openPlayer(id, type) {
    currentVideoId = id;
    currentType = type === 'tv' ? 'tv' : 'movie';
    document.getElementById('playerModal').style.display = 'block';
    switchServer(1); // Default to Server 1
}

function switchServer(serverNum) {
    const frame = document.getElementById('video-frame');
    let url = "";
    
    if (serverNum === 1) {
        url = `https://vidsrc.to/embed/${currentType}/${currentVideoId}`;
    } else {
        url = `https://multiembed.mov/?video_id=${currentVideoId}&tmdb=1`;
    }
    frame.src = url;
}

function closePlayer() {
    document.getElementById('playerModal').style.display = 'none';
    document.getElementById('video-frame').src = "";
}

searchBtn.onclick = searchContent;
searchInput.onkeypress = (e) => { if(e.key === 'Enter') searchContent(); };
