/**
 * inline.mjs — встраивает JS и CSS в dist/index.html
 * Убирает всё что мешает открытию через file://
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir   = path.join(__dirname, 'dist')
const htmlFile  = path.join(distDir, 'index.html')

if (!fs.existsSync(htmlFile)) {
  console.error('❌ dist/index.html не найден. Сначала: npm run build')
  process.exit(1)
}

let html = fs.readFileSync(htmlFile, 'utf8')

// Удаляем всё, что Chrome блокирует при file://
html = html.replace(/<base[^>]*\/?>/gi, '')
html = html.replace(/<link[^>]+rel=["']modulepreload["'][^>]*\/?>/gi, '')

// Встраиваем CSS
html = html.replace(
  /<link([^>]+)href=["']([^"']+\.css)["']([^>]*)>/gi,
  (match, before, href, after) => {
    const filePath = path.join(distDir, href.replace(/^\.\//, ''))
    if (!fs.existsSync(filePath)) return match
    const css = fs.readFileSync(filePath, 'utf8')
    console.log(`CSS: ${path.basename(href)} (${(css.length/1024).toFixed(0)} KB)`)
    return `<style>${css}</style>`
  }
)

// Встраиваем JS, убираем type="module" и crossorigin
html = html.replace(
  /<script([^>]*)><\/script>/gi,
  (match, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/)
    if (!srcMatch) return match
    const href = srcMatch[1]
    const filePath = path.join(distDir, href.replace(/^\.\//, ''))
    if (!fs.existsSync(filePath)) return match
    const js = fs.readFileSync(filePath, 'utf8')
    console.log(`JS:  ${path.basename(href)} (${(js.length/1024).toFixed(0)} KB)`)
    const cleanAttrs = attrs
      .replace(/\s*type=["']module["']/gi, '')
      .replace(/\s*crossorigin(=["'][^"']*["'])?/gi, '')
      .replace(/\s*src=["'][^"']+["']/gi, '')
      .trim()
    return `<script${cleanAttrs ? ' '+cleanAttrs : ''}>${js}</script>`
  }
)

fs.writeFileSync(htmlFile, html)
console.log('\n✅ Готово! Открывайте dist/index.html двойным кликом.')
