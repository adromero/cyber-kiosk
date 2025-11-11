// Lightweight System Monitor Server for Raspberry Pi
// Exposes system statistics via HTTP API

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

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

// Financial API Configuration
// Get free API key from: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = ENV.ALPHA_VANTAGE_API_KEY || 'demo';

// Helper function to execute shell commands
function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
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
        const temp = await execCommand('cat /sys/class/thermal/thermal_zone0/temp');
        return (parseInt(temp) / 1000).toFixed(1);
    } catch (error) {
        console.error('Error getting CPU temp:', error);
        return null;
    }
}

// Get GPU temperature
async function getGPUTemp() {
    try {
        const output = await execCommand('vcgencmd measure_temp');
        const match = output.match(/temp=([0-9.]+)/);
        return match ? parseFloat(match[1]).toFixed(1) : null;
    } catch (error) {
        console.error('Error getting GPU temp:', error);
        return null;
    }
}

// Get system uptime
async function getUptime() {
    try {
        const uptimeSeconds = parseFloat(await execCommand('cat /proc/uptime | awk \'{print $1}\''));
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
        console.error('Error getting uptime:', error);
        return null;
    }
}

// Get load average
async function getLoadAverage() {
    try {
        const loadavg = await execCommand('cat /proc/loadavg | awk \'{print $1, $2, $3}\'');
        const [load1, load5, load15] = loadavg.split(' ');
        return { load1, load5, load15 };
    } catch (error) {
        console.error('Error getting load average:', error);
        return null;
    }
}

// Get memory usage
async function getMemoryUsage() {
    try {
        const memInfo = await execCommand('free -m | grep Mem:');
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
        console.error('Error getting memory usage:', error);
        return null;
    }
}

// Get CPU usage
async function getCPUUsage() {
    try {
        // Read CPU stats twice with a small delay to calculate usage
        const stat1 = await execCommand('cat /proc/stat | grep "^cpu " | awk \'{print $2, $3, $4, $5}\'');
        await new Promise(resolve => setTimeout(resolve, 200));
        const stat2 = await execCommand('cat /proc/stat | grep "^cpu " | awk \'{print $2, $3, $4, $5}\'');

        const [user1, nice1, system1, idle1] = stat1.split(' ').map(Number);
        const [user2, nice2, system2, idle2] = stat2.split(' ').map(Number);

        const total1 = user1 + nice1 + system1 + idle1;
        const total2 = user2 + nice2 + system2 + idle2;
        const idle = idle2 - idle1;
        const total = total2 - total1;

        const usage = Math.round(100 * (total - idle) / total);
        return usage;
    } catch (error) {
        console.error('Error getting CPU usage:', error);
        return null;
    }
}

