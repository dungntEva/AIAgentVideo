import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SvgTypesetterService } from '../render/svg-typesetter.service';
import { AiGatewayService } from '../ai/ai-gateway.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly svgTypesetter: SvgTypesetterService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  public async ensureSeeded() {
    const existingCount = await this.prisma.project.count();
    if (existingCount > 0) {
      return;
    }

    this.logger.log('Seeding initial OmniReel AI Video Studio data (VI / KO / EN)...');

    const brandKit = await this.prisma.brandKit.create({
      data: {
        name: 'OmniReel Commerce & Tech Brand',
        primaryColor: '#6366F1',
        secondaryColor: '#EC4899',
        accentColor: '#38BDF8',
        darkBgColor: '#090D16',
        fontFamilyVi: 'Be Vietnam Pro, Plus Jakarta Sans, sans-serif',
        fontFamilyKo: 'Pretendard, Noto Sans KR, sans-serif',
        fontFamilyEn: 'Space Grotesk, Inter, sans-serif',
        watermarkText: 'OMNIREEL AI STUDIO',
        safeZonePreset: 'TIKTOK_REELS_9_16',
      },
    });

    const project = await this.prisma.project.create({
      data: {
        title: 'Chiến dịch Video Ngắn Thương Hiệu AI Đa Ngôn Ngữ (VI · KO · EN)',
        campaignGoal:
          'Ra mắt giải pháp AI Video Studio: Tự động căn chỉnh chữ SVG phía máy chủ, chuyển cảnh FFmpeg mượt mà, giọng đọc ElevenLabs và cổng kết nối Kling/Seedance/Hailuo.',
        language: 'vi',
        aspectRatio: '9:16',
        status: 'READY',
        llmModel: 'claude-3-7-sonnet',
        imageModel: 'gemini-2.5-flash-image',
        videoModel: 'kling-v2.0',
        voiceModel: 'elevenlabs-multilingual-v2',
        bgmTrack: 'cyberpunk-synth-upbeat',
        bgmDuckingDb: -14.0,
        estimatedCostUsd: 0.16,
        aiCallsCount: 4,
        visualQaScore: 96.4,
        promptVersionTag: 'v2.4-prod',
        brandKitId: brandKit.id,
      },
    });

    const generated = await this.aiGateway.generateAiSuggestionsForLanguage(
      project.campaignGoal,
      'vi',
    );

    for (const sc of generated.scenes) {
      const words = sc.voiceoverScript.split(/\s+/);
      const step = Number((sc.durationSec / Math.max(1, words.length)).toFixed(2));
      const subtitleTimings = words.map((w, idx) => ({
        word: w,
        startSec: Number((idx * step).toFixed(2)),
        endSec: Number(((idx + 1) * step).toFixed(2)),
        active: idx === 1 || idx === 2,
      }));

      const { svgMarkup, diagnostics } = this.svgTypesetter.renderSceneSvg({
        headlineText: sc.headlineText,
        subheadText: sc.subheadText,
        badgeText: sc.badgeText,
        language: 'vi',
        typographyPreset: sc.typographyPreset,
        bgColorPrimary: sc.bgColorPrimary,
        bgColorSecondary: sc.bgColorSecondary,
        accentColor: sc.accentColor,
        watermarkText: brandKit.watermarkText,
        subtitleWords: subtitleTimings.slice(0, 7),
        sceneIndex: sc.orderIndex,
        videoModelBadge: project.videoModel,
      });

      await this.prisma.scene.create({
        data: {
          projectId: project.id,
          orderIndex: sc.orderIndex,
          durationSec: sc.durationSec,
          headlineText: sc.headlineText,
          subheadText: sc.subheadText,
          badgeText: sc.badgeText,
          voiceoverScript: sc.voiceoverScript,
          subtitleTimingJson: JSON.stringify(subtitleTimings),
          typographyPreset: sc.typographyPreset,
          transitionType: sc.transitionType,
          imagePrompt: sc.imagePrompt,
          videoPrompt: sc.videoPrompt,
          videoModelUsed: project.videoModel,
          bgColorPrimary: sc.bgColorPrimary,
          bgColorSecondary: sc.bgColorSecondary,
          accentColor: sc.accentColor,
          svgMarkup,
          lineBreakMetaJson: JSON.stringify(diagnostics),
          visualQaScore: diagnostics.computedVisualQaScore,
        },
      });
    }

    for (const sug of generated.suggestions) {
      await this.prisma.aiSuggestion.create({
        data: {
          projectId: project.id,
          category: sug.category,
          title: sug.title,
          rationale: sug.rationale,
          impactMetric: sug.impactMetric,
          confidenceScore: sug.confidenceScore,
          estimatedCostDelta: sug.estimatedCostDelta,
          previewPayloadJson: sug.previewPayloadJson,
          isApplied: false,
        },
      });
    }

    // Seed Prompt A/B Regression Experiments (Requirement 4.1)
    await this.prisma.promptExperiment.createMany({
      data: [
        {
          name: 'Single-Pass Storyboard & Multi-Lang Line-Break Compiler',
          targetModel: 'claude-3-7-sonnet',
          versionTag: 'v2.4-prod',
          baselineVersionTag: 'v2.3-stable',
          syntaxStyle: 'CLAUDE_XML',
          promptTemplate: `<system_role>Elite Short-Form Video Architect</system_role>\n<language_rules vi="keep-compound-words,diacritic-headroom-22px" ko="eojeol-keep-all" en="prevent-widows" />\n<batch_strategy>Single LLM call outputs 3 grounded AI suggestions + 3 scene scripts + word timestamps</batch_strategy>`,
          structuredSchemaJson: JSON.stringify({
            type: 'object',
            required: ['concepts', 'scenes', 'subtitleTimings'],
          }),
          sampleSize: 120,
          typographyScore: 97.2,
          brandConsistencyScore: 95.8,
          subtitleSyncScore: 96.5,
          avgLatencyMs: 1420,
          avgCostUsd: 0.032,
          status: 'ACTIVE',
          regressionNotes:
            'Giảm 62% số lần gọi LLM nhờ gộp Ideation + Copywriting + Subtitle Timing trong 1 XML schema duy nhất. Điểm hiển thị tiếng Việt & tiếng Hàn tăng +6.4%.',
        },
        {
          name: 'Experimental Zero-Shot Unconstrained Freeform Copywriter',
          targetModel: 'gpt-4o',
          versionTag: 'v2.5-canary',
          baselineVersionTag: 'v2.4-prod',
          syntaxStyle: 'GPT_JSON_SCHEMA',
          promptTemplate: `Generate catchy short video headlines in Vietnamese, Korean, and English without strict character per line constraints.`,
          structuredSchemaJson: JSON.stringify({
            type: 'object',
            required: ['scenes'],
          }),
          sampleSize: 50,
          typographyScore: 81.4,
          brandConsistencyScore: 88.0,
          subtitleSyncScore: 84.2,
          avgLatencyMs: 1680,
          avgCostUsd: 0.058,
          status: 'CANDIDATE',
          regressionNotes:
            'Cảnh báo suy giảm chất lượng: 18% tiêu đề tiếng Việt bị ngắt rời từ ghép ("trí tuệ / nhân tạo") và tràn vào vùng nút bấm TikTok. Khuyến nghị Rollback về v2.4-prod.',
        },
        {
          name: 'Gemini 2.5 Flash Image Negative-Space Keyframe Prompt',
          targetModel: 'gemini-2.5-flash-image',
          versionTag: 'img-v1.9-prod',
          baselineVersionTag: 'img-v1.8',
          syntaxStyle: 'GEMINI_GROUNDED',
          promptTemplate: `[Imagen 3 / Gemini Flash Image] Vertical 9:16 keyframe. Enforce low-frequency dark obsidian luminance (L* < 18) in central typography zone Y=[340..1180] for >=14:1 SVG text contrast.`,
          structuredSchemaJson: JSON.stringify({
            aspectRatio: '9:16',
            negativeSpaceZone: 'CENTER_UPPER_40_PERCENT',
          }),
          sampleSize: 85,
          typographyScore: 98.1,
          brandConsistencyScore: 96.4,
          subtitleSyncScore: 95.0,
          avgLatencyMs: 1890,
          avgCostUsd: 0.04,
          status: 'ACTIVE',
          regressionNotes:
            'Đạt chuẩn tương phản WCAG AAA (14.8:1) trên 99% khung hình mà không cần làm tối toàn bộ ảnh nền.',
        },
      ],
    });

    // Seed an initial Completed RenderJob & OperationalAlert history
    await this.prisma.renderJob.create({
      data: {
        projectId: project.id,
        status: 'COMPLETED',
        currentStage: 'VISUAL_QA',
        progressPercent: 100,
        primaryVideoModel: 'kling-v2.0',
        activeVideoModel: 'kling-v2.0',
        fallbackTriggered: false,
        retryCount: 0,
        durationMs: 2840,
        outputUrl: '/renders/omnireel-demo-initial.mp4',
        logsJson: JSON.stringify([
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            stage: 'IDEATION',
            level: 'INFO',
            message: '[claude-3-7-sonnet] Generated 3 grounded concepts & 3 scenes in 1 batched call.',
          },
          {
            timestamp: new Date(Date.now() - 55000).toISOString(),
            stage: 'SVG_TYPESETTING',
            level: 'INFO',
            message: '[SVG Engine] Typeset Vietnamese copy — preserved compound words & 22px diacritic headroom.',
          },
          {
            timestamp: new Date(Date.now() - 48000).toISOString(),
            stage: 'VIDEO_GATEWAY',
            level: 'INFO',
            message: '[kling-v2.0] Synthesized 9:16 motion clips via AI Video Gateway.',
          },
          {
            timestamp: new Date(Date.now() - 42000).toISOString(),
            stage: 'FFMPEG_MUX',
            level: 'INFO',
            message: '[FFmpeg] Muxed H.264 video + ElevenLabs voiceover + BGM (-14dB ducking).',
          },
        ]),
      },
    });

    await this.prisma.operationalAlert.create({
      data: {
        severity: 'INFO',
        component: 'AI_VIDEO_GATEWAY',
        errorCode: 'GATEWAY_HEALTH_OK',
        message:
          'Cổng kết nối Video AI (Kling 2.0 / Seedance 1.0 / Hailuo I2V) và hàng đợi FFmpeg đang hoạt động ổn định (SLA 99.8%).',
        autoMitigationRule:
          'RULE_AUTO_FAILOVER: Tự động chuyển đổi Kling -> Seedance -> Hailuo nếu độ trễ vượt quá 4500ms.',
        resolved: true,
        resolvedAt: new Date(),
      },
    });

    this.logger.log('Initial OmniReel AI Video Studio database seeded successfully.');
  }
}

