import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const iconsDir = join(process.cwd(), 'extension', 'icons')
const favicon = join(process.cwd(), 'public', 'favicon.png')

mkdirSync(iconsDir, { recursive: true })

for (const size of [16, 48, 128]) {
  copyFileSync(favicon, join(iconsDir, `icon${size}.png`))
}

console.log('Extension icons ready.')