// Get disk usage
async function getDiskUsage() {
    try {
        const output = await execCommand('df -h / | tail -1 | awk \'{print $2, $3, $5}\'');
        const [total, used, percent] = output.split(' ');
        return {
            total,
            used,
            percent: percent.replace('%', '')
        };
    } catch (error) {
        console.error('Error getting disk usage:', error);
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
const CACHE_DURATION = 1800000; // 30 minute cache (to stay within API limits)

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
        const https = require('https');
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
        const https = require('https');
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_API_KEY}`;

        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed['Realtime Currency Exchange Rate']) {
                        const rate = parseFloat(parsed['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                        resolve({ rate: rate, change: 0 }); // Alpha Vantage doesn't provide change %
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

        // Use ETFs that track the indices (Alpha Vantage free tier doesn't support indices directly)
        // DIA = SPDR Dow Jones Industrial Average ETF (tracks DOW)
        // SPY = SPDR S&P 500 ETF (tracks S&P 500)
        // QQQ = Invesco QQQ Trust (tracks NASDAQ-100)
        // GLD = SPDR Gold Shares (tracks gold price)

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
        // DIA tracks DOW at roughly 1/100th (multiply by ~100)
        // SPY tracks S&P at roughly 1/10th (multiply by ~10)
        // QQQ tracks NASDAQ-100 at roughly 1/40th (multiply by ~40)
        // GLD tracks gold at roughly 1/10th (multiply by ~10)

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
    // Small random variations (-0.5% to +0.5%)
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

// Get Pi-hole statistics
async function getPiholeStats() {
    try {
        // Query Pi-hole FTL database for statistics
        const totalQueries = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT value FROM counters WHERE id=0;"');
        const blockedQueries = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT value FROM counters WHERE id=1;"');
        const uniqueClients = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT COUNT(DISTINCT client) FROM queries;"');
        const totalDomains = await execCommand('sudo sqlite3 /etc/pihole/gravity.db "SELECT COUNT(*) FROM gravity;"');

        // Additional statistics
        const cachedQueries = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT COUNT(*) FROM queries WHERE status = 3;"');
        const forwardedQueries = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT COUNT(*) FROM queries WHERE status = 2;"');
        const uniqueDomains = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT COUNT(DISTINCT domain) FROM queries;"');

        // Top 5 blocked domains
        const topBlockedRaw = await execCommand('sudo sqlite3 /etc/pihole/pihole-FTL.db "SELECT domain, COUNT(*) as count FROM queries WHERE status IN (1, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16) GROUP BY domain ORDER BY count DESC LIMIT 5;"');
        const topBlocked = topBlockedRaw.split('\n').filter(line => line.trim()).map(line => {
            const parts = line.split('|');
            return { domain: parts[0], count: parseInt(parts[1]) || 0 };
        });

        const total = parseInt(totalQueries) || 0;
        const blocked = parseInt(blockedQueries) || 0;
        const percentBlocked = total > 0 ? ((blocked / total) * 100).toFixed(2) : '0.00';

        return {
            status: 'active',
            queries_today: total,
            blocked_today: blocked,
            percent_blocked: percentBlocked,
            domains_blocked: parseInt(totalDomains) || 0,
            clients: parseInt(uniqueClients) || 0,
            cached_queries: parseInt(cachedQueries) || 0,
            forwarded_queries: parseInt(forwardedQueries) || 0,
            unique_domains: parseInt(uniqueDomains) || 0,
            top_blocked: topBlocked
        };
    } catch (error) {
        console.error('Error getting Pi-hole stats:', error);
        return {
            status: 'error',
            error: error.message
        };
    }
}

// Get Network Statistics
async function getNetworkStats() {
    try {
        // Get vnStat data in JSON format
        const vnstatOutput = await execCommand('vnstat --json');
        const vnstat = JSON.parse(vnstatOutput);

        // Find wlan0 interface
        const wlan0 = vnstat.interfaces.find(iface => iface.name === 'wlan0');

        if (!wlan0) {
            return {
                status: 'error',
                error: 'wlan0 interface not found'
            };
        }

        // Extract today's data
        const today = wlan0.traffic.day[0] || { rx: 0, tx: 0 };
        const month = wlan0.traffic.month[0] || { rx: 0, tx: 0 };

        // Get current connection status
        const ipAddr = await execCommand('ip addr show wlan0 | grep "inet " | awk \'{print $2}\'');
        const gateway = await execCommand('ip route | grep default | awk \'{print $3}\'');

        // Get active connections summary
        const connections = await execCommand('ss -s');

        return {
            status: 'online',
            interface: 'wlan0',
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
                rx: wlan0.traffic.total.rx,
                tx: wlan0.traffic.total.tx
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

// Helper function to serve static files
function serveStaticFile(filePath, res) {
    const extname = path.extname(filePath).toLowerCase();
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

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - File Not Found');
            } else {
                res.writeHead(500);
                res.end('500 - Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // API endpoints
    if (req.url === '/stats' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
            const stats = await getSystemStats();
            res.writeHead(200);
            res.end(JSON.stringify(stats));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get system stats' }));
        }
    } else if (req.url === '/financial' && req.method === 'GET') {
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
    } else if (req.url === '/pihole' && req.method === 'GET') {
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
    } else if (req.url === '/network' && req.method === 'GET') {
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
    } else if (req.url === '/health' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
    } else if (req.url === '/config' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({
            zipCode: ENV.ZIP_CODE || '90210',
            weatherApiKey: ENV.OPENWEATHER_API_KEY || '',
            nytApiKey: ENV.NYT_API_KEY || '',
            youtubeApiKey: ENV.YOUTUBE_API_KEY || '',
            imageChangeInterval: 30000,
            weatherUpdateInterval: 600000,
            newsUpdateInterval: 300000,
            weatherCycleInterval: 300000,
            systemMonitorUrl: 'http://localhost:3001/stats',
            systemUpdateInterval: 30000
        }));
    } else {
        // Serve static files
        let filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './index.html';
        }

        // Prevent directory traversal
        const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(__dirname, safePath);

        serveStaticFile(fullPath, res);
    }
});

server.listen(PORT, () => {
    console.log(`> SYSTEM MONITOR SERVER RUNNING ON PORT ${PORT}`);
    console.log(`> ENDPOINTS: /stats, /financial, /pihole, /network, /health`);
    console.log(`> WEB INTERFACE: http://localhost:${PORT}`);
});
