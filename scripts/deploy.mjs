/**
 * build 产物上传：逻辑对齐 KS-v10/packages/v10-cli
 * 1. 校验登录，并从 IDE 文件树取得应用根目录（appPath）
 * 2. 按 uploadTo 相对路径解析目标，执行时确认（可浏览重选）
 * 3. 将 distDir 打成 zip，调用 sys/file/import-files 导入解压
 *
 * 用法：
 *   npm run deploy                   # icejs build + 上传
 *   npm run deploy:upload            # 仅上传
 *   node scripts/deploy.mjs --yes    # 跳过确认（CI）
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import prompts from 'prompts'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(root, 'deploy.config.json')

/** Node < 18 无原生 fetch / FormData / Blob，回退到 node-fetch@2 + form-data */
let httpFetch = globalThis.fetch
let FormDataCtor = globalThis.FormData
let BlobCtor = globalThis.Blob
let legacyFormData = false

const ensureHttp = () => {
  if (typeof httpFetch === 'function' && typeof FormDataCtor === 'function' && typeof BlobCtor === 'function') return
  try {
    httpFetch = require('node-fetch')
  } catch {
    throw new Error(
      `当前 Node ${process.version} 无原生 fetch。请升级到 Node 18+（推荐），或执行: npm i -D node-fetch@2 form-data`,
    )
  }
  if (typeof FormDataCtor !== 'function' || typeof BlobCtor !== 'function') {
    try {
      FormDataCtor = require('form-data')
      legacyFormData = true
    } catch {
      throw new Error(`请执行: npm i -D form-data（当前 Node ${process.version} 需要它上传 zip）`)
    }
  }
}

const readSetCookies = (resp) => {
  if (typeof resp.headers.getSetCookie === 'function') return resp.headers.getSetCookie()
  const raw = resp.headers.raw?.()['set-cookie']
  if (Array.isArray(raw)) return raw
  const single = resp.headers.get('set-cookie')
  return single ? [single] : []
}

const ajaxHeaders = { 'X-Requested-With': 'XMLHttpRequest', 'W-Requested-With': 'XMLHttpRequest' }
const sessionCheckPath = 'm?xwl=sys/file/get&type=ide'
const withSlash = (s) => (s.endsWith('/') ? s : `${s}/`)
const folderOf = (...parts) =>
  `${parts
    .map((p, i) => (i === 0 ? String(p).replace(/\/+$/, '') : String(p).replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/')}/`
const trimSlash = (s) => String(s).replace(/^\/+|\/+$/g, '')
const onCancel = () => process.exit(1)

const ask = async (question) => (await prompts({ ...question, name: 'value' }, { onCancel })).value
const confirm = (message, initial = true) => ask({ type: 'confirm', message, initial })
const pick = (message, choices) =>
  ask({
    type: 'autocomplete',
    message: `${message}（可输入过滤）`,
    choices,
    limit: 20,
    suggest: async (input, list) => list.filter((c) => c.title.toLowerCase().includes(input.toLowerCase())),
  })

