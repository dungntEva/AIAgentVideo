import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaService } from './prisma/prisma.service';
import { SvgTypesetterService } from './render/svg-typesetter.service';
import { AiGatewayService } from './ai/ai-gateway.service';
import { VideoRendererService } from './render/video-renderer.service';
import { StudioResolver } from './studio/studio.resolver';
import { SeedService } from './prisma/seed.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
  providers: [
    PrismaService,
    SvgTypesetterService,
    AiGatewayService,
    VideoRendererService,
    StudioResolver,
    SeedService,
  ],
})
export class AppModule {}

