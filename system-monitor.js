// Lightweight System Monitor Server for Raspberry Pi
// Exposes system statistics via HTTP API
// SECURITY HARDENED VERSION

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load environment variables from .env file
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    const env = {};

    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');

        for (const line of lines) {
            // Skip empty lines and comments
            if (!line || line.trim().startsWith('#')) continue;

            // Parse KEY=VALUE
            const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                // Remove quotes if present
                value = value.replace(/^["']|["']$/g, '');
                env[key] = value;
            }
        }

        console.log('> Environment variables loaded from .env');
        return env;
    } catch (error) {
        console.error('> Warning: Could not load .env file:', error.message);
        return env;
    }
}

const ENV = loadEnvFile();

// Configuration
const PORT = parseInt(ENV.PORT) || 3001;
const NETWORK_INTERFACE = ENV.NETWORK_INTERFACE || 'auto';
const ALPHA_VANTAGE_API_KEY = ENV.ALPHA_VANTAGE_API_KEY || 'demo';
const PIHOLE_API_URL = ENV.PIHOLE_API_URL || '';
const PIHOLE_PASSWORD = ENV.PIHOLE_PASSWORD || '';
// Spotify Configuration - PKCE flow (no client secret needed!)
const SPOTIFY_CLIENT_ID = ENV.SPOTIFY_CLIENT_ID || 'demo'; // Will prompt user to set up their own
const SPOTIFY_REDIRECT_URI = ENV.SPOTIFY_REDIRECT_URI || `http://localhost:${PORT}/spotify/callback`;

// PKCE state (stored per-session)
let pkceVerifier = null;
let pkceChallenge = null;

// PKCE helper functions
const crypto = require('crypto');

function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
    return crypto.createHash('sha256')
        .update(verifier)
        .digest('base64url');
}

// Platform detection
const IS_RASPBERRY_PI = fs.existsSync('/sys/firmware/devicetree/base/model');
const HAS_VCGENCMD = fs.existsSync('/usr/bin/vcgencmd') || fs.existsSync('/opt/vc/bin/vcgencmd');
const HAS_VNSTAT = fs.existsSync('/usr/bin/vnstat');

console.log('> Platform Detection:');
console.log('  - Raspberry Pi:', IS_RASPBERRY_PI);
console.log('  - vcgencmd available:', HAS_VCGENCMD);
console.log('  - Pi-hole (remote):', PIHOLE_API_URL ? 'configured' : 'not configured');
console.log('  - vnStat installed:', HAS_VNSTAT);

// Command whitelist for security
const ALLOWED_COMMANDS = {
    CPU_TEMP: 'cat /sys/class/thermal/thermal_zone0/temp',
    GPU_TEMP: 'vcgencmd measure_temp',
    UPTIME: 'cat /proc/uptime | awk \'{print $1}\'',
    LOADAVG: 'cat /proc/loadavg | awk \'{print $1, $2, $3}\'',
    MEMINFO: 'free -m | grep Mem:',
    CPU_STAT_1: 'cat /proc/stat | grep "^cpu " | awk \'{print $2, $3, $4, $5}\'',
    DISK_USAGE: 'df -h / | tail -1 | awk \'{print $2, $3, $5}\'',
    IP_ADDR: 'ip addr show {{interface}} | grep "inet " | awk \'{print $2}\'',
    GATEWAY: 'ip route | grep default | awk \'{print $3}\'',
    VNSTAT_JSON: 'vnstat --json',
    SS_SUMMARY: 'ss -s'
};

