// Cyber Kiosk Application
// Neuromancer-inspired dashboard

// Configuration - loaded from server /config endpoint
let CONFIG = {
    // Default values (will be overridden by server config)
    zipCode: '90210',
    weatherApiKey: '',
    nytApiKey: '',
    youtubeApiKey: '',
    imageChangeInterval: 30000, // 30 seconds
    weatherUpdateInterval: 600000, // 10 minutes
    newsUpdateInterval: 300000, // 5 minutes (cycles through sources)
    weatherCycleInterval: 300000, // 5 minutes (cycles between weather and financial)
    systemMonitorUrl: 'http://localhost:3001/stats',
    systemUpdateInterval: 30000, // 30 seconds
};

// Load configuration from server
async function loadConfig() {
    try {
        // Fetch config from server (which loads from .env file)
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            // Merge loaded config with defaults
            CONFIG = { ...CONFIG, ...config };
            console.log('> CONFIG LOADED FROM SERVER');
            console.log('> WEATHER API KEY:', CONFIG.weatherApiKey ? CONFIG.weatherApiKey.substring(0, 8) + '...' : 'NOT SET');
            return true;
        } else {
            console.warn('> CONFIG ENDPOINT NOT AVAILABLE - USING DEFAULTS');
            return false;
        }
    } catch (error) {
        console.error('> ERROR LOADING CONFIG:', error);
        console.warn('> USING DEFAULT CONFIG VALUES');
        return false;
    }
}

// State
let images = [];
let currentImageIndex = 0;
let currentNewsSourceIndex = 0;
let currentWeatherSourceIndex = 0;
let currentVideoIndex = 0;

// News sources
const NEWS_SOURCES = ['HACKERNEWS', 'NYTIMES', 'DEVTO'];

// YouTube Videos - Cyberpunk themed
const YOUTUBE_VIDEOS = [
    { id: '4xDzrJKXOOY', title: 'Synthwave Goose' },
    { id: 'MV_3Dpw-BRY', title: 'Cyberpunk Music Mix' },
    { id: 'jvipPYFebWc', title: 'Blade Runner Blues' },
    { id: 'MVPTGNGiI-4', title: 'The Midnight Synthwave' },
    { id: 'WLSNPkf8RCQ', title: 'Neon Tokyo Night Drive' }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('> CYBER TERMINAL INITIALIZING...');

    // Load configuration first
    await loadConfig();

    // Update location display in footer
    const locationDisplay = document.getElementById('location-display');
    if (locationDisplay && CONFIG.zipCode) {
        locationDisplay.textContent = CONFIG.zipCode;
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    loadVideos();
    fetchWeatherOrFinancial();
    fetchNews();
    initCyberspace();

    // Set update intervals
    setInterval(() => {
        currentWeatherSourceIndex = (currentWeatherSourceIndex + 1) % 2;
        fetchWeatherOrFinancial();
    }, CONFIG.weatherCycleInterval);

    setInterval(() => {
        currentNewsSourceIndex = (currentNewsSourceIndex + 1) % NEWS_SOURCES.length;
        fetchNews();
    }, CONFIG.newsUpdateInterval);
});

// Update Time and Date
function updateDateTime() {
    const now = new Date();

    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const dateString = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    document.getElementById('current-time').textContent = timeString;
    document.getElementById('current-date').textContent = dateString.replace(/\//g, '.');
}

// Load and Display YouTube Videos
function loadVideos() {
    try {
        if (YOUTUBE_VIDEOS.length > 0) {
            displayCurrentVideo();
            setInterval(nextVideo, CONFIG.imageChangeInterval); // Use same interval as before
            document.getElementById('video-status').textContent = 'ACTIVE';
        } else {
            document.getElementById('video-status').textContent = 'NO_VIDEOS';
        }
    } catch (error) {
        console.error('> ERROR LOADING VIDEOS:', error);
        document.getElementById('video-status').textContent = 'ERROR';
    }
}

function displayCurrentVideo() {
    if (YOUTUBE_VIDEOS.length === 0) return;

    const video = YOUTUBE_VIDEOS[currentVideoIndex];
    const thumbnailElement = document.getElementById('video-thumbnail');

    // YouTube thumbnail URL format: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
    // Or hqdefault.jpg for guaranteed availability
    const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

    thumbnailElement.style.opacity = '0';

    setTimeout(() => {
        thumbnailElement.src = thumbnailUrl;
        thumbnailElement.alt = video.title;
        thumbnailElement.style.transition = 'opacity 1s ease-in-out';
        thumbnailElement.style.opacity = '1';
    }, 500);
}

function nextVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % YOUTUBE_VIDEOS.length;
    displayCurrentVideo();
}

