// npm run build: copies the site into dist/ with its own CSS, JavaScript and HTML minified (smaller pages, same
// behaviour). The source files here are never changed. Firebase Hosting deploys dist/ (firebase.json "public"),
// and runs this first (its "predeploy"), so `firebase deploy` always ships a fresh build.
// - CSS and JS: esbuild, file by file (no bundling, no renaming across files, modern syntax kept as written).
//   Files that are already minified (min*.js, *.min.*) are copied as they are.
// - HTML: whitespace and comments only, conservatively (inline scripts, JSON-LD and styles are left untouched).
// - Everything else (images, fonts, video, JSON, XML, txt) is copied unchanged.
import { readdir, readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'esbuild'
import { minify as minifyHtml } from 'html-minifier-terser'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT = join(ROOT, 'dist')
// not part of the website
const SKIP = new Set(['dist', 'node_modules', '.firebase', '.git', 'firebase.json', '.firebaserc', 'firestore.rules',
  'package.json', 'package-lock.json', 'build.mjs', '.gitignore'])

const started = Date.now()
const totals = { files: 0, before: 0, after: 0, minified: 0 }
const kb = (n) => (n / 1024).toFixed(0) + ' KB'

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else yield p
  }
}

const already = (f) => /(^|[\\/])min[^\\/]*\.js$|\.min\.(js|css)$/i.test(f)

async function build(file) {
  const rel = relative(ROOT, file), out = join(OUT, rel), ext = extname(file).toLowerCase()
  await mkdir(dirname(out), { recursive: true })
  const size = (await stat(file)).size
  totals.files++; totals.before += size
  let code = null
  try {
    if ((ext === '.js' || ext === '.mjs') && !already(file)) {
      const src = await readFile(file, 'utf8')
      const isModule = /^\s*(import|export)\s/m.test(src)
      code = (await transform(src, { loader: 'js', minify: true, target: 'esnext', format: isModule ? 'esm' : undefined, legalComments: 'none', charset: 'utf8' })).code
    } else if (ext === '.css' && !already(file)) {
      code = (await transform(await readFile(file, 'utf8'), { loader: 'css', minify: true, target: 'esnext', legalComments: 'none', charset: 'utf8' })).code
    } else if (ext === '.html') {
      code = await minifyHtml(await readFile(file, 'utf8'), {
        collapseWhitespace: true, conservativeCollapse: true, removeComments: true, keepClosingSlash: true,
        minifyCSS: false, minifyJS: false, removeRedundantAttributes: false, removeAttributeQuotes: false,
        ignoreCustomComments: [/^!/], processScripts: []
      })
    }
  } catch (e) {
    console.warn('  ! kept as is (could not minify): ' + rel + ' (' + (e.message || e).toString().split('\n')[0] + ')')
    code = null
  }
  if (code !== null && Buffer.byteLength(code) < size) {
    await writeFile(out, code); totals.after += Buffer.byteLength(code); totals.minified++
  } else {
    await copyFile(file, out); totals.after += size
  }
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
const files = []
for await (const f of walk(ROOT)) files.push(f)
// a few at a time
for (let i = 0; i < files.length; i += 24) await Promise.all(files.slice(i, i + 24).map(build))

console.log('Built dist/: ' + totals.files + ' files (' + totals.minified + ' minified), ' + kb(totals.before) + ' -> ' + kb(totals.after) + ' in ' + ((Date.now() - started) / 1000).toFixed(1) + 's')
