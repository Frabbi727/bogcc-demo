/**
 * Regenerates the Flutter app's lib/catalogue/names.dart from names.ts.
 *
 * Generated rather than retyped so no Bangla string is mistranscribed. Run it
 * whenever the names here change:
 *
 *   npx tsx tool/parity/gen-names.mts > \
 *     ../../bogcc_demo_mobile_app/lib/catalogue/names.dart
 */
import * as N from '../../src/data/names'

const q = (s: unknown) =>
  "'" +
  String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$') +
  "'"

const camel = (s: string) => s.toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())

const LISTS = [
  'MALE_NAMES', 'FEMALE_NAMES', 'FATHER_NAMES', 'MOTHER_NAMES', 'ROADS',
  'VEHICLES', 'DRIVERS', 'SUPERVISORS', 'TECHNICIANS', 'CLEANING_TEAMS',
  'MATERIALS', 'HEIR_RELATIONS', 'MARKETS', 'SHOP_TRADES', 'DESIGNERS',
] as const

const out: string[] = [
  `/// Invented names and place names used by the seed builder.
///
/// EVERY person, business, vehicle and trade name here is fictional. Only the
/// Bogura road and area names are real.
///
/// Generated from the web demo's \`src/data/names.ts\` by
/// \`tool/parity/gen-names.mts\` rather than retyped, so no Bangla string is
/// mistranscribed. Regenerate rather than hand-editing.
library;
`,
]

for (const name of LISTS) {
  const value = (N as Record<string, string[]>)[name]
  out.push(`const ${camel(name)} = <String>[\n  ${value.map(q).join(',\n  ')},\n];\n`)
}

out.push('/// Business names per trade licence type key.')
out.push('const businessNames = <String, List<String>>{')
for (const [k, v] of Object.entries(N.BUSINESS_NAMES)) {
  out.push(`  ${q(k)}: [${v.map(q).join(', ')}],`)
}
out.push('};\n')

out.push('/// The Latin name that goes on the signboard and the bank account.')
out.push('const businessNamesEn = <String, String>{')
for (const [k, v] of Object.entries(N.BUSINESS_NAMES_EN)) {
  out.push(`  ${q(k)}: ${q(v)},`)
}
out.push('};')

console.log(out.join('\n'))
