const __importDefault =
    (this && this.__importDefault) || (mod => (mod?.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
exports.renderSchema = renderSchema
exports.secureEndpointHandler = secureEndpointHandler
exports.logout = logout
const config_json_1 = __importDefault(require('../config.json'))
const utils_1 = require('./utils')
const generate_ts_schema_js_1 = require('./pb-ts/generate-ts-schema.js')
const generate_zod_schema_1 = require('./zod/generate-zod-schema')
function renderSchema(e, showLogOut) {
    const tsSchema = (0, generate_ts_schema_js_1.generateTsSchema)()
    const tsFilename = (0, utils_1.extractFilename)(config_json_1.default.tsSchema.outputPath)
    const zodSchema = (0, generate_zod_schema_1.generateZodSchema)()
    const zodFilename = (0, utils_1.extractFilename)(config_json_1.default.zodSchema.outputPath)
    const html = $template.loadFiles(`${__hooks}/views/index.html`).render({
        tsSchema,
        tsFilename,
        zodSchema,
        zodFilename,
        showLogOut,
    })
    return e.html(200, html)
}
function secureEndpointHandler(e) {
    let _a, _b
    const [email, password, ok] =
        (_b = (_a = e.request) === null || _a === void 0 ? void 0 : _a.basicAuth()) !== null &&
        _b !== void 0
            ? _b
            : ['', '', false]
    if (ok) {
        try {
            const authRecord = $app.findAuthRecordByEmail('_superusers', email)
            if (authRecord.validatePassword(password)) {
                return renderSchema(e, true)
            }
        } catch (_e) {}
    }
    e.response.header().set('WWW-Authenticate', 'Basic')
    return e.string(401, 'Unauthorized')
}
function logout(e) {
    return e.string(401, '')
}
