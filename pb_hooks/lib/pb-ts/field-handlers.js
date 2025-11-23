const __importDefault =
    (this && this.__importDefault) || (mod => (mod?.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
exports.textFieldSchema = textFieldSchema
exports.passwordFieldSchema = passwordFieldSchema
exports.editorFieldSchema = editorFieldSchema
exports.numberFieldSchema = numberFieldSchema
exports.boolFieldSchema = boolFieldSchema
exports.emailFieldSchema = emailFieldSchema
exports.urlFieldSchema = urlFieldSchema
exports.dateFieldSchema = dateFieldSchema
exports.autodateFieldSchema = autodateFieldSchema
exports.selectFieldSchema = selectFieldSchema
exports.fileFieldSchema = fileFieldSchema
exports.relationFieldSchema = relationFieldSchema
exports.jsonFieldSchema = jsonFieldSchema
exports.geoPointSchema = geoPointSchema
const utils_1 = require('../utils')
const config_json_1 = __importDefault(require('../../config.json'))
function textFieldSchema(
    { name, hidden, min, max, pattern, autogeneratePattern, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', 'text'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]
    if (min > 0) rows.push(['min', `${min}`])
    if (max > 0) rows.push(['max', `${max}`])
    if (pattern) rows.push(['pattern', pattern])
    if (autogeneratePattern) rows.push(['autogeneratePattern', autogeneratePattern])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function passwordFieldSchema(
    { name, hidden, min, max, pattern, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', 'password'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]
    if (min > 0) rows.push(['min', `${min}`])
    if (max > 0) rows.push(['max', `${max}`])
    if (pattern) rows.push(['pattern', pattern])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function editorFieldSchema(
    { name, hidden, maxSize, convertURLs, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', 'editor'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['convertURLs', `${convertURLs}`],
    ]
    if (maxSize > 0) rows.push(['maxSize', `${maxSize}`])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function numberFieldSchema(
    { name, hidden, min, max, onlyInt, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: number`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', 'number'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['onlyInt', `${onlyInt}`],
    ]
    if (min !== null) rows.push(['min', `${min}`])
    if (max !== null) rows.push(['max', `${max}`])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function boolFieldSchema(
    { name, hidden, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: ${required ? 'true' : 'boolean'}`
    if (!includeDocs) return [typeDef, '']
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'bool'],
        ['hidden', `${hidden}`],
    ])
    return [typeDef, docs]
}
function emailFieldSchema(
    { name, hidden, exceptDomains, onlyDomains, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', 'email'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]
    if ((exceptDomains === null || exceptDomains === void 0 ? void 0 : exceptDomains.length) > 0)
        rows.push(['exceptDomains', exceptDomains.join('`, `')])
    if ((onlyDomains === null || onlyDomains === void 0 ? void 0 : onlyDomains.length) > 0)
        rows.push(['onlyDomains', onlyDomains.join('`, `')])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function urlFieldSchema(
    { name, hidden, exceptDomains, onlyDomains, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', 'email'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]
    if ((exceptDomains === null || exceptDomains === void 0 ? void 0 : exceptDomains.length) > 0)
        rows.push(['exceptDomains', exceptDomains.join('`, `')])
    if ((onlyDomains === null || onlyDomains === void 0 ? void 0 : onlyDomains.length) > 0)
        rows.push(['onlyDomains', onlyDomains.join('`, `')])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function dateFieldSchema(
    { name, hidden, min, max, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const minDateStr = min.toString()
    const maxDateStr = max.toString()
    const rows = [
        ['type', 'date'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]
    if (minDateStr) rows.push(['min', minDateStr])
    if (maxDateStr) rows.push(['max', maxDateStr])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function autodateFieldSchema(
    { name, hidden, onCreate, onUpdate },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: string`
    if (!includeDocs) return [typeDef, '']
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'autodate'],
        ['hidden', `${hidden}`],
        ['onCreate', `${onCreate}`],
        ['onUpdate', `${onUpdate}`],
    ])
    return [typeDef, docs]
}
function selectFieldSchema(
    { name, hidden, values, maxSelect, required, isMultiple },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const multiple = isMultiple()
    const options = values.map(v => `'${v}'`).join(' | ')
    const typeDef = `${name}: ${multiple ? (required ? `[${options}, ...(${options})[]]` : `(${options})[]`) : options}`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', `select${multiple ? ' (multiple)' : '(single)'}`],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]
    if (multiple && maxSelect > 0) rows.push(['maxSelect', `${maxSelect}`])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function fileFieldSchema(
    {
        name,
        hidden,
        maxSize,
        maxSelect,
        mimeTypes,
        thumbs,
        protected: $protected,
        required,
        isMultiple,
    },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const multiple = isMultiple()
    const typeDef = `${name}: ${multiple ? (required ? `[string, ...string[]]` : `string[]`) : 'string'}`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', `file${multiple ? ' (multiple)' : '(single)'}`],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['protected', `${$protected}`],
        ['maxSize', `${maxSize}`],
    ]
    if (multiple && maxSelect > 0) rows.push(['maxSelect', `${maxSelect}`])
    if ((mimeTypes === null || mimeTypes === void 0 ? void 0 : mimeTypes.length) > 0)
        rows.push(['mimeTypes', mimeTypes.join('`, `')])
    if ((thumbs === null || thumbs === void 0 ? void 0 : thumbs.length) > 0)
        rows.push(['thumbs', thumbs.join('`, `')])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function relationFieldSchema(
    {
        name,
        hidden,
        collectionId,
        collectionName,
        cascadeDelete,
        minSelect,
        maxSelect,
        required,
        isMultiple,
    },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const multiple = isMultiple()
    const typeDef = `${name}: ${multiple ? (required ? `[string, ...string[]]` : `string[]`) : 'string'}`
    if (!includeDocs) return [typeDef, '']
    const rows = [
        ['type', `relation${multiple ? ' (multiple)' : '(single)'}`],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['collectionId', `${collectionId}`],
        ['collectionName', `${collectionName}`],
        ['cascadeDelete', `${cascadeDelete}`],
    ]
    if (minSelect > 0) rows.push(['minSelect', `${minSelect}`])
    if (multiple && maxSelect > 0) rows.push(['maxSelect', `${maxSelect}`])
    const docs = (0, utils_1.generateMDTable)(rows)
    return [typeDef, docs]
}
function jsonFieldSchema(
    { name, hidden, maxSize, required, override },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: ${override !== null && override !== void 0 ? override : 'any'}`
    if (!includeDocs) return [typeDef, '']
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'json'],
        ['hidden', `${hidden}`],
        ['maxSize', `${maxSize}`],
        ['required', `${required}`],
    ])
    return [typeDef, docs]
}
function geoPointSchema(
    { name, hidden, required },
    includeDocs = config_json_1.default.tsSchema.includeDocs
) {
    const typeDef = `${name}: { lon: number; lat: number }`
    if (!includeDocs) return [typeDef, '']
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'geoPoint'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ])
    return [typeDef, docs]
}
