import { PrismaService } from './prisma/prisma.service';
import { SvgTypesetterService } from './render/svg-typesetter.service';
import { AiGatewayService } from './ai/ai-gateway.service';
import { VideoRendererService } from './render/video-renderer.service';
import { SeedService } from './prisma/seed.service';
import * as fs from 'fs';
import * as path from 'path';

async function runVerification() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const svgTypesetter = new SvgTypesetterService();
  const aiGateway = new AiGatewayService();
  const videoRenderer = new VideoRendererService(prisma, svgTypesetter);
  const seeder = new SeedService(prisma, svgTypesetter, aiGateway);

  await seeder.ensureSeeded();

  const project = await prisma.project.findFirst({
    include: { scenes: true, suggestions: true },
  });

  if (!project) {
    throw new Error('No seeded project found');
  }

  console.log('=== 1. VERIFYING MULTI-LANGUAGE SERVER-SIDE SVG TYPESETTING (VI / KO / EN) ===');
  for (const lang of ['vi', 'ko', 'en']) {
    const sampleCopy =
      lang === 'vi'
        ? 'Ứng dụng trí tuệ nhân tạo nâng tầm thương hiệu thông qua chuyển đổi số'
        : lang === 'ko'
          ? '복잡한 입력 없이 완성하는 AI 숏폼 비디오 스튜디오'
          : 'AI Proposes Grounded Concepts And You Decide In A Single Click';

    const res = svgTypesetter.renderSceneSvg({
      headlineText: sampleCopy,
      subheadText: 'Server-side SVG line breaking & safe-zone verification',
      language: lang,
      typographyPreset: 'DYNAMIC_HERO_CENTER',
      bgColorPrimary: '#0F172A',
      bgColorSecondary: '#1E1B4B',
      accentColor: '#38BDF8',
    });

    console.log(
      `[${lang.toUpperCase()}] Rule: ${res.diagnostics.ruleApplied} | Lines: ${JSON.stringify(
        res.diagnostics.headlineLines,
      )} | Compounds Preserved: ${JSON.stringify(
        res.diagnostics.compoundWordsPreserved,
      )} | SafeZone OK: ${res.diagnostics.safeZoneCompliant}`,
    );
  }

  console.log('\n=== 2. VERIFYING REAL FFMPEG MP4 RENDER & AUTO-RECOVERY PIPELINE ===');
  const normalJob = await videoRenderer.startRenderJob(project.id, 'NONE');
  console.log(
    `[Normal Render] Status: ${normalJob?.status} | Output: ${normalJob?.outputUrl} | Duration: ${normalJob?.durationMs}ms`,
  );

  // Copy initial MP4 to omnireel-demo-initial.mp4 as well so initial seed link also resolves to a real MP4
  if (normalJob?.outputUrl) {
    const generatedFile = path.join(process.cwd(), 'public', normalJob.outputUrl);
    const demoInitialFile = path.join(
      process.cwd(),
      'public',
      'renders',
      'omnireel-demo-initial.mp4',
    );
    if (fs.existsSync(generatedFile)) {
      fs.copyFileSync(generatedFile, demoInitialFile);
      const stat = fs.statSync(generatedFile);
      console.log(`[MP4 File Verified on Disk] ${generatedFile} (${stat.size} bytes)`);
    }
  }

  const failoverJob = await videoRenderer.startRenderJob(project.id, 'KLING_TIMEOUT_503');
  console.log(
    `[Failover Recovery Render] Status: ${failoverJob?.status} | Primary: ${failoverJob?.primaryVideoModel} -> Active: ${failoverJob?.activeVideoModel} | Recovery: ${failoverJob?.recoveryActionTaken}`,
  );

  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

