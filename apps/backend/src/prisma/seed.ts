import { PrismaService } from './prisma.service';
import { SvgTypesetterService } from '../render/svg-typesetter.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import { SeedService } from './seed.service';

async function bootstrapSeed() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const svgTypesetter = new SvgTypesetterService();
  const aiGateway = new AiGatewayService();
  const seeder = new SeedService(prisma, svgTypesetter, aiGateway);
  await seeder.ensureSeeded();
  await prisma.$disconnect();
}

bootstrapSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

