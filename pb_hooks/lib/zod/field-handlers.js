Object.defineProperty(exports, '__esModule', { value: true })
exports.textFieldSchema = textFieldSchema
exports.editorFieldSchema = editorFieldSchema
exports.numberFieldSchema = numberFieldSchema
exports.boolFieldSchema = boolFieldSchema
exports.emailFieldSchema = emailFieldSchema
exports.urlFieldSchema = urlFieldSchema
exports.dateFieldSchema = dateFieldSchema
exports.selectFieldSchema = selectFieldSchema
exports.fileFieldSchema = fileFieldSchema
exports.relationFieldSchema = relationFieldSchema
exports.jsonFieldSchema = jsonFieldSchema
exports.autodateFieldSchema = autodateFieldSchema
exports.passwordFieldSchema = passwordFieldSchema
exports.geoPointFieldSchema = geoPointFieldSchema
function textFieldSchema({ name, pattern, min, max, required }) {
    let schema = `${name}: z.string()`
    if (pattern) {
        schema += `.regex(/${pattern}/)`
    }
    if (min > 0 && min === max) {
        schema += `.length(${min})`
    } else {
        if (min > 0) {
            schema += `.min(${min})`
        } else if (required) {
            schema += '.min(1)'
        }
        if (max > 0) schema += `.max(${max})`
    }
    return schema
}
function editorFieldSchema({ name, required }) {
    return `${name}: z.string()${required ? '.min(1)' : ''}`
}
function numberFieldSchema({ name, onlyInt, min, max, required }) {
    let schema = `${name}: z.number()`
    if (onlyInt) schema += '.int()'
    if (min) schema += `.min(${min})`
    if (max) schema += `.max(${max})`
    if (required) schema += '.refine((n) => n !== 0)'
    return schema
}
function boolFieldSchema({ name, required }) {
    if (required) {
        return `${name}: z.literal(true)`
    }
    return `${name}: z.boolean()`
}
function emailFieldSchema({ name, exceptDomains, onlyDomains }) {
    let schema = `${name}: z.string().email()`
    if (onlyDomains.length > 0) {
        schema += `.refine((v) => [${onlyDomains.map(d => `"${d}"`).join(', ')}].includes(v.split('@')[1]))`
    } else if (exceptDomains.length > 0) {
        schema += `.refine((v) => ![${exceptDomains.map(d => `"${d}"`).join(', ')}].includes(v.split('@')[1]))`
    }
    return schema
}
function urlFieldSchema({ name, exceptDomains, onlyDomains }) {
    let schema = `${name}: z.string().url()`
    if (onlyDomains.length > 0) {
        schema += `.refine((v) => [${onlyDomains.map(d => `"${d}"`).join(', ')}].some((domain) => v.includes(domain)))`
    } else if (exceptDomains.length > 0) {
        schema += `.refine((v) => [${exceptDomains.map(d => `"${d}"`).join(', ')}].every((domain) => !v.includes(domain)))`
    }
    return schema
}
function dateFieldSchema({ name, min, max }) {
    const schema = `${name}: z.string().regex(DATETIME_REGEX)`
    const minDateStr = min.string()
    const maxDateStr = max.string()
    if (!minDateStr && !maxDateStr) return schema
    const conditions = []
    const funcLines = [`const date = new Date(v)`]
    if (minDateStr) {
        funcLines.push(`const minDate = new Date('${minDateStr}')`)
        conditions.push('date >= minDate')
    }
    if (maxDateStr) {
        funcLines.push(`const maxDate = new Date('${maxDateStr}')`)
        conditions.push('date <= maxDate')
    }
    return (
        schema +
        `.refine((v) => {
${funcLines.map(line => `        ${line}`).join('\n')}
        return ${conditions.join(' && ')}
    })`
    )
}
function selectFieldSchema({ name, values, maxSelect, required, isMultiple }) {
    let schema = `${name}: z.enum([${values.map(v => `"${v}"`).join(', ')}])`
    if (isMultiple()) {
        schema += '.array()'
        if (required) schema += '.nonempty()'
        if (maxSelect) schema += `.max(${maxSelect})`
    }
    return schema
}
function fileFieldSchema({ name, maxSelect, required, isMultiple }) {
    let schema = `${name}: z.string()`
    if (isMultiple()) {
        schema += '.array()'
        if (required) schema += '.nonempty()'
        if (maxSelect) schema += `.max(${maxSelect})`
    }
    return schema
}
function relationFieldSchema({ name, minSelect, maxSelect, required, isMultiple, targetIdSchema }) {
    let schema = `${name}: ${targetIdSchema}`
    if (isMultiple()) {
        schema += '.array()'
        if (required) schema += '.nonempty()'
        if (minSelect) schema += `.min(${minSelect})`
        if (maxSelect) schema += `.max(${maxSelect})`
    }
    return schema
}
function jsonFieldSchema({ name, override }) {
    return `${name}: ${override !== null && override !== void 0 ? override : 'z.unknown()'}`
}
function autodateFieldSchema({ name }) {
    return `${name}: z.string().regex(DATETIME_REGEX)`
}
function passwordFieldSchema(fieldOptions) {
    return textFieldSchema(fieldOptions)
}
function geoPointFieldSchema({ name, required }) {
    let schema = `${name}: z.object({ lon: z.number(), lat: z.number() })`
    if (required) {
        schema += '.refine(({ lon, lat }) => !(lon === 0 && lat === 0))'
    }
    return schema
}
