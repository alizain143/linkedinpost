import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  json,
  urlencoded,
  type Express,
  type Request,
  type Response,
} from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { globalValidationPipe } from './common/pipes/validation.pipe';
import { frontendUrlOrigins } from './config/frontend-url';
import { buildOauthProtectedResourceMetadata } from './config/oauth-discovery';

type RawBodyRequest = Request & { rawBody?: Buffer };

function captureRawBody(req: RawBodyRequest, _res: Response, buf: Buffer) {
  if (buf?.length) {
    req.rawBody = buf;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  // Nest only sets req.rawBody when using its built-in parser. We disable that
  // and use Express json/urlencoded, so capture the buffer here for webhook HMAC.
  app.use(json({ limit: '2mb', verify: captureRawBody }));
  app.use(urlencoded({ extended: true, limit: '2mb', verify: captureRawBody }));

  // RFC 9728: scanners look up PRM on the resource host (API), not the marketing site.
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.get('/.well-known/oauth-protected-resource', (_req, res) => {
    res
      .type('application/json')
      .set('Cache-Control', 'public, max-age=3600')
      .status(200)
      .send(buildOauthProtectedResourceMetadata());
  });

  app.setGlobalPrefix('v1');

  const frontendUrls = frontendUrlOrigins();
  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? frontendUrls
      : Array.from(
          new Set([
            ...frontendUrls,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
          ]),
        );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });

  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('linkedinpost API')
    .setDescription('linkedinpost.ai backend API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