// Fetch Weather Data
async function fetchWeather() {
    const statusEl = document.getElementById('weather-status');
    const contentEl = document.getElementById('weather-content');

    // Check if API key is set
    if (CONFIG.weatherApiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
        statusEl.textContent = 'API_KEY_REQUIRED';
        contentEl.innerHTML = `
            <div class="weather-current">
                <div class="weather-temp">--°</div>
                <div class="weather-condition">SET API KEY IN js/app.js</div>
            </div>
        `;
        return;
    }

    try {
        statusEl.textContent = 'SYNCING...';

        // Current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${CONFIG.zipCode},us&units=imperial&appid=${CONFIG.weatherApiKey}`;
        const currentResponse = await fetch(currentUrl);

        if (!currentResponse.ok) {
            throw new Error(`HTTP error! status: ${currentResponse.status}`);
        }

        const currentData = await currentResponse.json();

        // Forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?zip=${CONFIG.zipCode},us&units=imperial&appid=${CONFIG.weatherApiKey}`;
        const forecastResponse = await fetch(forecastUrl);

        if (!forecastResponse.ok) {
            throw new Error(`HTTP error! status: ${forecastResponse.status}`);
        }

        const forecastData = await forecastResponse.json();

        // Get forecast for next 3 days (at noon)
        const forecastItems = [];
        const processedDays = new Set();

        for (const item of forecastData.list) {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const hour = date.getHours();

            // Get forecast around noon (12:00)
            if (hour === 12 && !processedDays.has(day) && forecastItems.length < 3) {
                forecastItems.push({
                    day: day.toUpperCase(),
                    temp: Math.round(item.main.temp),
                    desc: item.weather[0].main.toUpperCase()
                });
                processedDays.add(day);
            }
        }

        // Rebuild the entire weather content structure
        contentEl.innerHTML = `
            <div class="weather-current">
                <div class="weather-temp">${Math.round(currentData.main.temp)}°F</div>
                <div class="weather-condition">${currentData.weather[0].description.toUpperCase()}</div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <span class="label">FEELS_LIKE:</span>
                        <span>${Math.round(currentData.main.feels_like)}°F</span>
                    </div>
                    <div class="weather-detail">
                        <span class="label">HUMIDITY:</span>
                        <span>${currentData.main.humidity}%</span>
                    </div>
                </div>
            </div>
            <div class="weather-forecast">
                ${forecastItems.map(item => `
                    <div class="forecast-item">
                        <div class="forecast-day">${item.day}</div>
                        <div class="forecast-temp">${item.temp}°F</div>
                        <div class="forecast-desc">${item.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;

        statusEl.textContent = 'ONLINE';
    } catch (error) {
        console.error('> ERROR FETCHING WEATHER:', error);
        statusEl.textContent = 'ERROR';
        contentEl.innerHTML = `
            <div class="weather-current">
                <div class="weather-temp">--°</div>
                <div class="weather-condition">CONNECTION FAILED</div>
            </div>
        `;
    }
}

// Fetch Weather or Financial Data (cycling)
async function fetchWeatherOrFinancial() {
    if (currentWeatherSourceIndex === 0) {
        document.getElementById('weather-source').textContent = '[WEATHER]';
        await fetchWeather();
    } else {
        document.getElementById('weather-source').textContent = '[MARKETS]';
        await fetchFinancial();
    }
}

// Fetch Financial Market Data
async function fetchFinancial() {
    const statusEl = document.getElementById('weather-status');
    const contentEl = document.getElementById('weather-content');

    try {
        statusEl.textContent = 'SYNCING...';

        // Using free financial API endpoints
        // Note: For production, consider using a proper API key from Alpha Vantage, Finnhub, etc.

        // Fetch major indices and commodities
        const financialData = await fetchFinancialData();

        // Display financial data
        contentEl.innerHTML = `
            <div class="financial-grid">
                <div class="financial-item">
                    <div class="financial-label">DOW JONES</div>
                    <div class="financial-value ${financialData.dow.change >= 0 ? 'positive' : 'negative'}">
                        ${financialData.dow.price}
                        <span class="financial-change">${financialData.dow.change >= 0 ? '+' : ''}${financialData.dow.change}%</span>
                    </div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">S&P 500</div>
                    <div class="financial-value ${financialData.sp500.change >= 0 ? 'positive' : 'negative'}">
                        ${financialData.sp500.price}
                        <span class="financial-change">${financialData.sp500.change >= 0 ? '+' : ''}${financialData.sp500.change}%</span>
                    </div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">NASDAQ</div>
                    <div class="financial-value ${financialData.nasdaq.change >= 0 ? 'positive' : 'negative'}">
                        ${financialData.nasdaq.price}
                        <span class="financial-change">${financialData.nasdaq.change >= 0 ? '+' : ''}${financialData.nasdaq.change}%</span>
                    </div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">GOLD (oz)</div>
                    <div class="financial-value">
                        $${financialData.gold.price}
                        <span class="financial-change ${financialData.gold.change >= 0 ? 'positive' : 'negative'}">${financialData.gold.change >= 0 ? '+' : ''}${financialData.gold.change}%</span>
                    </div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">USD/EUR</div>
                    <div class="financial-value">
                        €${financialData.usdeur.rate}
                        <span class="financial-change ${financialData.usdeur.change >= 0 ? 'positive' : 'negative'}">${financialData.usdeur.change >= 0 ? '+' : ''}${financialData.usdeur.change}%</span>
                    </div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">LAST UPDATE</div>
                    <div class="financial-value financial-time">
                        ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                </div>
            </div>
        `;

        statusEl.textContent = 'ONLINE';
    } catch (error) {
        console.error('> ERROR FETCHING FINANCIAL DATA:', error);
        statusEl.textContent = 'ERROR';
        contentEl.innerHTML = '<div class="error-message">MARKET DATA UNAVAILABLE</div>';
    }
}

// Fetch financial data from local system monitor server
async function fetchFinancialData() {
    try {
        const response = await fetch('http://localhost:3001/financial');

        if (!response.ok) {
            throw new Error('Failed to fetch financial data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('> ERROR IN fetchFinancialData:', error);
        // Return placeholder data with message
        return {
            dow: { price: 'N/A', change: 0 },
            sp500: { price: 'N/A', change: 0 },
            nasdaq: { price: 'N/A', change: 0 },
            gold: { price: 'N/A', change: 0 },
            usdeur: { rate: 'N/A', change: 0 }
        };
    }
}

// Main News Fetcher (cycles through sources)
async function fetchNews() {
    const source = NEWS_SOURCES[currentNewsSourceIndex];
    document.getElementById('news-source').textContent = `[${source}]`;

    switch(source) {
        case 'HACKERNEWS':
            await fetchHackerNews();
            break;
        case 'NYTIMES':
            await fetchNYTimes();
            break;
        case 'DEVTO':
            await fetchDevTo();
            break;
    }
}

// Fetch Hacker News Top Stories
async function fetchHackerNews() {
    const statusEl = document.getElementById('news-status');
    const feedEl = document.getElementById('news-feed');

    try {
        statusEl.textContent = 'STREAMING...';

        // Get top stories
        const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
        const response = await fetch(topStoriesUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const storyIds = await response.json();

        // Get first 15 stories
        const stories = [];
        for (let i = 0; i < Math.min(15, storyIds.length); i++) {
            const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`;
            const storyResponse = await fetch(storyUrl);

            if (storyResponse.ok) {
                const story = await storyResponse.json();
                stories.push(story);
            }
        }

        // Display stories
        feedEl.innerHTML = stories.map((story, index) => {
            const points = story.score || 0;
            const comments = story.descendants || 0;
            const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

            return `
                <div class="news-item" onclick="window.open('${url}', '_blank')">
                    <div>
                        <span class="news-rank">${index + 1}.</span>
                        <span class="news-title">${escapeHtml(story.title)}</span>
                    </div>
                    <div class="news-meta">
                        <span class="news-points">${points} PTS</span> |
                        <span>${comments} COMMENTS</span>
                    </div>
                </div>
            `;
        }).join('');

        statusEl.textContent = 'ONLINE';
    } catch (error) {
        console.error('> ERROR FETCHING HACKER NEWS:', error);
        statusEl.textContent = 'ERROR';
        feedEl.innerHTML = '<div class="news-item">CONNECTION FAILED - RETRYING...</div>';
    }
}

// Fetch NY Times Top Stories
async function fetchNYTimes() {
    const statusEl = document.getElementById('news-status');
    const feedEl = document.getElementById('news-feed');

    try {
        statusEl.textContent = 'STREAMING...';

        // Check if API key is set
        if (CONFIG.nytApiKey === 'YOUR_NYT_API_KEY') {
            statusEl.textContent = 'API_KEY_REQUIRED';
            feedEl.innerHTML = '<div class="news-item">NYT API KEY REQUIRED - SET IN js/app.js<br>Get free key at: developer.nytimes.com</div>';
            return;
        }

        const url = `https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=${CONFIG.nytApiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const stories = data.results.slice(0, 15);

        feedEl.innerHTML = stories.map((story, index) => {
            const url = story.url;
            const abstract = story.abstract || 'No description available';

            return `
                <div class="news-item" onclick="window.open('${url}', '_blank')">
                    <div>
                        <span class="news-rank">${index + 1}.</span>
                        <span class="news-title">${escapeHtml(story.title)}</span>
                    </div>
                    <div class="news-abstract">${escapeHtml(abstract)}</div>
                    <div class="news-meta">
                        <span>${story.section.toUpperCase()}</span> |
                        <span>${story.byline || 'NYT'}</span>
                    </div>
                </div>
            `;
        }).join('');

        statusEl.textContent = 'ONLINE';
    } catch (error) {
        console.error('> ERROR FETCHING NY TIMES:', error);
        statusEl.textContent = 'ERROR';
        feedEl.innerHTML = '<div class="news-item">CONNECTION FAILED - RETRYING...</div>';
    }
}

// Fetch Reddit r/cyberdeck
async function fetchReddit() {
    const statusEl = document.getElementById('news-status');
    const feedEl = document.getElementById('news-feed');

    try {
        statusEl.textContent = 'STREAMING...';

        const url = 'https://www.reddit.com/r/cyberdeck/hot.json?limit=15';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CyberKiosk/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const posts = data.data.children;

        feedEl.innerHTML = posts.map((post, index) => {
            const postData = post.data;
            const score = postData.score || 0;
            const comments = postData.num_comments || 0;
            const url = `https://www.reddit.com${postData.permalink}`;

            return `
                <div class="news-item" onclick="window.open('${url}', '_blank')">
                    <div>
                        <span class="news-rank">${index + 1}.</span>
                        <span class="news-title">${escapeHtml(postData.title)}</span>
                    </div>
                    <div class="news-meta">
                        <span class="news-points">${score} ↑</span> |
                        <span>${comments} COMMENTS</span> |
                        <span>u/${postData.author}</span>
                    </div>
                </div>
            `;
        }).join('');

        statusEl.textContent = 'ONLINE';
    } catch (error) {
        console.error('> ERROR FETCHING REDDIT:', error);
        statusEl.textContent = 'ERROR';
        feedEl.innerHTML = '<div class="news-item">CONNECTION FAILED - RETRYING...</div>';
    }
}

// Fetch Dev.to Articles
async function fetchDevTo() {
    const statusEl = document.getElementById('news-status');
    const feedEl = document.getElementById('news-feed');

    try {
        statusEl.textContent = 'STREAMING...';

        const url = 'https://dev.to/api/articles?top=7';
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const articles = await response.json();
        const topArticles = articles.slice(0, 15);

        feedEl.innerHTML = topArticles.map((article, index) => {
            const reactions = article.public_reactions_count || 0;
            const comments = article.comments_count || 0;
            const url = article.url;
            const tags = article.tag_list ? article.tag_list.slice(0, 3).join(', ').toUpperCase() : '';

            return `
                <div class="news-item" onclick="window.open('${url}', '_blank')">
                    <div>
                        <span class="news-rank">${index + 1}.</span>
                        <span class="news-title">${escapeHtml(article.title)}</span>
                    </div>
                    <div class="news-meta">
                        <span class="news-points">${reactions} ❤️</span> |
                        <span>${comments} COMMENTS</span>
                        ${tags ? ` | <span>${tags}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        statusEl.textContent = 'ONLINE';
    } catch (error) {
        console.error('> ERROR FETCHING DEV.TO:', error);
        statusEl.textContent = 'ERROR';
        feedEl.innerHTML = '<div class="news-item">CONNECTION FAILED - RETRYING...</div>';
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize Cyberspace Widget
function initCyberspace() {
    const statusEl = document.getElementById('cyberspace-status');
    const iframe = document.getElementById('cyberspace-preview');

    // Update status when iframe loads
    iframe.addEventListener('load', () => {
        statusEl.textContent = 'ONLINE';
        console.log('> CYBERSPACE CONNECTED');
    });

    // Update status on error
    iframe.addEventListener('error', () => {
        statusEl.textContent = 'ERROR';
        console.error('> CYBERSPACE CONNECTION FAILED');
    });
}

// Burn-in Prevention
let inactivityTimer;
let isDimmed = false;
const INACTIVITY_TIMEOUT = 1800000; // 30 minutes before dimming

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (isDimmed) {
        brightenScreen();
    }
    inactivityTimer = setTimeout(dimScreen, INACTIVITY_TIMEOUT);
}

function dimScreen() {
    document.body.style.filter = 'brightness(0.4)';
    isDimmed = true;
    console.log('> SCREEN DIMMED FOR BURN-IN PREVENTION');
}

function brightenScreen() {
    document.body.style.filter = 'brightness(1)';
    isDimmed = false;
    console.log('> SCREEN BRIGHTNESS RESTORED');
}

// Add event listeners for user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
});

// Start inactivity timer
resetInactivityTimer();

// Subtle position shifts every few minutes to prevent burn-in
setInterval(() => {
    const randomX = Math.floor(Math.random() * 5) - 2; // -2 to 2 pixels
    const randomY = Math.floor(Math.random() * 5) - 2;
    document.querySelector('.container').style.transform = `translate(${randomX}px, ${randomY}px)`;
}, 300000); // Every 5 minutes

// Modal functionality
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

// Store current data for modals
let currentWeatherData = null;
let currentSystemData = null;
let cachedNewsData = {
    hackernews: [],
    nytimes: [],
    devto: []
};

function openModal(title, content) {
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// Close modal on X button click
modalClose.addEventListener('click', closeModal);

// Close modal on overlay click (but not on container click)
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// Exit button - click bottom right corner to close kiosk
const exitButton = document.getElementById('exit-button');
if (exitButton) {
    exitButton.addEventListener('click', () => {
        console.log('> EXIT BUTTON CLICKED - CLOSING KIOSK');
        window.close();
        // Fallback: try to navigate to blank page if window.close() doesn't work
        setTimeout(() => {
            window.location.href = 'about:blank';
        }, 100);
    });
}

// INFO_FEED panel click handler
document.querySelector('.weather-widget').addEventListener('click', async () => {
    if (currentWeatherSourceIndex === 0) {
        // Weather view with 5-day forecast
        await showWeatherModal();
    } else {
        // Markets view
        showMarketsModal();
    }
});

// CY_SPC panel click handler
document.querySelector('.cyberspace-widget').addEventListener('click', () => {
    showCyberspaceModal();
});

// VID panel click handler
document.querySelector('.video-widget').addEventListener('click', () => {
    showVideoModal();
});

// NEWS_FEED panel click handler
document.querySelector('.news-widget').addEventListener('click', async () => {
    await showNewsModal();
});

// CONNECTION:SECURE footer click handler
document.querySelector('#connection-status').addEventListener('click', async () => {
    await showPiholeModal();
});

// STATUS:ONLINE footer click handler
document.querySelector('#network-status').addEventListener('click', async () => {
    await showNetworkModal();
});

// Show Weather Modal with 5-day forecast
async function showWeatherModal() {
    try {
        const statusMsg = '<div style="text-align: center; font-size: 1.5rem; color: var(--neon-cyan);">LOADING WEATHER DATA...</div>';
        openModal('&gt; WEATHER_EXPANDED', statusMsg);

        // Check if API key is set
        if (CONFIG.weatherApiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
            modalContent.innerHTML = '<div class="error-message">API KEY REQUIRED - SET IN js/app.js</div>';
            return;
        }

        // Fetch current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${CONFIG.zipCode},us&units=imperial&appid=${CONFIG.weatherApiKey}`;
        const currentResponse = await fetch(currentUrl);
        if (!currentResponse.ok) throw new Error('Failed to fetch weather');
        const currentData = await currentResponse.json();

        // Fetch 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?zip=${CONFIG.zipCode},us&units=imperial&appid=${CONFIG.weatherApiKey}`;
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) throw new Error('Failed to fetch forecast');
        const forecastData = await forecastResponse.json();

        // Process 5-day forecast (one entry per day, preferably around noon)
        // Group forecast items by date
        const forecastByDay = {};

        for (const item of forecastData.list) {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();

            if (!forecastByDay[dayKey]) {
                forecastByDay[dayKey] = [];
            }
            forecastByDay[dayKey].push(item);
        }

        // Get up to 5 days, selecting the item closest to noon (12:00)
        const dailyForecasts = [];
        const dayKeys = Object.keys(forecastByDay).slice(0, 5);

        for (const dayKey of dayKeys) {
            const dayItems = forecastByDay[dayKey];

            // Find item closest to noon (12:00)
            let bestItem = dayItems[0];
            let bestDiff = Math.abs(new Date(dayItems[0].dt * 1000).getHours() - 12);

            for (const item of dayItems) {
                const hour = new Date(item.dt * 1000).getHours();
                const diff = Math.abs(hour - 12);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestItem = item;
                }
            }

            const date = new Date(bestItem.dt * 1000);
            dailyForecasts.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                temp: Math.round(bestItem.main.temp),
                tempMin: Math.round(bestItem.main.temp_min),
                tempMax: Math.round(bestItem.main.temp_max),
                desc: bestItem.weather[0].description.toUpperCase(),
                humidity: bestItem.main.humidity,
                wind: Math.round(bestItem.wind.speed)
            });
        }

        const content = `
            <div class="modal-weather-expanded">
                <div class="modal-weather-current">
                    <div class="modal-weather-temp">${Math.round(currentData.main.temp)}°F</div>
                    <div class="modal-weather-condition">${currentData.weather[0].description.toUpperCase()}</div>
                    <div class="modal-weather-details">
                        <div class="modal-weather-detail">
                            <span class="label">FEELS_LIKE:</span>
                            <span>${Math.round(currentData.main.feels_like)}°F</span>
                        </div>
                        <div class="modal-weather-detail">
                            <span class="label">HUMIDITY:</span>
                            <span>${currentData.main.humidity}%</span>
                        </div>
                        <div class="modal-weather-detail">
                            <span class="label">WIND:</span>
                            <span>${Math.round(currentData.wind.speed)} MPH</span>
                        </div>
                        <div class="modal-weather-detail">
                            <span class="label">PRESSURE:</span>
                            <span>${currentData.main.pressure} hPa</span>
                        </div>
                    </div>
                </div>
                <div class="modal-forecast">
                    <div class="modal-forecast-title">5-DAY FORECAST</div>
                    <div class="modal-forecast-grid">
                        ${dailyForecasts.map(day => `
                            <div class="modal-forecast-item">
                                <div class="modal-forecast-day">${day.day}</div>
                                <div class="modal-forecast-temp">${day.temp}°F</div>
                                <div class="modal-forecast-desc">${day.desc}</div>
                                <div class="modal-weather-detail" style="margin-top: 10px; font-size: 1.2rem;">
                                    <span class="label">HIGH/LOW:</span>
                                    <span>${day.tempMax}° / ${day.tempMin}°</span>
                                </div>
                                <div class="modal-weather-detail" style="font-size: 1.2rem;">
                                    <span class="label">HUMIDITY:</span>
                                    <span>${day.humidity}%</span>
                                </div>
                                <div class="modal-weather-detail" style="font-size: 1.2rem;">
                                    <span class="label">WIND:</span>
                                    <span>${day.wind} MPH</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = content;
    } catch (error) {
        console.error('> ERROR SHOWING WEATHER MODAL:', error);
        modalContent.innerHTML = '<div class="error-message">FAILED TO LOAD WEATHER DATA</div>';
    }
}

// Show Markets Modal
async function showMarketsModal() {
    try {
        const statusMsg = '<div style="text-align: center; font-size: 1.5rem; color: var(--neon-cyan);">LOADING MARKET DATA...</div>';
        openModal('&gt; MARKETS_EXPANDED', statusMsg);

        const financialData = await fetchFinancialData();

        const content = `
            <div class="modal-financial-grid">
                <div class="modal-financial-item">
                    <div class="modal-financial-label">DOW JONES INDUSTRIAL AVERAGE</div>
                    <div class="modal-financial-value ${financialData.dow.change >= 0 ? 'positive' : 'negative'}">
                        ${financialData.dow.price}
                        <span class="modal-financial-change ${financialData.dow.change >= 0 ? 'positive' : 'negative'}">
                            ${financialData.dow.change >= 0 ? '+' : ''}${financialData.dow.change}%
                        </span>
                    </div>
                </div>
                <div class="modal-financial-item">
                    <div class="modal-financial-label">S&P 500 INDEX</div>
                    <div class="modal-financial-value ${financialData.sp500.change >= 0 ? 'positive' : 'negative'}">
                        ${financialData.sp500.price}
                        <span class="modal-financial-change ${financialData.sp500.change >= 0 ? 'positive' : 'negative'}">
                            ${financialData.sp500.change >= 0 ? '+' : ''}${financialData.sp500.change}%
                        </span>
                    </div>
                </div>
                <div class="modal-financial-item">
                    <div class="modal-financial-label">NASDAQ COMPOSITE</div>
                    <div class="modal-financial-value ${financialData.nasdaq.change >= 0 ? 'positive' : 'negative'}">
                        ${financialData.nasdaq.price}
                        <span class="modal-financial-change ${financialData.nasdaq.change >= 0 ? 'positive' : 'negative'}">
                            ${financialData.nasdaq.change >= 0 ? '+' : ''}${financialData.nasdaq.change}%
                        </span>
                    </div>
                </div>
                <div class="modal-financial-item">
                    <div class="modal-financial-label">GOLD (per oz)</div>
                    <div class="modal-financial-value">
                        $${financialData.gold.price}
                        <span class="modal-financial-change ${financialData.gold.change >= 0 ? 'positive' : 'negative'}">
                            ${financialData.gold.change >= 0 ? '+' : ''}${financialData.gold.change}%
                        </span>
                    </div>
                </div>
                <div class="modal-financial-item">
                    <div class="modal-financial-label">USD / EUR EXCHANGE</div>
                    <div class="modal-financial-value">
                        €${financialData.usdeur.rate}
                        <span class="modal-financial-change ${financialData.usdeur.change >= 0 ? 'positive' : 'negative'}">
                            ${financialData.usdeur.change >= 0 ? '+' : ''}${financialData.usdeur.change}%
                        </span>
                    </div>
                </div>
                <div class="modal-financial-item">
                    <div class="modal-financial-label">LAST UPDATE</div>
                    <div class="modal-financial-value">
                        <span style="color: var(--neon-amber);">
                            ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = content;
    } catch (error) {
        console.error('> ERROR SHOWING MARKETS MODAL:', error);
        modalContent.innerHTML = '<div class="error-message">FAILED TO LOAD MARKET DATA</div>';
    }
}

// Show Cyberspace Modal
function showCyberspaceModal() {
    const content = `
        <iframe id="cyberspace-modal-iframe"
                src="https://cyberspace.online"
                frameborder="0"
                allow="clipboard-write; clipboard-read"
                style="width: 100%; height: 100%; border: none; background: #000;">
        </iframe>
    `;

    openModal('&gt; CYBERSPACE_PORTAL', content);

    // Add RELOAD button to modal header (next to close button)
    const modalHeader = document.querySelector('.modal-header');
    const closeButton = document.getElementById('modal-close');

    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'RELOAD';
    reloadButton.className = 'modal-reload';
    reloadButton.onclick = reloadCyberspaceIframe;

    modalHeader.insertBefore(reloadButton, closeButton);

    console.log('> CYBERSPACE PORTAL OPENED');
}

// Helper function to reload the cyberspace iframe
function reloadCyberspaceIframe() {
    const iframe = document.getElementById('cyberspace-modal-iframe');
    if (iframe) {
        iframe.src = iframe.src;
        console.log('> CYBERSPACE IFRAME RELOADED');
    }
}

// Show Video Modal with YouTube Player and Search
function showVideoModal() {
    const currentVideo = YOUTUBE_VIDEOS[currentVideoIndex];

    // Create a video selector showing default videos
    const videoList = YOUTUBE_VIDEOS.map((video, index) => `
        <div class="video-selector-item ${index === currentVideoIndex ? 'active' : ''}"
             onclick="loadYouTubeVideo('${video.id}', '${escapeHtml(video.title)}')">
            <img src="https://img.youtube.com/vi/${video.id}/default.jpg" alt="${escapeHtml(video.title)}">
            <span>${escapeHtml(video.title)}</span>
        </div>
    `).join('');

    const content = `
        <div class="modal-video-container">
            <div class="modal-video-player">
                <iframe
                    id="youtube-player"
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/${currentVideo.id}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
            <div class="modal-video-selector">
                <div class="modal-video-search">
                    <input type="text"
                           id="video-search-input"
                           class="video-search-input"
                           placeholder="SEARCH YOUTUBE..."
                           onkeypress="if(event.key === 'Enter') searchYouTubeVideos()">
                    <button onclick="searchYouTubeVideos()" class="video-search-button">SEARCH</button>
                </div>
                <div class="modal-video-selector-title" id="video-selector-title">&gt; VIDEO_QUEUE</div>
                <div class="modal-video-selector-grid" id="video-selector-grid">
                    ${videoList}
                </div>
            </div>
        </div>
    `;
    openModal('&gt; VIDEO_PLAYER', content);
}

// Helper function to load a different YouTube video in the modal
function loadYouTubeVideo(videoId, title) {
    console.log('Loading video:', videoId);
    const iframe = document.getElementById('youtube-player');
    if (iframe) {
        // Use embed URL for proper playback
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        console.log('Set iframe src to:', iframe.src);
    } else {
        console.error('YouTube player iframe not found!');
    }

    // Update active state on video selector items
    document.querySelectorAll('.video-selector-item').forEach(item => {
        item.classList.remove('active');
    });

    // Find and mark the clicked item as active
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// Search YouTube videos using YouTube Data API
async function searchYouTubeVideos() {
    const searchInput = document.getElementById('video-search-input');
    const query = searchInput.value.trim();

    if (!query) {
        return;
    }

    // Check if API key is set
    if (CONFIG.youtubeApiKey === 'YOUR_YOUTUBE_API_KEY') {
        const gridEl = document.getElementById('video-selector-grid');
        gridEl.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                YOUTUBE API KEY REQUIRED<br>
                Get free key at: console.cloud.google.com/apis/credentials<br>
                Enable YouTube Data API v3 and set key in js/app.js
            </div>
        `;
        return;
    }

    const titleEl = document.getElementById('video-selector-title');
    const gridEl = document.getElementById('video-selector-grid');

    try {
        titleEl.textContent = '> SEARCHING...';

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${CONFIG.youtubeApiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            titleEl.textContent = `> SEARCH RESULTS: "${query}"`;

            const searchResults = data.items.map(item => `
                <div class="video-selector-item"
                     onclick="loadYouTubeVideo('${item.id.videoId}', '${escapeHtml(item.snippet.title)}')">
                    <img src="${item.snippet.thumbnails.default.url}" alt="${escapeHtml(item.snippet.title)}">
                    <span>${escapeHtml(item.snippet.title)}</span>
                </div>
            `).join('');

            gridEl.innerHTML = searchResults;
        } else {
            titleEl.textContent = '> NO RESULTS FOUND';
            gridEl.innerHTML = '<div class="error-message" style="grid-column: 1 / -1;">NO VIDEOS FOUND</div>';
        }
    } catch (error) {
        console.error('> ERROR SEARCHING YOUTUBE:', error);
        titleEl.textContent = '> SEARCH ERROR';
        gridEl.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                SEARCH FAILED: ${error.message}<br>
                Check API key and quota limits
            </div>
        `;
    }
}

// Show News Modal with all 3 sources
async function showNewsModal() {
    try {
        const statusMsg = '<div style="text-align: center; font-size: 1.5rem; color: var(--neon-cyan);">LOADING NEWS FEEDS...</div>';
        openModal('&gt; NEWS_AGGREGATOR', statusMsg);

        // Fetch all news sources
        await Promise.all([
            fetchNewsForModal('HACKERNEWS'),
            fetchNewsForModal('NYTIMES'),
            fetchNewsForModal('DEVTO')
        ]);

        const content = `
            <div class="modal-news-section">
                <div class="modal-news-source-title">&gt; HACKER NEWS</div>
                ${cachedNewsData.hackernews.map((story, index) => `
                    <div class="modal-news-item" onclick="window.open('${story.url}', '_blank')">
                        <div>
                            <span class="news-rank">${index + 1}.</span>
                            <span class="modal-news-title">${escapeHtml(story.title)}</span>
                        </div>
                        <div class="modal-news-meta">
                            <span class="news-points">${story.points} PTS</span> |
                            <span>${story.comments} COMMENTS</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="modal-news-section">
                <div class="modal-news-source-title">&gt; NEW YORK TIMES</div>
                ${cachedNewsData.nytimes.map((story, index) => `
                    <div class="modal-news-item" onclick="window.open('${story.url}', '_blank')">
                        <div>
                            <span class="news-rank">${index + 1}.</span>
                            <span class="modal-news-title">${escapeHtml(story.title)}</span>
                        </div>
                        ${story.abstract ? `<div class="modal-news-abstract">${escapeHtml(story.abstract)}</div>` : ''}
                        <div class="modal-news-meta">
                            <span>${story.section}</span> | <span>${story.byline || 'NYT'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="modal-news-section">
                <div class="modal-news-source-title">&gt; DEV.TO</div>
                ${cachedNewsData.devto.map((story, index) => `
                    <div class="modal-news-item" onclick="window.open('${story.url}', '_blank')">
                        <div>
                            <span class="news-rank">${index + 1}.</span>
                            <span class="modal-news-title">${escapeHtml(story.title)}</span>
                        </div>
                        <div class="modal-news-meta">
                            <span class="news-points">${story.reactions} ❤️</span> |
                            <span>${story.comments} COMMENTS</span>
                            ${story.tags ? ` | <span>${story.tags}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        modalContent.innerHTML = content;
    } catch (error) {
        console.error('> ERROR SHOWING NEWS MODAL:', error);
        modalContent.innerHTML = '<div class="error-message">FAILED TO LOAD NEWS FEEDS</div>';
    }
}

// Fetch news for modal
async function fetchNewsForModal(source) {
    try {
        switch(source) {
            case 'HACKERNEWS':
                const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
                const response = await fetch(topStoriesUrl);
                if (!response.ok) throw new Error('HN fetch failed');
                const storyIds = await response.json();

                const stories = [];
                for (let i = 0; i < Math.min(10, storyIds.length); i++) {
                    const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`;
                    const storyResponse = await fetch(storyUrl);
                    if (storyResponse.ok) {
                        const story = await storyResponse.json();
                        stories.push({
                            title: story.title,
                            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                            points: story.score || 0,
                            comments: story.descendants || 0
                        });
                    }
                }
                cachedNewsData.hackernews = stories;
                break;

            case 'NYTIMES':
                if (CONFIG.nytApiKey === 'YOUR_NYT_API_KEY') {
                    cachedNewsData.nytimes = [{
                        title: 'NYT API KEY REQUIRED',
                        url: 'https://developer.nytimes.com/',
                        abstract: 'Get a free API key at developer.nytimes.com',
                        section: 'CONFIG',
                        byline: 'SYSTEM'
                    }];
                    break;
                }

                const nytUrl = `https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=${CONFIG.nytApiKey}`;
                const nytResponse = await fetch(nytUrl);
                if (!nytResponse.ok) throw new Error('NYT fetch failed');
                const nytData = await nytResponse.json();

                cachedNewsData.nytimes = nytData.results.slice(0, 10).map(story => ({
                    title: story.title,
                    url: story.url,
                    abstract: story.abstract,
                    section: story.section.toUpperCase(),
                    byline: story.byline
                }));
                break;

            case 'DEVTO':
                const devtoUrl = 'https://dev.to/api/articles?top=7';
                const devtoResponse = await fetch(devtoUrl);
                if (!devtoResponse.ok) throw new Error('Dev.to fetch failed');
                const devtoData = await devtoResponse.json();

                cachedNewsData.devto = devtoData.slice(0, 10).map(article => ({
                    title: article.title,
                    url: article.url,
                    reactions: article.public_reactions_count || 0,
                    comments: article.comments_count || 0,
                    tags: article.tag_list ? article.tag_list.slice(0, 3).join(', ').toUpperCase() : ''
                }));
                break;
        }
    } catch (error) {
        console.error(`> ERROR FETCHING ${source} FOR MODAL:`, error);
    }
}

// Show Pi-hole Network Shield Modal
async function showPiholeModal() {
    try {
        const statusMsg = '<div style="text-align: center; font-size: 1.5rem; color: var(--neon-cyan);">LOADING NETWORK SHIELD DATA...</div>';
        openModal('&gt; NETWORK_SHIELD', statusMsg);

        // Fetch Pi-hole stats from backend
        const response = await fetch('http://localhost:3001/pihole');
        if (!response.ok) throw new Error('Failed to fetch Pi-hole stats');
        const data = await response.json();

        if (data.status === 'error') {
            modalContent.innerHTML = '<div class="error-message">NETWORK SHIELD ERROR - ' + (data.error || 'UNKNOWN ERROR') + '</div>';
            return;
        }

        // Format the stats display
        const percentBlocked = parseFloat(data.percent_blocked);
        const blockedRatio = `${data.blocked_today}/${data.queries_today}`;

        const content = `
            <div style="padding: 1rem;">
                <div style="margin-bottom: 2rem; text-align: center;">
                    <div style="font-size: 4rem; color: var(--neon-green); text-shadow: 0 0 10px var(--neon-green);">
                        ${percentBlocked.toFixed(1)}%
                    </div>
                    <div style="font-size: 1.3rem; color: var(--neon-cyan); margin-top: 0.5rem;">
                        THREATS NEUTRALIZED
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="border: 1px solid var(--neon-cyan); padding: 1rem; background: rgba(0, 255, 255, 0.05);">
                        <div style="color: var(--neon-cyan); font-size: 1rem; margin-bottom: 0.5rem;">QUERIES TODAY</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${data.queries_today.toLocaleString()}</div>
                    </div>
                    <div style="border: 1px solid var(--neon-green); padding: 1rem; background: rgba(0, 255, 0, 0.05);">
                        <div style="color: var(--neon-green); font-size: 1rem; margin-bottom: 0.5rem;">BLOCKED TODAY</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${data.blocked_today.toLocaleString()}</div>
                    </div>
                    <div style="border: 1px solid var(--neon-cyan); padding: 1rem; background: rgba(0, 255, 255, 0.05);">
                        <div style="color: var(--neon-cyan); font-size: 1rem; margin-bottom: 0.5rem;">CACHED</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${data.cached_queries.toLocaleString()}</div>
                    </div>
                    <div style="border: 1px solid var(--neon-purple); padding: 1rem; background: rgba(138, 43, 226, 0.05);">
                        <div style="color: var(--neon-purple); font-size: 1rem; margin-bottom: 0.5rem;">FORWARDED</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${data.forwarded_queries.toLocaleString()}</div>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--neon-cyan); padding-top: 1rem; font-size: 1.3rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="color: var(--neon-cyan);">BLOCKLIST SIZE:</span>
                        <span style="color: var(--text-primary); font-family: monospace;">${data.domains_blocked.toLocaleString()} DOMAINS</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="color: var(--neon-cyan);">UNIQUE DOMAINS:</span>
                        <span style="color: var(--text-primary); font-family: monospace;">${data.unique_domains.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="color: var(--neon-cyan);">ACTIVE CLIENTS:</span>
                        <span style="color: var(--text-primary); font-family: monospace;">${data.clients}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--neon-cyan);">PROTECTION STATUS:</span>
                        <span style="color: var(--neon-green); font-family: monospace;">● ACTIVE</span>
                    </div>
                </div>

                ${data.top_blocked && data.top_blocked.length > 0 ? `
                <div style="margin-top: 2rem; border-top: 1px solid var(--neon-purple); padding-top: 1rem;">
                    <div style="color: var(--neon-purple); font-size: 1.4rem; margin-bottom: 1rem; text-align: center;">
                        TOP BLOCKED DOMAINS
                    </div>
                    ${data.top_blocked.map((item, index) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.8rem; padding: 0.5rem; background: rgba(138, 43, 226, 0.05); font-size: 1.3rem;">
                            <span style="color: var(--neon-purple);">${index + 1}. ${item.domain}</span>
                            <span style="color: var(--text-primary); font-family: monospace;">${item.count}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div style="margin-top: 2rem; padding: 1rem; border: 1px solid var(--neon-purple); background: rgba(138, 43, 226, 0.1); text-align: center;">
                    <div style="color: var(--neon-purple); font-size: 1.1rem;">
                        NETWORK SHIELD OPERATIONAL<br>
                        <span style="font-size: 0.9rem; opacity: 0.8;">Pi-hole v6 | 386K+ Domains Blocked</span>
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = content;
    } catch (error) {
        console.error('> ERROR LOADING NETWORK SHIELD:', error);
        modalContent.innerHTML = '<div class="error-message">ERROR LOADING NETWORK SHIELD DATA</div>';
    }
}

// Show Network Monitor Modal
async function showNetworkModal() {
    try {
        const statusMsg = '<div style="text-align: center; font-size: 1.5rem; color: var(--neon-cyan);">LOADING NETWORK DATA...</div>';
        openModal('&gt; NETWORK_MONITOR', statusMsg);

        // Fetch network stats from backend
        const response = await fetch('http://localhost:3001/network');
        if (!response.ok) throw new Error('Failed to fetch network stats');
        const data = await response.json();

        if (data.status === 'error') {
            modalContent.innerHTML = '<div class="error-message">NETWORK MONITOR ERROR - ' + (data.error || 'UNKNOWN ERROR') + '</div>';
            return;
        }

        // Helper function to format bytes
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        const todayTotal = data.bandwidth.today_rx + data.bandwidth.today_tx;
        const monthTotal = data.bandwidth.month_rx + data.bandwidth.month_tx;

        const content = `
            <div style="padding: 1rem;">
                <div style="margin-bottom: 2rem; text-align: center;">
                    <div style="font-size: 4rem; color: var(--neon-green); text-shadow: 0 0 10px var(--neon-green);">
                        ${formatBytes(todayTotal)}
                    </div>
                    <div style="font-size: 1.3rem; color: var(--neon-cyan); margin-top: 0.5rem;">
                        TOTAL TRAFFIC TODAY
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="border: 1px solid var(--neon-cyan); padding: 1rem; background: rgba(0, 255, 255, 0.05);">
                        <div style="color: var(--neon-cyan); font-size: 1rem; margin-bottom: 0.5rem;">DOWNLOADED TODAY</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${formatBytes(data.bandwidth.today_rx)}</div>
                    </div>
                    <div style="border: 1px solid var(--neon-purple); padding: 1rem; background: rgba(138, 43, 226, 0.05);">
                        <div style="color: var(--neon-purple); font-size: 1rem; margin-bottom: 0.5rem;">UPLOADED TODAY</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${formatBytes(data.bandwidth.today_tx)}</div>
                    </div>
                    <div style="border: 1px solid var(--neon-green); padding: 1rem; background: rgba(0, 255, 0, 0.05);">
                        <div style="color: var(--neon-green); font-size: 1rem; margin-bottom: 0.5rem;">MONTH DOWNLOAD</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${formatBytes(data.bandwidth.month_rx)}</div>
                    </div>
                    <div style="border: 1px solid var(--neon-purple); padding: 1rem; background: rgba(138, 43, 226, 0.05);">
                        <div style="color: var(--neon-purple); font-size: 1rem; margin-bottom: 0.5rem;">MONTH UPLOAD</div>
                        <div style="color: var(--text-primary); font-size: 2.2rem;">${formatBytes(data.bandwidth.month_tx)}</div>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--neon-cyan); padding-top: 1rem; font-size: 1.3rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="color: var(--neon-cyan);">INTERFACE:</span>
                        <span style="color: var(--text-primary); font-family: monospace;">${data.interface.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="color: var(--neon-cyan);">IP ADDRESS:</span>
                        <span style="color: var(--text-primary); font-family: monospace;">${data.ip_address}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <span style="color: var(--neon-cyan);">GATEWAY:</span>
                        <span style="color: var(--text-primary); font-family: monospace;">${data.gateway}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--neon-cyan);">NETWORK STATUS:</span>
                        <span style="color: var(--neon-green); font-family: monospace;">● ONLINE</span>
                    </div>
                </div>

                <div style="margin-top: 2rem; border-top: 1px solid var(--neon-purple); padding-top: 1rem;">
                    <div style="color: var(--neon-purple); font-size: 1.4rem; margin-bottom: 1rem; text-align: center;">
                        CONNECTION SUMMARY
                    </div>
                    <pre style="background: rgba(138, 43, 226, 0.05); padding: 1rem; border: 1px solid var(--neon-purple); font-size: 1.1rem; overflow-x: auto;">${data.connections}</pre>
                </div>

                <div style="margin-top: 2rem; padding: 1rem; border: 1px solid var(--neon-green); background: rgba(0, 255, 0, 0.1); text-align: center;">
                    <div style="color: var(--neon-green); font-size: 1.1rem;">
                        NETWORK MONITOR OPERATIONAL<br>
                        <span style="font-size: 0.9rem; opacity: 0.8;">vnStat v2.10 | Real-time Bandwidth Tracking</span>
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = content;
    } catch (error) {
        console.error('> ERROR LOADING NETWORK MONITOR:', error);
        modalContent.innerHTML = '<div class="error-message">ERROR LOADING NETWORK MONITOR DATA</div>';
    }
}

// Log system ready
console.log('> CYBER TERMINAL SYSTEMS ONLINE');
console.log('> BURN-IN PREVENTION: ACTIVE');
console.log('> SYSTEM MONITOR: ACTIVE');
console.log('> MODAL SYSTEM: ACTIVE');
console.log('> NETWORK SHIELD: ACTIVE');
console.log('> AWAITING USER INPUT...');
