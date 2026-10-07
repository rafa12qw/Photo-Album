"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = __importDefault(require("express"));
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use('/uploads', express_1.default.static((0, node_path_1.join)(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')));
    const configuredOrigins = [
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGINS,
        'http://localhost:5173',
        'http://localhost:5174',
    ]
        .filter(Boolean)
        .flatMap((value) => value.split(','))
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);
    app.enableCors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin || configuredOrigins.includes(requestOrigin.replace(/\/$/, ''))) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Authorization',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map