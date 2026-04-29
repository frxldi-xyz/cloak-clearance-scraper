# 🕵️ Cloak Clearance Scraper

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE.md)
[![Cloak Browser](https://img.shields.io/badge/Cloak-Browser-orange.svg)](https://github.com/CloakHQ/CloakBrowser/)

> Advanced Cloudflare bypass solution powered by Cloak Browser. Retrieve page sources, generate Turnstile tokens, and create WAF sessions with military-grade stealth.

## ✨ Features

- 🕵️ **Cloak Browser Core** - Built on real Cloak Browser for maximum stealth
- 🛡️ **Advanced Evasion** - 50+ stealth techniques to bypass bot detection
- ☁️ **Auto Turnstile Solver** - Automatic Cloudflare CAPTCHA resolution
- 🖱️ **Human-like Behavior** - Ghost-cursor for realistic mouse movements
- 🌐 **Proxy Support** - Full proxy authentication support
- ⚡ **High Performance** - Reuses browser contexts for efficiency
- 🔒 **WAF Session Management** - Create persistent sessions for repeated requests

## 📋 Requirements

- Node.js >= 18.0.0
- Cloak Browser (auto-installed if not present)
- Linux: `sudo apt-get install xvfb`

## 🚀 Installation

### Using Docker (Recommended)

```bash
docker pull frxldi-xyz/cloak-clearance-scraper:latest

docker run -d -p 3000:3000 \
  -e PORT=3000 \
  -e browserLimit=20 \
  -e timeOut=60000 \
  frxldi-xyz/cloak-clearance-scraper:latest
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/frxldi-xyz/cloak-clearance-scraper.git
cd cloak-clearance-scraper

# Install dependencies
npm install

# Start the server
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `browserLimit` | Max concurrent browser contexts | `20` |
| `timeOut` | Request timeout (ms) | `60000` |
| `authToken` | API authentication token | `null` |
| `SKIP_LAUNCH` | Skip initial browser launch | `false` |
| `HEADLESS` | Run in headless mode. If unset on Linux without `DISPLAY`, automatically uses headless. | `auto` |
| `DISABLE_XVFB` | Disable Docker entrypoint Xvfb startup | `false` |
| `XVFB_WHD` | Xvfb screen size/depth | `1920x1080x24` |

## 📖 API Documentation

### Endpoint: `POST /cf-clearance-scraper`

All requests use the same endpoint with different `mode` parameters.

#### 1. Get Page Source

Retrieve HTML source from Cloudflare-protected websites.

```javascript
fetch('http://localhost:3000/cf-clearance-scraper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://nopecha.com/demo/cloudflare',
        mode: "source",
        // Optional proxy configuration
        proxy: {
            host: '127.0.0.1',
            port: 3000,
            username: 'username',
            password: 'password'
        }
    })
})
.then(res => res.json())
.then(data => {
    console.log(data.source); // HTML content
});
```

**Response:**
```json
{
    "code": 200,
    "source": "<!DOCTYPE html>..."
}
```

#### 2. Create WAF Session

Create a persistent session with cookies and headers for repeated requests.

```javascript
const initCycleTLS = require('cycletls');

async function scrapeWithSession() {
    // 1. Create WAF session
    const session = await fetch('http://localhost:3000/cf-clearance-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: 'https://nopecha.com/demo/cloudflare',
            mode: "waf-session"
        })
    }).then(res => res.json());

    if (session.code !== 200) {
        throw new Error('Session creation failed');
    }

    // 2. Use session with CycleTLS (or any HTTP client)
    const cycleTLS = await initCycleTLS();
    const response = await cycleTLS('https://nopecha.com/demo/cloudflare', {
        body: '',
        ja3: '772,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,23-27-65037-43-51-45-16-11-13-17513-5-18-65281-0-10-35,25497-29-23-24,0',
        userAgent: session.headers["user-agent"],
        headers: {
            ...session.headers,
            cookie: session.cookies.map(c => `${c.name}=${c.value}`).join('; ')
        }
    }, 'get');

    console.log('Status:', response.status);
    console.log('Body:', response.body);
    
    cycleTLS.exit();
}