// Helper function to execute whitelisted shell commands
function execCommand(commandKey, params = {}) {
    return new Promise((resolve, reject) => {
        let command = ALLOWED_COMMANDS[commandKey];

        if (!command) {
            reject(new Error(`Command ${commandKey} not whitelisted`));
            return;
        }

        // Replace parameters safely
        for (const [key, value] of Object.entries(params)) {
            // Sanitize parameter values - only allow alphanumeric, dash, underscore
            const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '');
            command = command.replace(`{{${key}}}`, sanitized);
        }

        exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// Get CPU temperature
async function getCPUTemp() {
    try {
        if (!IS_RASPBERRY_PI) {
            return null;
        }
        const temp = await execCommand('CPU_TEMP');
        return (parseInt(temp) / 1000).toFixed(1);
    } catch (error) {
        console.error('Error getting CPU temp:', error.message);
        return null;
    }
}

// Get GPU temperature
async function getGPUTemp() {
    try {
        if (!HAS_VCGENCMD) {
            return null;
        }
        const output = await execCommand('GPU_TEMP');
        const match = output.match(/temp=([0-9.]+)/);
        return match ? parseFloat(match[1]).toFixed(1) : null;
    } catch (error) {
        console.error('Error getting GPU temp:', error.message);
        return null;
    }
}

// Get system uptime
async function getUptime() {
    try {
        const uptimeSeconds = parseFloat(await execCommand('UPTIME'));
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    } catch (error) {
        console.error('Error getting uptime:', error.message);
        return null;
    }
}

// Get load average
async function getLoadAverage() {
    try {
        const loadavg = await execCommand('LOADAVG');
        const [load1, load5, load15] = loadavg.split(' ');
        return { load1, load5, load15 };
    } catch (error) {
        console.error('Error getting load average:', error.message);
        return null;
    }
}

// Get memory usage
async function getMemoryUsage() {
    try {
        const memInfo = await execCommand('MEMINFO');
        const parts = memInfo.split(/\s+/);
        const total = parseInt(parts[1]);
        const used = parseInt(parts[2]);
        const available = parseInt(parts[6]);
        const usedPercent = Math.round((used / total) * 100);

        return {
            total,
            used,
            available,
            usedPercent
        };
    } catch (error) {
        console.error('Error getting memory usage:', error.message);
        return null;
    }
}

// Get CPU usage
async function getCPUUsage() {
    try {
        // Read CPU stats twice with a small delay to calculate usage
        const stat1 = await execCommand('CPU_STAT_1');
        await new Promise(resolve => setTimeout(resolve, 200));
        const stat2 = await execCommand('CPU_STAT_1');

        const [user1, nice1, system1, idle1] = stat1.split(' ').map(Number);
        const [user2, nice2, system2, idle2] = stat2.split(' ').map(Number);

        const total1 = user1 + nice1 + system1 + idle1;
        const total2 = user2 + nice2 + system2 + idle2;
        const idle = idle2 - idle1;
        const total = total2 - total1;

        const usage = Math.round(100 * (total - idle) / total);
        return usage;
    } catch (error) {
        console.error('Error getting CPU usage:', error.message);
        return null;
    }
}

// Get disk usage
async function getDiskUsage() {
    try {
        const output = await execCommand('DISK_USAGE');
        const [total, used, percent] = output.split(' ');
        return {
            total,
            used,
            percent: percent.replace('%', '')
        };
    } catch (error) {
        console.error('Error getting disk usage:', error.message);
        return null;
    }
}

// Main stats collection function
async function getSystemStats() {
    try {
        const [cpuTemp, gpuTemp, uptime, load, memory, cpuUsage, disk] = await Promise.all([
            getCPUTemp(),
            getGPUTemp(),
            getUptime(),
            getLoadAverage(),
            getMemoryUsage(),
            getCPUUsage(),
            getDiskUsage()
        ]);

        return {
            temperature: {
                cpu: cpuTemp,
                gpu: gpuTemp
            },
            uptime,
            load,
            memory,
            cpu: {
                usage: cpuUsage
            },
            disk
        };
    } catch (error) {
        console.error('Error collecting system stats:', error);
        throw error;
    }
}

// Financial data cache
let financialCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1800000; // 30 minute cache

// Realistic base values for financial data
const baseValues = {
    dow: 43500,
    sp500: 5870,
    nasdaq: 18350,
    gold: 2730,
    usdeur: 0.9320
};

// Fetch quote from Alpha Vantage
async function fetchAlphaVantageQuote(symbol) {
    return new Promise((resolve) => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed['Global Quote'] && parsed['Global Quote']['05. price']) {
                        resolve({
                            price: parseFloat(parsed['Global Quote']['05. price']),
                            change: parseFloat(parsed['Global Quote']['10. change percent']?.replace('%', '') || 0)
                        });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

// Fetch forex rate from Alpha Vantage
async function fetchAlphaVantageForex(from, to) {
    return new Promise((resolve) => {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_API_KEY}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed['Realtime Currency Exchange Rate']) {
                        const rate = parseFloat(parsed['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                        resolve({ rate: rate, change: 0 });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

// Get Financial Data with caching and fallback
async function getFinancialData() {
    const now = Date.now();

    // Return cached data if available and fresh
    if (financialCache && (now - lastFetchTime) < CACHE_DURATION) {
        return financialCache;
    }

    console.log('> Fetching fresh financial data from Alpha Vantage...');

    try {
        // Check if API key is set
        if (ALPHA_VANTAGE_API_KEY === 'demo') {
            console.log('> Alpha Vantage API key not set, using simulated data');
            return generateSimulatedData();
        }

        // Fetch data with delays to avoid rate limiting (5 calls/minute limit)
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const [dow, sp500, nasdaq, gold, usdeur] = await Promise.all([
            fetchAlphaVantageQuote('DIA'),
            (async () => { await delay(13000); return fetchAlphaVantageQuote('SPY'); })(),
            (async () => { await delay(26000); return fetchAlphaVantageQuote('QQQ'); })(),
            (async () => { await delay(39000); return fetchAlphaVantageQuote('GLD'); })(),
            (async () => { await delay(52000); return fetchAlphaVantageForex('USD', 'EUR'); })()
        ]);

        // Check if we got valid data
        if (!dow || !sp500 || !nasdaq) {
            console.log('> Failed to fetch financial data, using simulated data');
            return generateSimulatedData();
        }

        // Convert ETF prices to approximate index values
        const dowPrice = (dow.price * 100).toFixed(2);
        const sp500Price = (sp500.price * 10).toFixed(2);
        const nasdaqPrice = (nasdaq.price * 40).toFixed(2);
        const goldPrice = (gold ? gold.price * 10 : baseValues.gold).toFixed(2);

        financialCache = {
            dow: {
                price: dowPrice,
                change: dow.change.toFixed(2)
            },
            sp500: {
                price: sp500Price,
                change: sp500.change.toFixed(2)
            },
            nasdaq: {
                price: nasdaqPrice,
                change: nasdaq.change.toFixed(2)
            },
            gold: {
                price: goldPrice,
                change: gold ? gold.change.toFixed(2) : '0.00'
            },
            usdeur: {
                rate: usdeur ? usdeur.rate.toFixed(4) : baseValues.usdeur.toFixed(4),
                change: usdeur ? usdeur.change.toFixed(2) : '0.00'
            }
        };

        lastFetchTime = now;
        console.log('> Financial data updated successfully');
        return financialCache;
    } catch (error) {
        console.error('> Error fetching financial data:', error);
        return generateSimulatedData();
    }
}

// Generate simulated financial data with realistic variations
function generateSimulatedData() {
    const variation = () => (Math.random() - 0.5) * 1;

    return {
        dow: {
            price: (baseValues.dow * (1 + variation() / 100)).toFixed(2),
            change: variation().toFixed(2)
        },
        sp500: {
            price: (baseValues.sp500 * (1 + variation() / 100)).toFixed(2),
            change: variation().toFixed(2)
        },
        nasdaq: {
            price: (baseValues.nasdaq * (1 + variation() / 100)).toFixed(2),
            change: variation().toFixed(2)
        },
        gold: {
            price: (baseValues.gold * (1 + variation() / 100)).toFixed(2),
            change: variation().toFixed(2)
        },
        usdeur: {
            rate: (baseValues.usdeur * (1 + variation() / 200)).toFixed(4),
            change: (variation() / 2).toFixed(2)
        }
    };
}

// Get Pi-hole statistics (from remote Pi-hole v6 API)
async function getPiholeStats() {
    if (!PIHOLE_API_URL) {
        return {
            status: 'error',
            error: 'Pi-hole API URL not configured',
            fallback_iframe: 'http://100.90.104.35/admin'
        };
    }

    try {
        // First, get an API session token
        const loginUrl = `${PIHOLE_API_URL}/api/auth`;
        const loginData = JSON.stringify({ password: PIHOLE_PASSWORD });

        return new Promise((resolve) => {
            const loginReq = http.request(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginData),
                    'Accept': 'application/json'
                }
            }, (loginResponse) => {
                let loginDataStr = '';
                loginResponse.on('data', (chunk) => { loginDataStr += chunk; });
                loginResponse.on('end', () => {
                    try {

                        const loginResult = JSON.parse(loginDataStr);
                        const sessionId = loginResult.session?.sid;
                        const csrfToken = loginResult.session?.csrf;

                        if (!sessionId) {
                            console.error('> Pi-hole: Authentication failed - no session ID');
                            resolve({
                                status: 'error',
                                error: 'Failed to authenticate with Pi-hole',
                                fallback_iframe: 'http://100.90.104.35/admin'
                            });
                            return;
                        }

                        // Extract cookie from Set-Cookie header
                        const setCookieHeader = loginResponse.headers['set-cookie'];
                        let cookieToUse = `sid=${sessionId}`;

                        // If Set-Cookie header exists, use the full cookie value
                        if (setCookieHeader && Array.isArray(setCookieHeader)) {
                            cookieToUse = setCookieHeader[0].split(';')[0];
                        }

                        // Now fetch summary stats with the session token
                        const summaryUrl = `${PIHOLE_API_URL}/api/stats/summary`;

                        const requestHeaders = {
                            'Cookie': cookieToUse,
                            'Accept': 'application/json',
                            'User-Agent': 'CyberKiosk/1.0'
                        };

                        // Add Pi-hole v6 authentication headers
                        if (csrfToken) {
                            requestHeaders['X-FTL-SID'] = sessionId;
                            requestHeaders['X-FTL-CSRF'] = csrfToken;
                        }

                        const summaryReq = http.request(summaryUrl, {
                            method: 'GET',
                            headers: requestHeaders
                        }, (response) => {
                            let data = '';
                            response.on('data', (chunk) => { data += chunk; });
                            response.on('end', () => {
                                try {
                                    // Check if we got an authentication error
                                    if (response.statusCode === 401 || response.statusCode === 403) {
                                        console.error('> Pi-hole: Authentication rejected (HTTP ' + response.statusCode + ')');
                                        resolve({
                                            status: 'error',
                                            error: 'Pi-hole API authentication rejected',
                                            fallback_iframe: 'http://100.90.104.35/admin'
                                        });
                                        return;
                                    }

                                    const result = JSON.parse(data);
                                    const queries = result.queries;
                                    const clients = result.clients;

                                    if (!queries) {
                                        console.error('> Pi-hole: No queries data in response');
                                        resolve({
                                            status: 'error',
                                            error: 'No queries data in response',
                                            fallback_iframe: 'http://100.90.104.35/admin'
                                        });
                                        return;
                                    }

                                    // Fetch top blocked domains
                                    const topBlockedUrl = `${PIHOLE_API_URL}/api/stats/top_blocked`;
                                    const topReq = http.request(topBlockedUrl, {
                                        method: 'GET',
                                        headers: requestHeaders
                                    }, (topResponse) => {
                                        let topData = '';
                                        topResponse.on('data', (chunk) => { topData += chunk; });
                                        topResponse.on('end', () => {
                                            try {
                                                const topResult = JSON.parse(topData);
                                                // Pi-hole v6 returns top_blocked directly, not in stats
                                                const topBlocked = topResult.top_blocked || [];

                                                // Map Pi-hole v6 API response to expected format
                                                const stats = {
                                                    status: 'active',
                                                    queries_today: parseInt(queries.total) || 0,
                                                    blocked_today: parseInt(queries.blocked) || 0,
                                                    percent_blocked: parseFloat(queries.percent_blocked) || 0,
                                                    domains_blocked: parseInt(result.gravity?.domains_being_blocked) || 0,
                                                    clients: parseInt(clients?.total_clients) || 0,
                                                    cached_queries: parseInt(queries.cached) || 0,
                                                    forwarded_queries: parseInt(queries.forwarded) || 0,
                                                    unique_domains: parseInt(queries.unique_domains) || 0,
                                                    top_blocked: topBlocked.slice(0, 5).map(item => ({
                                                        domain: item.domain || '',
                                                        count: parseInt(item.count) || 0
                                                    }))
                                                };

                                                resolve(stats);
                                            } catch (error) {
                                                console.error('Error parsing top blocked:', error);
                                                // Return stats without top blocked
                                                resolve({
                                                    status: 'active',
                                                    queries_today: parseInt(queries.total) || 0,
                                                    blocked_today: parseInt(queries.blocked) || 0,
                                                    percent_blocked: parseFloat(queries.percent_blocked) || 0,
                                                    domains_blocked: parseInt(result.gravity?.domains_being_blocked) || 0,
                                                    clients: parseInt(clients?.total_clients) || 0,
                                                    cached_queries: parseInt(queries.cached) || 0,
                                                    forwarded_queries: parseInt(queries.forwarded) || 0,
                                                    unique_domains: parseInt(queries.unique_domains) || 0,
                                                    top_blocked: []
                                                });
                                            }
                                        });
                                    });

                                    topReq.on('error', (error) => {
                                        console.error('Error fetching top blocked:', error);
                                        // Return stats without top blocked
                                        resolve({
                                            status: 'active',
                                            queries_today: parseInt(queries.total) || 0,
                                            blocked_today: parseInt(queries.blocked) || 0,
                                            percent_blocked: parseFloat(queries.percent_blocked) || 0,
                                            domains_blocked: parseInt(result.gravity?.domains_being_blocked) || 0,
                                            clients: parseInt(clients?.total_clients) || 0,
                                            cached_queries: parseInt(queries.cached) || 0,
                                            forwarded_queries: parseInt(queries.forwarded) || 0,
                                            unique_domains: parseInt(queries.unique_domains) || 0,
                                            top_blocked: []
                                        });
                                    });

                                    topReq.end();
                                } catch (error) {
                                    console.error('Error parsing summary:', error);
                                    resolve({
                                        status: 'error',
                                        error: 'Failed to parse summary: ' + error.message,
                                        fallback_iframe: 'http://100.90.104.35/admin'
                                    });
                                }
                            });
                        });

                        summaryReq.on('error', (error) => {
                            console.error('Error fetching summary:', error);
                            resolve({
                                status: 'error',
                                error: 'Failed to fetch summary: ' + error.message,
                                fallback_iframe: 'http://100.90.104.35/admin'
                            });
                        });

                        summaryReq.end();
                    } catch (error) {
                        console.error('Error parsing login response:', error);
                        resolve({
                            status: 'error',
                            error: 'Failed to parse login response: ' + error.message,
                            fallback_iframe: 'http://100.90.104.35/admin'
                        });
                    }
                });
            });

            loginReq.on('error', (error) => {
                console.error('Error authenticating with Pi-hole:', error);
                resolve({
                    status: 'error',
                    error: 'Failed to authenticate: ' + error.message,
                    fallback_iframe: 'http://100.90.104.35/admin'
                });
            });

            loginReq.write(loginData);
            loginReq.end();
        });
    } catch (error) {
        console.error('Error getting Pi-hole stats:', error);
        return {
            status: 'error',
            error: error.message,
            fallback_iframe: 'http://100.90.104.35/admin'
        };
    }
}

// Auto-detect primary network interface
async function detectNetworkInterface() {
    if (NETWORK_INTERFACE !== 'auto') {
        return NETWORK_INTERFACE;
    }

    try {
        if (!HAS_VNSTAT) {
            // Fallback to common interfaces
            const commonInterfaces = ['wlan0', 'eth0', 'enp0s3', 'wlp2s0'];
            for (const iface of commonInterfaces) {
                try {
                    await execCommand('IP_ADDR', { interface: iface });
                    return iface;
                } catch (e) {
                    continue;
                }
            }
            return 'wlan0'; // Last resort fallback
        }

        const vnstatOutput = await execCommand('VNSTAT_JSON');
        const vnstat = JSON.parse(vnstatOutput);

        // Find interface with most traffic
        let maxTraffic = 0;
        let primaryInterface = 'wlan0';

        for (const iface of vnstat.interfaces || []) {
            const traffic = (iface.traffic?.total?.rx || 0) + (iface.traffic?.total?.tx || 0);
            if (traffic > maxTraffic) {
                maxTraffic = traffic;
                primaryInterface = iface.name;
            }
        }

        console.log('> Auto-detected network interface:', primaryInterface);
        return primaryInterface;
    } catch (error) {
        console.error('Error detecting network interface:', error.message);
        return 'wlan0'; // Fallback
    }
}

// Get Network Statistics
async function getNetworkStats() {
    if (!HAS_VNSTAT) {
        return {
            status: 'error',
            error: 'vnStat not installed'
        };
    }

    try {
        const interface = await detectNetworkInterface();
        const vnstatOutput = await execCommand('VNSTAT_JSON');
        const vnstat = JSON.parse(vnstatOutput);

        // Find the detected interface
        const ifaceData = vnstat.interfaces.find(iface => iface.name === interface);

        if (!ifaceData) {
            return {
                status: 'error',
                error: `Interface ${interface} not found in vnStat data`
            };
        }

        // Extract today's data
        const today = ifaceData.traffic.day[0] || { rx: 0, tx: 0 };
        const month = ifaceData.traffic.month[0] || { rx: 0, tx: 0 };

        // Get current connection status
        const ipAddr = await execCommand('IP_ADDR', { interface });
        const gateway = await execCommand('GATEWAY');
        const connections = await execCommand('SS_SUMMARY');

        return {
            status: 'online',
            interface: interface,
            ip_address: ipAddr || 'N/A',
            gateway: gateway || 'N/A',
            bandwidth: {
                today_rx: today.rx,
                today_tx: today.tx,
                month_rx: month.rx,
                month_tx: month.tx
            },
            connections: connections,
            total_traffic: {
                rx: ifaceData.traffic.total.rx,
                tx: ifaceData.traffic.total.tx
            }
        };
    } catch (error) {
        console.error('Error getting network stats:', error);
        return {
            status: 'error',
            error: error.message
        };
    }
}

// API Proxy for Weather (backend calls API, frontend doesn't see key)
async function proxyWeatherAPI(zipCode) {
    const apiKey = ENV.OPENWEATHER_API_KEY;

    if (!apiKey || apiKey === 'your_openweathermap_api_key') {
        return { error: 'API key not configured' };
    }

    return new Promise((resolve) => {
        const url = `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zipCode)},us&units=imperial&appid=${apiKey}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Failed to parse weather data' });
                }
            });
        }).on('error', () => resolve({ error: 'Failed to fetch weather data' }));
    });
}

// API Proxy for Weather Forecast
async function proxyWeatherForecastAPI(zipCode) {
    const apiKey = ENV.OPENWEATHER_API_KEY;

    if (!apiKey || apiKey === 'your_openweathermap_api_key') {
        return { error: 'API key not configured' };
    }

    return new Promise((resolve) => {
        const url = `https://api.openweathermap.org/data/2.5/forecast?zip=${encodeURIComponent(zipCode)},us&units=imperial&appid=${apiKey}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Failed to parse forecast data' });
                }
            });
        }).on('error', () => resolve({ error: 'Failed to fetch forecast data' }));
    });
}

