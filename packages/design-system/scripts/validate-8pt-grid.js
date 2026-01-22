#!/usr/bin/env node
/**
 * Validates that all Tailwind classes use 8pt grid system
 * Run with: node scripts/validate-8pt-grid.js
 */

import { readFileSync } from 'fs'
import { globSync } from 'glob'

const VIOLATIONS = []

// Spacing values that violate 8pt grid
const INVALID_SIZES = ['3', '7', '9', '11', '13', '15'] // non-8pt values

// Arbitrary value patterns that might violate 8pt
const ARBITRARY_PATTERN = /\[([\d.]+)(px|rem|em)\]/g

function checkFile(filepath) {
  const content = readFileSync(filepath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1

    // Check for invalid spacing (px-3, p-3, m-3, h-3, w-3, etc.)
    INVALID_SIZES.forEach(size => {
      const patterns = [
        `px-${size}`, `py-${size}`, `pt-${size}`, `pb-${size}`, `pl-${size}`, `pr-${size}`, `p-${size}`,
        `mx-${size}`, `my-${size}`, `mt-${size}`, `mb-${size}`, `ml-${size}`, `mr-${size}`, `m-${size}`,
        `gap-${size}`, `space-x-${size}`, `space-y-${size}`, `w-${size}`, `h-${size}`,
      ]

      patterns.forEach(pattern => {
        if (line.includes(pattern)) {
          VIOLATIONS.push({
            file: filepath,
            line: lineNum,
            class: pattern,
            reason: `Not divisible by 8 (${size} * 4px = ${size * 4}px)`,
          })
        }
      })
    })

    // Check arbitrary values like text-[13px], h-[37px], etc.
    let match
    while ((match = ARBITRARY_PATTERN.exec(line)) !== null) {
      const value = parseFloat(match[1])
      const unit = match[2]
      
      let pxValue = value
      if (unit === 'rem') pxValue = value * 16
      if (unit === 'em') pxValue = value * 16

      if (pxValue % 8 !== 0) {
        VIOLATIONS.push({
          file: filepath,
          line: lineNum,
          class: match[0],
          reason: `${pxValue}px is not divisible by 8`,
        })
      }
    }
  })
}

// Scan all component files
const files = globSync('src/**/*.{ts,tsx,js,jsx}')
files.forEach(checkFile)

// Report violations
if (VIOLATIONS.length > 0) {
  console.error('\n❌ 8pt Grid Violations Found:\n')
  VIOLATIONS.forEach(({ file, line, class: className, reason }) => {
    console.error(`  ${file}:${line}`)
    console.error(`    Class: ${className}`)
    console.error(`    Reason: ${reason}\n`)
  })
  process.exit(1)
} else {
  console.log('✅ All spacing values follow 8pt grid system')
}
