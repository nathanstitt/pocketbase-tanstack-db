const __importDefault =
    (this && this.__importDefault) || (mod => (mod?.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
exports.generateZodSchema = void 0
const utils_1 = require('../utils')
const field_handlers_1 = require('./field-handlers')
const config_json_1 = __importDefault(require('../../config.json'))
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const generateZodSchema = (
    includeSystemCollections = config_json_1.default.zodSchema.includeSystemCollections
) => {
    let _a
    const collections = $app.findAllCollections().filter(c => {
        return includeSystemCollections || !c.system
    })
    const collectionIdToIdSchemaMap = new Map(
        collections.map(collection => {
            const idField = collection.fields.find(field => field.name === 'id')
            return [
                collection.id,
                (0, field_handlers_1.textFieldSchema)(idField).replace('id: ', ''),
            ]
        })
    )
    const shouldAddDateRegex = collections.some(({ fields }) => {
        return fields.some(field => field.type() === 'date' || field.type() === 'autodate')
    })
    const overrides = config_json_1.default.zodSchema.overrides
    let schema = ''
    for (const collection of collections) {
        schema += `export const ${(0, utils_1.toCamelCase)(collection.name)}Schema = z.object({\n`
        for (const fieldOptions of collection.fields) {
            const fieldType = fieldOptions.type()
            const optional = !fieldOptions.required || fieldOptions.autogeneratePattern
            schema += `    `
            switch (fieldType) {
                case 'text':
                    schema += (0, field_handlers_1.textFieldSchema)(fieldOptions)
                    break
                case 'password':
                    schema += (0, field_handlers_1.passwordFieldSchema)(fieldOptions)
                    break
                case 'editor':
                    schema += (0, field_handlers_1.editorFieldSchema)(fieldOptions)
                    break
                case 'number':
                    schema += (0, field_handlers_1.numberFieldSchema)(fieldOptions)
                    break
                case 'bool':
                    schema += (0, field_handlers_1.boolFieldSchema)(fieldOptions)
                    break
                case 'email':
                    schema += (0, field_handlers_1.emailFieldSchema)(fieldOptions)
                    break
                case 'url':
                    schema += (0, field_handlers_1.urlFieldSchema)(fieldOptions)
                    break
                case 'date':
                    schema += (0, field_handlers_1.dateFieldSchema)(fieldOptions)
                    break
                case 'autodate':
                    schema += (0, field_handlers_1.autodateFieldSchema)(fieldOptions)
                    break
                case 'select':
                    schema += (0, field_handlers_1.selectFieldSchema)(fieldOptions)
                    break
                case 'file':
                    schema += (0, field_handlers_1.fileFieldSchema)(fieldOptions)
                    break
                case 'relation':
                    schema += (0, field_handlers_1.relationFieldSchema)(
                        Object.assign(Object.assign({}, fieldOptions), {
                            targetIdSchema: collectionIdToIdSchemaMap.get(
                                fieldOptions.collectionId
                            ),
                        })
                    )
                    break
                case 'json':
                    schema += (0, field_handlers_1.jsonFieldSchema)(
                        Object.assign(Object.assign({}, fieldOptions), {
                            override:
                                (_a =
                                    overrides === null || overrides === void 0
                                        ? void 0
                                        : overrides[collection.name]) === null || _a === void 0
                                    ? void 0
                                    : _a[fieldOptions.name],
                        })
                    )
                    break
                case 'geoPoint':
                    schema += (0, field_handlers_1.geoPointFieldSchema)(fieldOptions)
                    break
                default:
                    fieldType
            }
            schema += `${optional ? '.optional()' : ''},\n`
        }
        schema += '})\n\n'
    }
    const imports = ["import { z } from 'zod'"]
    if (overrides === null || overrides === void 0 ? void 0 : overrides.importStatements) {
        imports.push(...overrides.importStatements)
    }
    let result = `${imports.join('\n')}\n\n`
    if (shouldAddDateRegex) {
        result += `const DATETIME_REGEX = ${DATETIME_REGEX}\n\n`
    }
    return result + schema
}
exports.generateZodSchema = generateZodSchema
