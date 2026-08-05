import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Employee Registration API')
    .setDescription('API para gerenciamento de colaboradores e documentos.')
    .setVersion('1.0')
    .addTag('employee')
    .addTag('document-type')
    .addTag('employee-required-document')
    .addTag('employee-document-version')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