scrapeWithSession();
```

**Response:**
```json
{
    "code": 200,
    "cookies": [
        { "name": "cf_clearance", "value": "...", "domain": "..." }
    ],
    "headers": {
        "user-agent": "...",
        "accept-language": "..."
    }
}
```

#### 3. Solve Turnstile (Minimal)

Generate Turnstile tokens with minimal resource usage. Requires `siteKey`.

```javascript
fetch('http://localhost:3000/cf-clearance-scraper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://turnstile.zeroclover.io/',
        siteKey: "0x4AAAAAAAEwzhD6pyKkgXC0",
        mode: "turnstile-min",
        proxy: {
            host: '127.0.0.1',
            port: 3000
        }
    })
})
.then(res => res.json())
.then(data => {
    console.log(data.token); // Turnstile token
});
```

**Response:**
```json
{
    "code": 200,
    "token": "0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

#### 4. Solve Turnstile (Full Page)

Load the complete page and solve Turnstile automatically.

```javascript
fetch('http://localhost:3000/cf-clearance-scraper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://turnstile.zeroclover.io/',
        mode: "turnstile-max",
        proxy: {
            host: '127.0.0.1',
            port: 3000
        }
    })
})
.then(res => res.json())
.then(data => {
    console.log(data.token); // Turnstile token
});
```

### Request Schema

```typescript
interface Request {
    url: string;                    // Target URL (required)
    mode: "source" | "waf-session" | "turnstile-min" | "turnstile-max";
    siteKey?: string;              // Required for turnstile-min mode
    proxy?: {
        host: string;
        port: number;
        username?: string;
        password?: string;
    };
    authToken?: string;            // If server requires authentication
}
```

### Error Responses

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request schema |
| 401 | Unauthorized | Invalid or missing authToken |
| 429 | Too Many Requests | browserLimit reached |
| 500 | Internal Server Error | Browser not ready or processing error |
| 503 | Service Unavailable | Timeout or browser crash |

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Your Request  │────▶│  Cloak Browser   │────▶│  Cloudflare     │
│                 │     │  (Stealth Mode)  │     │  Protected Site │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Turnstile       │
                        │  Auto-Solver     │
                        └──────────────────┘
```

### How It Works

1. **Browser Management**: Uses Cloak Browser with 50+ stealth patches
2. **Context Isolation**: Each request runs in isolated browser context
3. **Auto-Detection**: Automatically detects and solves Cloudflare challenges
4. **Session Persistence**: Cookies and headers extracted for reuse

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="source"
```

## 🐳 Docker Compose Example

```yaml
version: '3.8'

services:
  cloak-scraper:
    image: frxldi-xyz/cloak-clearance-scraper:latest
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - browserLimit=20
      - timeOut=60000
      - authToken=frxldi-xyz-token
      # Keep HEADLESS=false/unset to run headful CloakBrowser under Xvfb in Docker
      - HEADLESS=false
    restart: unless-stopped
    shm_size: '2gb'
```

## ⚙️ Advanced Configuration

### Custom CloakBrowser Path

Create `.env` file:

```bash
CLOAKBROWSER_BINARY_PATH=/path/to/cloakbrowser-or-chromium
```

If this variable is not set, `cloak-real-puppeteer-core`/`cloakbrowser` downloads and uses its managed binary automatically.

### Proxy Chain

```javascript
const proxies = [
    { host: 'proxy1.com', port: 8080, username: 'user1', password: 'pass1' },
    { host: 'proxy2.com', port: 8080, username: 'user2', password: 'pass2' }
];

const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];

fetch('http://localhost:3000/cf-clearance-scraper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://example.com',
        mode: 'source',
        proxy: randomProxy
    })
});
```

## 🔒 Security Notes

- Always use `authToken` in production
- Restrict access to port 3000 using firewall rules
- Consider using HTTPS reverse proxy (nginx/Caddy)
- Monitor resource usage to prevent abuse

## 📊 Performance Tips

1. **Adjust `browserLimit`** based on your server's RAM
2. **Use `waf-session` mode** for repeated requests to same site
3. **Enable `SKIP_LAUNCH=true`** if you don't need immediate browser
4. **Use `turnstile-min` mode** for faster token generation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- **Cloak Software** - For the excellent Cloak Browser
- **Ghost Cursor** - Human-like mouse movements
- **Rebrowser** - Runtime patches for stealth

## ⚠️ Disclaimer

This tool is for educational and testing purposes only. Users are responsible for complying with:

- Website Terms of Service
- Local laws and regulations
- robots.txt directives
- Rate limiting policies

The authors assume no liability for misuse of this software.

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/frxldi-xyz/cloak-clearance-scraper/issues)
- Discussions: [Ask a question](https://github.com/frxldi-xyz/cloak-clearance-scraper/discussions)

---

<p align="center">Made with ❤️ and 🕵️ Cloak Browser</p>
