const __importDefault =
    (this && this.__importDefault) || (mod => (mod?.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
exports.default = default_1
const config_json_1 = __importDefault(require('./config.json'))
const utils_1 = require('./lib/utils')
const generate_ts_schema_1 = require('./lib/pb-ts/generate-ts-schema')
const generate_zod_schema_1 = require('./lib/zod/generate-zod-schema')
function default_1() {
    if (config_json_1.default.tsSchema.generateFile) {
        const tsSchema = (0, generate_ts_schema_1.generateTsSchema)()
        ;(0, utils_1.writeToFile)(config_json_1.default.tsSchema.outputPath, tsSchema)
    }
    if (config_json_1.default.zodSchema.generateFile) {
        const zodSchema = (0, generate_zod_schema_1.generateZodSchema)()
        ;(0, utils_1.writeToFile)(config_json_1.default.zodSchema.outputPath, zodSchema)
    }
}