const loadConfig = () => {
  if (!existsSync(configPath)) {
    console.error(`❌ 找不到 ${configPath}\n   复制 deploy.config.example.json 为 deploy.config.json 后填写`)
    process.exit(1)
  }
  const raw = JSON.parse(readFileSync(configPath, 'utf-8'))
  if (raw.insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const cookie = process.env.DEPLOY_COOKIE ?? raw.cookie ?? ''
  // uploadPath：服务器绝对路径（本项目静态资源在 /data/app/...，不在 IDE 应用根下）
  // uploadTo：相对 IDE 应用根目录（与 v10-cli 一致）；仅在未配置 uploadPath 时使用
  const uploadPath = raw.uploadPath ? folderOf(raw.uploadPath) : ''
  return {
    baseUrl: withSlash(raw.baseUrl),
    cookie: !cookie || /复制|^\s*$/.test(cookie) ? '' : cookie,
    username: raw.username ?? '',
    password: raw.password ?? '',
    distDir: raw.distDir ?? 'build',
    uploadPath,
    uploadTo: raw.uploadTo || 'ibcm-flow-ui',
  }
}

const saveCookie = (cookie) => {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'))
  config.cookie = cookie
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

const headersOf = (env, extra = {}) => ({ Cookie: env.cookie, ...ajaxHeaders, ...extra })

const request = async (env, url, init = {}, extraHeaders) => {
  ensureHttp()
  const options = { ...init, headers: headersOf(env, extraHeaders), redirect: 'manual' }
  try {
    return await httpFetch(url, options)
  } catch (err) {
    if (!(err instanceof TypeError)) throw err
    return httpFetch(url, options)
  }
}

class LoginExpiredError extends Error {}

const checkStatus = (resp, text, what) => {
  if (resp.status === 401 || resp.status === 402) throw new LoginExpiredError(`登录已失效 (HTTP ${resp.status})`)
  if (resp.status >= 300 && resp.status < 400) {
    throw new LoginExpiredError(`被重定向到 ${resp.headers.get('location') ?? '登录页'}，登录已失效`)
  }
  if (resp.status === 403) throw new Error(`${what}失败：当前账号没有权限 (403) ${text.slice(0, 200)}`)
  if (!resp.ok) throw new Error(`${what}失败: HTTP ${resp.status} ${text.slice(0, 300)}`)
}

const parseJson = (text, what) => {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${what}返回的不是 JSON，可能被重定向到了登录页: ${text.slice(0, 200)}`)
  }
}

const v10Login = async (baseUrl, username, password) => {
  ensureHttp()
  const jar = new Map()
  const req = async (p, init = {}) => {
    const resp = await httpFetch(baseUrl + p, {
      ...init,
      redirect: 'manual',
      headers: { ...ajaxHeaders, Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
    })
    for (const setCookie of readSetCookies(resp)) {
      const [pair] = setCookie.split(';')
      const index = pair.indexOf('=')
      jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim())
    }
    return { status: resp.status, text: await resp.text() }
  }
  await req('login')
  const result = await req('verify', {
    method: 'POST',
    body: new URLSearchParams({ username, password, verifyCode: '' }),
  })
  if (result.status !== 200) {
    throw new Error(`登录失败: ${result.text.replace(/<[^>]+>/g, '').slice(0, 200) || `HTTP ${result.status}`}`)
  }
  const sessionId = jar.get('JSESSIONID')
  if (!sessionId) throw new Error('登录失败: 服务器没有返回 JSESSIONID')
  return `JSESSIONID=${sessionId}`
}

/** 与 CLI 一致：sys/file/get&type=ide 无 path 时返回模块 / 应用 / 系统三个根 */
const fetchRoots = async (env) => {
  if (!env.cookie) throw new LoginExpiredError('没有配置 cookie')
  const resp = await request(env, `${env.baseUrl}${sessionCheckPath}`, { method: 'POST' })
  const text = await resp.text()
  checkStatus(resp, text, '读取 IDE 文件树')
  const { items } = parseJson(text, '读取 IDE 文件树')
  const [modulePath, appPath] = [items?.[0]?.path, items?.[1]?.path]
  if (!modulePath || !appPath) throw new Error(`无法识别 IDE 文件树根节点: ${text.slice(0, 200)}`)
  return { modulePath: folderOf(modulePath), appPath: folderOf(appPath) }
}

const ensureSession = async (env) => {
  const login = async () => {
    if (!env.username || !env.password) throw new LoginExpiredError('登录已失效，且未填写 username / password')
    console.log(`   🔄 使用 ${env.username} 登录…`)
    env.cookie = await v10Login(env.baseUrl, env.username, env.password)
    saveCookie(env.cookie)
  }

  if (!env.cookie) await login()

  try {
    env.roots = await fetchRoots(env)
  } catch (err) {
    if (!(err instanceof LoginExpiredError)) throw err
    await login()
    env.roots = await fetchRoots(env)
  }
  return env.roots
}

const call = async (env, xwl, params, what) => {
  const resp = await request(env, `${env.baseUrl}m?xwl=${xwl}`, {
    method: 'POST',
    body: new URLSearchParams(params),
  })
  const text = await resp.text()
  checkStatus(resp, text, what)
  return text
}

const listDir = async (env, absFolder) => {
  const text = await call(env, 'sys/file/get', { path: absFolder, type: 'ide' }, `读取目录 ${absFolder}`)
  const items = parseJson(text, `读取目录 ${absFolder}`)
  return items.map((c) => ({
    name: String(c.text),
    leaf: !!c._leaf,
    path: c.path == null || c.path === '' ? undefined : String(c.path),
  }))
}

const validateFolder = (name) => (/^[A-Za-z0-9_-]+$/.test(name) ? true : '只能由字母、数字、- 或 _ 组成')

/** 按相对路径逐级匹配应用目录，不存在的部分标记为新建 */
const resolvePath = async (env, relPath) => {
  const segments = []
  for (const name of relPath.split('/').filter(Boolean)) {
    if (segments.some((s) => s.isNew)) {
      const valid = validateFolder(name)
      if (valid !== true) throw new Error(`新建目录 ${name}：${valid}`)
      segments.push({ name, isNew: true })
      continue
    }
    const abs = folderOf(env.roots.appPath, ...segments.map((s) => s.name))
    const children = await listDir(env, abs)
    const dir = children.find((c) => !c.leaf && c.name === name)
    if (dir) segments.push({ name })
    else {
      const valid = validateFolder(name)
      if (valid !== true) throw new Error(`新建目录 ${name}：${valid}`)
      segments.push({ name, isNew: true })
    }
  }
  return segments
}

const segmentPath = (segments) => segments.map((s) => s.name).join('/')

const absOf = (env, segments) => folderOf(env.roots.appPath, ...segments.map((s) => s.name))

/** 交互浏览应用目录，与 CLI browse 相同思路 */
const browse = async (env, start) => {
  const segments = [...start]
  for (;;) {
    const isNew = segments.some((s) => s.isNew)
    const children = isNew ? [] : await listDir(env, absOf(env, segments))
    const dirs = children.filter((c) => !c.leaf)
    const where = segments.length ? segmentPath(segments) : '应用根目录'
    const value = await pick('部署到', [
      { title: `✅ 选择这里  ${where}${segments.at(-1)?.isNew ? '（新建）' : ''}`, value: '$here' },
      ...(segments.length ? [{ title: '⬆️  返回上一级', value: '$up' }] : []),
      { title: '➕ 新建文件夹…', value: '$new' },
      ...dirs.map((d) => ({ title: `📁 ${d.name}`, value: `d:${d.name}` })),
    ])
    if (value === '$here') {
      if (!segments.length) {
        console.log('   ⚠️  不能直接放到应用根目录，请进入或新建子目录')
        continue
      }
      return segments
    }
    if (value === '$up') segments.pop()
    else if (value === '$new') {
      const name = await ask({
        type: 'text',
        message: `在 ${where} 下新建文件夹`,
        initial: 'ibcm-flow-ui',
        validate: (v) => (dirs.some((d) => d.name === v) ? '该文件夹已存在，直接在列表中选择即可' : validateFolder(v)),
      })
      segments.push({ name, isNew: true })
    } else {
      segments.push({ name: value.slice(2) })
    }
  }
}

const chooseTarget = async (env, cfg, skipConfirm) => {
  console.log(`   📂 IDE 应用根目录: ${env.roots.appPath}`)
  console.log(`   ℹ️  该目录是 WorkBench 模块/页面树，静态前端通常不在这里`)

  // 优先用绝对路径 uploadPath（如 /data/app/ibcm_front/ibcm-flow-ui）
  let target = cfg.uploadPath
  let fromIde = false

  if (!target) {
    const segments = await resolvePath(env, cfg.uploadTo)
    target = absOf(env, segments)
    fromIde = true
    const hint = segments.some((s) => s.isNew) ? '（将新建）' : ''
    console.log(`   📍 配置 uploadTo: ${cfg.uploadTo}  →  ${target}${hint}`)
  } else {
    console.log(`   📍 配置 uploadPath（绝对路径）: ${target}`)
  }

  if (skipConfirm) return { target }

  const mode = await pick('选择上传目标', [
    { title: `✅ 使用配置路径  ${target}`, value: 'config' },
    { title: '✏️  手动输入服务器绝对路径…', value: 'abs' },
    { title: '📁 在 IDE 应用目录中浏览…', value: 'browse' },
    { title: '❌ 取消', value: 'cancel' },
  ])

  if (mode === 'cancel') {
    console.log('   已取消')
    process.exit(0)
  }

  if (mode === 'abs') {
    const input = await ask({
      type: 'text',
      message: '服务器绝对路径',
      initial: target || '/data/app/ibcm_front/ibcm-flow-ui',
      validate: (v) => (String(v).trim().startsWith('/') ? true : '请输入以 / 开头的绝对路径'),
    })
    target = folderOf(input.trim())
  } else if (mode === 'browse') {
    const start = fromIde ? await resolvePath(env, cfg.uploadTo) : []
    const segments = await browse(env, start)
    target = absOf(env, segments)
  }

  console.log(`   📍 将上传到: ${target}`)
  const ok = await confirm(`确认上传到 ${target}？`, true)
  if (!ok) {
    console.log('   已取消')
    process.exit(0)
  }
  return { target }
}

/** 与 v10-cli zipDist 一致：目录条目在文件之前，路径一律用 / */
const zipDist = (distPath) => {
  const zip = new AdmZip()
  const walk = (rel) => {
    for (const name of readdirSync(path.join(distPath, rel)).sort()) {
      if (name === '.DS_Store') continue
      const relPath = rel ? `${rel}/${name}` : name
      const full = path.join(distPath, relPath)
      if (statSync(full).isDirectory()) {
        zip.addFile(`${relPath}/`, Buffer.alloc(0))
        walk(relPath)
      } else {
        zip.addFile(relPath, readFileSync(full))
      }
    }
  }
  walk('')
  return zip
}

const importZip = async (env, targetFolder, zip, zipName) => {
  ensureHttp()
  const form = new FormDataCtor()
  form.append('path', targetFolder)
  form.append('unzip', 'true')
  form.append('charset', 'UTF-8')
  const buf = zip.toBuffer()
  if (legacyFormData) {
    form.append('files', buf, { filename: zipName, contentType: 'application/zip' })
  } else {
    form.append('files', new BlobCtor([new Uint8Array(buf)], { type: 'application/zip' }), zipName)
  }

  const extra = legacyFormData && typeof form.getHeaders === 'function' ? form.getHeaders() : {}
  const resp = await request(env, `${env.baseUrl}m?xwl=sys/file/import-files&mode=ide`, {
    method: 'POST',
    body: form,
  }, extra)
  const text = await resp.text()
  if (process.argv.includes('--debug')) {
    console.log(`   [debug] HTTP ${resp.status}`)
    console.log(`   [debug] body: ${text.slice(0, 1500)}`)
  }
  checkStatus(resp, text, '上传解压')
}

const main = async () => {
  const skipBuild = process.argv.includes('--upload-only')
  const skipConfirm = process.argv.includes('--yes') || process.argv.includes('-y')
  const env = loadConfig()

  console.log(`\n📦 ibcm_flow`)

  if (!skipBuild) {
    console.log('   🔨 icejs build')
    execSync('npx icejs build', { cwd: root, stdio: 'inherit' })
  }

  const distPath = path.resolve(root, env.distDir)
  if (!existsSync(distPath) || !statSync(distPath).isDirectory()) {
    throw new Error(`构建产物目录不存在: ${distPath}`)
  }

  await ensureSession(env)
  const { target } = await chooseTarget(env, env, skipConfirm)

  const zip = zipDist(distPath)
  console.log(`   🗜  打包完成 ${(zip.toBuffer().length / 1024).toFixed(1)} KB`)

  await importZip(env, target, zip, 'ibcm_flow.zip')
  console.log('   ⬆️  上传并解压完成')
  console.log(`   ✅ 目标目录: ${target}\n`)
}

main().catch((err) => {
  const msg = err.message || String(err)
  const tip = /fetch is not defined/i.test(msg)
    ? `当前 Node ${process.version} 无原生 fetch，请执行: npm i -D node-fetch@2 form-data\n   或升级到 Node 18+`
    : /Failed to parse URL/.test(msg)
      ? `baseUrl 无效，请在 deploy.config.json 中填写真实 WorkBench 地址`
      : msg
  console.error(`\n❌ ${tip}`)
  if (err instanceof LoginExpiredError || /登录/.test(msg)) {
    console.error('   在 deploy.config.json 中填写 username / password 即可自动登录，或从浏览器复制 cookie（JSESSIONID=...）')
  }
  process.exit(1)
})