// API Proxy for NY Times
async function proxyNYTimesAPI() {
    const apiKey = ENV.NYT_API_KEY;

    if (!apiKey || apiKey === 'your_nytimes_api_key') {
        return { error: 'API key not configured' };
    }

    return new Promise((resolve) => {
        const url = `https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=${apiKey}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Failed to parse NYT data' });
                }
            });
        }).on('error', () => resolve({ error: 'Failed to fetch NYT data' }));
    });
}

// API Proxy for YouTube Search
async function proxyYouTubeSearchAPI(query) {
    const apiKey = ENV.YOUTUBE_API_KEY;

    if (!apiKey || apiKey === 'your_youtube_api_key') {
        return { error: 'API key not configured' };
    }

    return new Promise((resolve) => {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Failed to parse YouTube data' });
                }
            });
        }).on('error', () => resolve({ error: 'Failed to fetch YouTube data' }));
    });
}

// Helper function to serve static files with enhanced security
function serveStaticFile(filePath, res) {
    // Detect path traversal attempts in the original path
    if (filePath.includes('..') || filePath.includes('%2e%2e') || filePath.includes('%2E%2E')) {
        console.warn('> SECURITY: Path traversal attempt blocked:', filePath);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    // Strict path validation - prevent directory traversal
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const normalizedPath = path.normalize(cleanPath);
    const absolutePath = path.join(__dirname, normalizedPath);

    // Ensure the resolved path is within the project directory
    if (!absolutePath.startsWith(__dirname + path.sep) && absolutePath !== __dirname) {
        console.warn('> SECURITY: Path escape attempt blocked:', filePath);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    // Check if path exists and is a file (not a directory)
    fs.stat(absolutePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - File Not Found');
            return;
        }

        const extname = path.extname(absolutePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(absolutePath, (error, content) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 - Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
}

// Spotify OAuth Token Management
let spotifyTokens = {
    access_token: null,
    refresh_token: null,
    expires_at: null
};

// Load saved Spotify tokens from file
function loadSpotifyTokens() {
    const tokenFile = path.join(__dirname, '.spotify_tokens.json');
    try {
        if (fs.existsSync(tokenFile)) {
            const data = fs.readFileSync(tokenFile, 'utf8');
            spotifyTokens = JSON.parse(data);
            console.log('> Spotify tokens loaded from file');
        }
    } catch (error) {
        console.error('> Error loading Spotify tokens:', error.message);
    }
}

// Save Spotify tokens to file
function saveSpotifyTokens() {
    const tokenFile = path.join(__dirname, '.spotify_tokens.json');
    try {
        fs.writeFileSync(tokenFile, JSON.stringify(spotifyTokens, null, 2), 'utf8');
        console.log('> Spotify tokens saved to file');
    } catch (error) {
        console.error('> Error saving Spotify tokens:', error.message);
    }
}

// Refresh Spotify access token (PKCE flow)
async function refreshSpotifyToken() {
    if (!spotifyTokens.refresh_token) {
        throw new Error('No refresh token available');
    }

    const tokenUrl = 'https://accounts.spotify.com/api/token';

    const postData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: spotifyTokens.refresh_token,
        client_id: SPOTIFY_CLIENT_ID
    }).toString();

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const req = https.request(tokenUrl, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        spotifyTokens.access_token = result.access_token;
                        // Refresh token may also be refreshed
                        if (result.refresh_token) {
                            spotifyTokens.refresh_token = result.refresh_token;
                        }
                        spotifyTokens.expires_at = Date.now() + (result.expires_in * 1000);
                        saveSpotifyTokens();
                        console.log('> Spotify token refreshed successfully');
                        resolve(spotifyTokens.access_token);
                    } else {
                        reject(new Error('No access token in refresh response'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Get valid Spotify access token (refresh if needed)
async function getSpotifyAccessToken() {
    if (!spotifyTokens.access_token) {
        return null;
    }

    // Check if token is expired or will expire in the next minute
    if (spotifyTokens.expires_at && Date.now() >= (spotifyTokens.expires_at - 60000)) {
        console.log('> Spotify token expired, refreshing...');
        try {
            await refreshSpotifyToken();
        } catch (error) {
            console.error('> Error refreshing Spotify token:', error.message);
            return null;
        }
    }

    return spotifyTokens.access_token;
}

// Make authenticated Spotify API request
async function spotifyApiRequest(endpoint, method = 'GET', body = null) {
    const accessToken = await getSpotifyAccessToken();

    if (!accessToken) {
        return { error: 'Not authenticated with Spotify' };
    }

    const url = `https://api.spotify.com/v1${endpoint}`;

    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    if (res.statusCode === 204) {
                        // No content response (e.g., pause/play commands)
                        resolve({ success: true });
                    } else if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve({ error: `Spotify API error: ${res.statusCode}`, details: data });
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

// Load Spotify tokens on startup
loadSpotifyTokens();

// HTTP Server
const server = http.createServer(async (req, res) => {
    // Secure CORS - only allow localhost
    const origin = req.headers.origin;
    const allowedOrigins = [
        `http://localhost:${PORT}`,
        `http://127.0.0.1:${PORT}`,
        'http://localhost',
        'http://127.0.0.1'
    ];

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PORT}`);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Parse URL
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;

    // API endpoints
    if (pathname === '/stats' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
            const stats = await getSystemStats();
            res.writeHead(200);
            res.end(JSON.stringify(stats));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get system stats' }));
        }
    } else if (pathname === '/financial' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
            const financial = await getFinancialData();
            res.writeHead(200);
            res.end(JSON.stringify(financial));
        } catch (error) {
            console.error('Financial data error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get financial data' }));
        }
    } else if (pathname === '/pihole' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
            const piholeStats = await getPiholeStats();
            res.writeHead(200);
            res.end(JSON.stringify(piholeStats));
        } catch (error) {
            console.error('Pi-hole stats error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get Pi-hole stats' }));
        }
    } else if (pathname === '/network' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
            const networkStats = await getNetworkStats();
            res.writeHead(200);
            res.end(JSON.stringify(networkStats));
        } catch (error) {
            console.error('Network stats error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get network stats' }));
        }
    } else if (pathname === '/api/weather' && req.method === 'GET') {
        // Weather API proxy
        res.setHeader('Content-Type', 'application/json');
        const zipCode = parsedUrl.searchParams.get('zip') || ENV.ZIP_CODE || '90210';
        const weatherData = await proxyWeatherAPI(zipCode);
        res.writeHead(200);
        res.end(JSON.stringify(weatherData));
    } else if (pathname === '/api/weather/forecast' && req.method === 'GET') {
        // Weather Forecast API proxy
        res.setHeader('Content-Type', 'application/json');
        const zipCode = parsedUrl.searchParams.get('zip') || ENV.ZIP_CODE || '90210';
        const forecastData = await proxyWeatherForecastAPI(zipCode);
        res.writeHead(200);
        res.end(JSON.stringify(forecastData));
    } else if (pathname === '/api/nytimes' && req.method === 'GET') {
        // NY Times API proxy
        res.setHeader('Content-Type', 'application/json');
        const nytData = await proxyNYTimesAPI();
        res.writeHead(200);
        res.end(JSON.stringify(nytData));
    } else if (pathname === '/api/youtube/search' && req.method === 'GET') {
        // YouTube Search API proxy
        res.setHeader('Content-Type', 'application/json');
        const query = parsedUrl.searchParams.get('q');
        if (!query) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Query parameter required' }));
            return;
        }
        const youtubeData = await proxyYouTubeSearchAPI(query);
        res.writeHead(200);
        res.end(JSON.stringify(youtubeData));
    } else if (pathname === '/health' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
    } else if (pathname === '/config' && req.method === 'GET') {
        // Send configuration WITHOUT API keys (security fix)
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({
            zipCode: ENV.ZIP_CODE || '90210',
            // API keys are NOT sent to frontend anymore
            hasWeatherKey: !!(ENV.OPENWEATHER_API_KEY && ENV.OPENWEATHER_API_KEY !== 'your_openweathermap_api_key'),
            hasNytKey: !!(ENV.NYT_API_KEY && ENV.NYT_API_KEY !== 'your_nytimes_api_key'),
            hasYoutubeKey: !!(ENV.YOUTUBE_API_KEY && ENV.YOUTUBE_API_KEY !== 'your_youtube_api_key'),
            imageChangeInterval: 30000,
            weatherUpdateInterval: 600000,
            newsUpdateInterval: 300000,
            weatherCycleInterval: 300000,
            systemMonitorUrl: `http://localhost:${PORT}/stats`,
            systemUpdateInterval: 30000,
            epaperServerUrl: ENV.EPAPER_SERVER_URL || '',
            screensaverTimeout: parseInt(ENV.SCREENSAVER_TIMEOUT) || 600000,
            screensaverImageInterval: parseInt(ENV.SCREENSAVER_IMAGE_INTERVAL) || 600000,
            port: PORT
        }));
    } else if (pathname === '/config/panels' && req.method === 'GET') {
        // Get panels configuration
        res.setHeader('Content-Type', 'application/json');
        const panelsConfigFile = path.join(__dirname, 'config', 'panels.json');

        try {
            if (fs.existsSync(panelsConfigFile)) {
                const panelsConfig = fs.readFileSync(panelsConfigFile, 'utf8');
                res.writeHead(200);
                res.end(panelsConfig);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Panels config not found' }));
            }
        } catch (error) {
            console.error('Error reading panels config:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to read panels config' }));
        }
    } else if (pathname === '/config/panels' && req.method === 'POST') {
        // Save panels configuration
        res.setHeader('Content-Type', 'application/json');
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const panelsConfigFile = path.join(__dirname, 'config', 'panels.json');

                // Read existing config to preserve other settings
                let existingConfig = {};
                try {
                    if (fs.existsSync(panelsConfigFile)) {
                        existingConfig = JSON.parse(fs.readFileSync(panelsConfigFile, 'utf8'));
                    }
                } catch (error) {
                    console.warn('Could not read existing panels config, creating new one');
                }

                // Update panels.enabled flags based on panelsEnabled data
                if (data.panelsEnabled && existingConfig.panels) {
                    Object.keys(data.panelsEnabled).forEach(panelId => {
                        if (existingConfig.panels[panelId]) {
                            existingConfig.panels[panelId].enabled = data.panelsEnabled[panelId];
                        }
                    });
                }

                // Merge with existing config, preserving structure
                const updatedConfig = {
                    ...existingConfig,
                    activePanels: data.activePanels || existingConfig.activePanels || [],
                    layout: data.layout || existingConfig.layout,
                    lastUpdated: new Date().toISOString()
                };

                // Ensure config directory exists
                const configDir = path.join(__dirname, 'config');
                if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                }

                // Write updated config
                fs.writeFileSync(panelsConfigFile, JSON.stringify(updatedConfig, null, 2), 'utf8');

                console.log('> Panels config saved successfully');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, config: updatedConfig }));
            } catch (error) {
                console.error('Error saving panels config:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to save panels config' }));
            }
        });
    } else if (pathname === '/device-id' && req.method === 'GET') {
        // Get stored device ID
        res.setHeader('Content-Type', 'application/json');
        const deviceIdFile = path.join(__dirname, 'device_id.txt');

        try {
            if (fs.existsSync(deviceIdFile)) {
                const deviceId = fs.readFileSync(deviceIdFile, 'utf8').trim();
                res.writeHead(200);
                res.end(JSON.stringify({ device_id: deviceId }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Device ID not found' }));
            }
        } catch (error) {
            console.error('Error reading device ID:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to read device ID' }));
        }
    } else if (pathname === '/device-id' && req.method === 'POST') {
        // Save device ID
        res.setHeader('Content-Type', 'application/json');
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const deviceId = data.device_id;

                if (!deviceId) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'device_id is required' }));
                    return;
                }

                const deviceIdFile = path.join(__dirname, 'device_id.txt');
                fs.writeFileSync(deviceIdFile, deviceId, 'utf8');

                console.log('> Device ID saved:', deviceId);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, device_id: deviceId }));
            } catch (error) {
                console.error('Error saving device ID:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to save device ID' }));
            }
        });
    } else if (pathname === '/spotify/login' && req.method === 'GET') {
        // Spotify OAuth login with PKCE - redirect to Spotify authorization
        res.setHeader('Content-Type', 'application/json');

        if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === 'demo') {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Spotify Client ID not configured. Add SPOTIFY_CLIENT_ID to .env file.' }));
            return;
        }

        // Generate PKCE code verifier and challenge
        pkceVerifier = generateCodeVerifier();
        pkceChallenge = generateCodeChallenge(pkceVerifier);

        console.log('> Generated PKCE challenge for Spotify OAuth');

        const scopes = [
            'streaming',  // Web Playback SDK - enables browser-based playback
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'playlist-read-private',
            'playlist-read-collaborative',
            'user-library-read',
            'user-top-read',
            'user-read-recently-played'
        ];

        const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scopes.join(' '),
            redirect_uri: SPOTIFY_REDIRECT_URI,
            code_challenge_method: 'S256',
            code_challenge: pkceChallenge,
            show_dialog: 'true'
        });

        res.writeHead(200);
        res.end(JSON.stringify({ auth_url: authUrl }));
    } else if (pathname === '/spotify/callback' && req.method === 'GET') {
        // Spotify OAuth callback with PKCE - exchange code for tokens
        const code = parsedUrl.searchParams.get('code');
        const error = parsedUrl.searchParams.get('error');

        if (error) {
            console.error('> Spotify authorization denied by user');
            res.writeHead(302, { 'Location': '/?spotify_error=denied' });
            res.end();
            return;
        }

        if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Error: No authorization code</h1></body></html>');
            return;
        }

        if (!pkceVerifier) {
            console.error('> No PKCE verifier found - session may have expired or server restarted');
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body style="font-family: monospace; padding: 20px;"><h1>Error: Session expired</h1><p>The OAuth session expired or the server was restarted during authentication.</p><p>This is normal if you waited too long or if the server restarted.</p><br><a href="/" style="background: #1DB954; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px;">Return to Kiosk and Try Again</a></body></html>');
            return;
        }

        // Exchange code for tokens using PKCE
        const tokenUrl = 'https://accounts.spotify.com/api/token';

        const postData = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            client_id: SPOTIFY_CLIENT_ID,
            code_verifier: pkceVerifier
        }).toString();

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const tokenReq = https.request(tokenUrl, options, (tokenRes) => {
            let data = '';
            tokenRes.on('data', (chunk) => { data += chunk; });
            tokenRes.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        spotifyTokens.access_token = result.access_token;
                        spotifyTokens.refresh_token = result.refresh_token;
                        spotifyTokens.expires_at = Date.now() + (result.expires_in * 1000);
                        saveSpotifyTokens();

                        // Clear PKCE state after successful authentication
                        pkceVerifier = null;
                        pkceChallenge = null;

                        console.log('> Spotify PKCE authentication successful');
                        res.writeHead(302, { 'Location': '/' });
                        res.end();
                    } else {
                        console.error('> Spotify token exchange failed:', data);
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.end('<html><body style="font-family: monospace; padding: 20px;"><h1>Error: Could not get access token</h1><pre>' + JSON.stringify(result, null, 2) + '</pre><br><a href="/">Return to Kiosk</a></body></html>');
                    }
                } catch (error) {
                    console.error('> Error parsing Spotify token response:', error);
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Error: Could not parse token response</h1></body></html>');
                }
            });
        });

        tokenReq.on('error', (error) => {
            console.error('> Error exchanging Spotify code:', error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Error: Could not connect to Spotify</h1></body></html>');
        });

        tokenReq.write(postData);
        tokenReq.end();
    } else if (pathname === '/spotify/status' && req.method === 'GET') {
        // Check Spotify authentication status
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({
            authenticated: !!(spotifyTokens.access_token && spotifyTokens.refresh_token),
            hasCredentials: SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_ID !== 'demo'
        }));
    } else if (pathname === '/spotify/logout' && req.method === 'POST') {
        // Logout - clear tokens
        res.setHeader('Content-Type', 'application/json');
        spotifyTokens = {
            access_token: null,
            refresh_token: null,
            expires_at: null
        };
        const tokenFile = path.join(__dirname, '.spotify_tokens.json');
        try {
            if (fs.existsSync(tokenFile)) {
                fs.unlinkSync(tokenFile);
            }
        } catch (error) {
            console.error('> Error deleting token file:', error);
        }
        console.log('> Spotify logged out');
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
    } else if (pathname === '/spotify/current' && req.method === 'GET') {
        // Get currently playing track
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player/currently-playing');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/player' && req.method === 'GET') {
        // Get full player state
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/play' && req.method === 'POST') {
        // Play/Resume playback (optionally with context_uri and device_id)
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                res.setHeader('Content-Type', 'application/json');

                let playbackOptions = {};
                if (body) {
                    try {
                        playbackOptions = JSON.parse(body);
                    } catch (e) {
                        // If no JSON body, just resume playback
                    }
                }

                // Build URL with device_id if provided
                let url = '/me/player/play';
                if (playbackOptions.device_id) {
                    url += `?device_id=${playbackOptions.device_id}`;
                    delete playbackOptions.device_id; // Remove from body
                }

                // Make API request
                const data = await spotifyApiRequest(url, 'PUT', Object.keys(playbackOptions).length > 0 ? playbackOptions : null);
                res.writeHead(200);
                res.end(JSON.stringify(data));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (pathname === '/spotify/pause' && req.method === 'POST') {
        // Pause playback
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player/pause', 'PUT');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/next' && req.method === 'POST') {
        // Skip to next track
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player/next', 'POST');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/previous' && req.method === 'POST') {
        // Skip to previous track
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player/previous', 'POST');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/playlists' && req.method === 'GET') {
        // Get user's playlists
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/playlists?limit=50');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/recent' && req.method === 'GET') {
        // Get recently played tracks
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player/recently-played?limit=20');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/devices' && req.method === 'GET') {
        // Get available devices
        res.setHeader('Content-Type', 'application/json');
        const data = await spotifyApiRequest('/me/player/devices');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/spotify/token' && req.method === 'GET') {
        // Get current access token (for Web Playback SDK)
        res.setHeader('Content-Type', 'application/json');
        const accessToken = await getSpotifyAccessToken();
        if (!accessToken) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Not authenticated' }));
        } else {
            res.writeHead(200);
            res.end(JSON.stringify({ access_token: accessToken }));
        }
    } else if (pathname === '/spotify/transfer-playback' && req.method === 'PUT') {
        // Transfer playback to a device
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                res.setHeader('Content-Type', 'application/json');
                const result = await spotifyApiRequest('/me/player', 'PUT', data);
                res.writeHead(200);
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (pathname === '/spotify/search' && req.method === 'GET') {
        // Search Spotify (tracks, artists, albums)
        res.setHeader('Content-Type', 'application/json');
        const query = parsedUrl.searchParams.get('q');
        const type = parsedUrl.searchParams.get('type') || 'track';
        const limit = parsedUrl.searchParams.get('limit') || '20';

        if (!query) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing query parameter' }));
            return;
        }

        const searchParams = new URLSearchParams({
            q: query,
            type: type,
            limit: limit
        });

        const data = await spotifyApiRequest(`/search?${searchParams}`);
        res.writeHead(200);
        res.end(JSON.stringify(data));
    } else if (pathname === '/config/panels' && req.method === 'GET') {
        // Get panel configuration
        res.setHeader('Content-Type', 'application/json');
        const configPath = path.join(__dirname, 'config', 'panels.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            res.writeHead(200);
            res.end(configData);
        } catch (error) {
            console.error('Error reading panel config:', error);
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Configuration file not found' }));
        }
    } else if (pathname === '/config/panels' && req.method === 'POST') {
        // Save panel configuration
        res.setHeader('Content-Type', 'application/json');
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newConfig = JSON.parse(body);
                const configPath = path.join(__dirname, 'config', 'panels.json');

                // Read existing config to preserve other settings
                let existingConfig = {};
                try {
                    existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (error) {
                    // If file doesn't exist, start with empty config
                }

                // Merge new panel settings with existing config
                const updatedConfig = {
                    ...existingConfig,
                    ...newConfig,
                    lastUpdated: new Date().toISOString()
                };

                // Write updated config
                fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Configuration saved' }));
            } catch (error) {
                console.error('Error saving panel config:', error);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid configuration data' }));
            }
        });
    } else if (pathname === '/config/panels/reset' && req.method === 'POST') {
        // Reset panel configuration to defaults
        res.setHeader('Content-Type', 'application/json');
        const defaultsPath = path.join(__dirname, 'config', 'defaults.json');
        const configPath = path.join(__dirname, 'config', 'panels.json');

        try {
            const defaultsData = fs.readFileSync(defaultsPath, 'utf8');
            fs.writeFileSync(configPath, defaultsData);

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: 'Configuration reset to defaults' }));
        } catch (error) {
            console.error('Error resetting panel config:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to reset configuration' }));
        }
    } else {
        // Serve static files with enhanced security
        let filePath = pathname === '/' ? '/index.html' : pathname;
        serveStaticFile(filePath, res);
    }
});

