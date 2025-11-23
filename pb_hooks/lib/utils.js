Object.defineProperty(exports, '__esModule', { value: true })
exports.toPascalCase = toPascalCase
exports.toCamelCase = toCamelCase
exports.haveSameValues = haveSameValues
exports.format = format
exports.generateMDTable = generateMDTable
exports.extractFilename = extractFilename
exports.writeToFile = writeToFile
function toPascalCase(collectionName) {
    return collectionName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}
function toCamelCase(collectionName) {
    const pascalCase = toPascalCase(collectionName)
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1)
}
function haveSameValues(set1, set2) {
    if (set1.size !== set2.size) return false
    for (const value of set1) {
        if (!set2.has(value)) return false
    }
    return true
}
function format(input) {
    if (!input.includes('\n')) return input
    const lines = input.split('\n')
    let indent = 0
    let output = ''
    for (const line of lines) {
        if (line.endsWith('}') && !line.includes('{')) {
            indent -= 1
        }
        output += `${'    '.repeat(indent) + line}\n`
        if (line.endsWith('{')) {
            indent += 1
        }
    }
    return output
}
function generateMDTable(rows) {
    if (rows.length === 0) return ''
    rows = rows.map(([key, value]) => [key, `\`${value}\``])
    const leftColWidth = Math.max(...rows.map(([key]) => key.length))
    const rightColWidth = Math.max(...rows.map(([_, value]) => value.length))
    const table = [
        ` * | ${' '.repeat(leftColWidth)} | ${' '.repeat(rightColWidth)} |`,
        ` * | ${'-'.repeat(leftColWidth)} | ${'-'.repeat(rightColWidth)} |`,
        ...rows.map(
            ([key, value]) =>
                ` * | ${key.padEnd(leftColWidth, ' ')} | ${value.padEnd(rightColWidth, ' ')} |`
        ),
    ]
    return `/**\n${table.join('\n')}\n */`
}
function extractFilename(path) {
    return path.replace(/^.*[\\/]/, '')
}
function writeToFile(path, data) {
    $os.writeFile(path, data, 0o644)
}