// Validate screensaver server URL (enforce HTTPS in production)
if (ENV.EPAPER_SERVER_URL) {
    try {
        const serverUrl = new URL(ENV.EPAPER_SERVER_URL);
        if (serverUrl.protocol === 'http:' && !serverUrl.hostname.match(/^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.)/)) {
            console.warn('> WARNING: Screensaver server URL uses HTTP instead of HTTPS');
            console.warn('> This is insecure for external servers. Use HTTPS for production.');
        }
    } catch (error) {
        console.error('> WARNING: Invalid EPAPER_SERVER_URL:', error.message);
    }
}

server.listen(PORT, () => {
    console.log(`> SYSTEM MONITOR SERVER RUNNING ON PORT ${PORT}`);
    console.log(`> ENDPOINTS: /stats, /financial, /pihole, /network, /health`);
    console.log(`> API PROXIES: /api/weather, /api/weather/forecast, /api/nytimes, /api/youtube/search`);
    console.log(`> SPOTIFY: /spotify/login, /spotify/status, /spotify/current, /spotify/player, /spotify/playlists`);
    console.log(`> WEB INTERFACE: http://localhost:${PORT}`);
    console.log(`> SECURITY: CORS restricted to localhost, API keys protected`);
    console.log(`> Spotify Client ID:`, SPOTIFY_CLIENT_ID !== 'demo' ? 'configured' : 'not configured');
    console.log(`> Spotify authenticated:`, !!(spotifyTokens.access_token && spotifyTokens.refresh_token));
});
