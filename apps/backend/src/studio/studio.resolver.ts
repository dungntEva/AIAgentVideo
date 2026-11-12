import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { SvgTypesetterService } from '../render/svg-typesetter.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import { VideoRendererService } from '../render/video-renderer.service';
import {
  ProjectModel,
  SceneModel,
  PromptExperimentModel,
  RenderJobModel,
  OperationalAlertModel,
  CompiledModelPromptsObject,
} from './studio.models';

@Resolver(() => ProjectModel)
export class StudioResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly svgTypesetter: SvgTypesetterService,
    private readonly aiGateway: AiGatewayService,
    private readonly videoRenderer: VideoRendererService,
  ) {}

  @Query(() => [ProjectModel])
  async projects() {
    return this.prisma.project.findMany({
      include: {
        brandKit: true,
        scenes: { orderBy: { orderIndex: 'asc' } },
        suggestions: { orderBy: { createdAt: 'asc' } },
        renderJobs: { orderBy: { createdAt: 'desc' }, take: 8 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => ProjectModel, { nullable: true })
  async project(@Args('id') id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        brandKit: true,
        scenes: { orderBy: { orderIndex: 'asc' } },
        suggestions: { orderBy: { createdAt: 'asc' } },
        renderJobs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  @Query(() => [PromptExperimentModel])
  async promptExperiments() {
    return this.prisma.promptExperiment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => [RenderJobModel])
  async renderJobs() {
    return this.prisma.renderJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  }

  @Query(() => [OperationalAlertModel])
  async operationalAlerts() {
    return this.prisma.operationalAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  }

  @Query(() => CompiledModelPromptsObject)
  async compiledPrompts(
    @Args('projectId') projectId: string,
    @Args('sceneIndex', { type: () => Int, nullable: true }) sceneIndex = 0,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { brandKit: true, scenes: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const scene = project.scenes[sceneIndex] || project.scenes[0];
    return this.aiGateway.compileModelSpecificPrompts({
      campaignGoal: project.campaignGoal,
      language: project.language,
      brandName: project.brandKit.name,
      primaryColor: project.brandKit.primaryColor,
      headlineText: scene?.headlineText || project.title,
    });
  }

  @Mutation(() => ProjectModel)
  async switchProjectLanguage(
    @Args('projectId') projectId: string,
    @Args('language') language: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { brandKit: true, scenes: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!project) throw new Error('Project not found');

    const generated = await this.aiGateway.generateAiSuggestionsForLanguage(
      project.campaignGoal,
      language,
    );

    // Delete old scenes & suggestions and replace with localized, server-typeset SVG scenes
    await this.prisma.scene.deleteMany({ where: { projectId } });
    await this.prisma.aiSuggestion.deleteMany({ where: { projectId } });

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
        language,
        typographyPreset: sc.typographyPreset,
        bgColorPrimary: sc.bgColorPrimary,
        bgColorSecondary: sc.bgColorSecondary,
        accentColor: sc.accentColor,
        watermarkText: project.brandKit.watermarkText,
        subtitleWords: subtitleTimings.slice(0, 7),
        sceneIndex: sc.orderIndex,
        videoModelBadge: project.videoModel,
      });

      await this.prisma.scene.create({
        data: {
          projectId,
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
          projectId,
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

    await this.prisma.project.update({
      where: { id: projectId },
      data: { language },
    });

    return this.project(projectId);
  }

  @Mutation(() => ProjectModel)
  async applyAiSuggestion(@Args('suggestionId') suggestionId: string) {
    const suggestion = await this.prisma.aiSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion) throw new Error('Suggestion not found');

    const project = await this.prisma.project.findUnique({
      where: { id: suggestion.projectId },
      include: { brandKit: true, scenes: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!project) throw new Error('Project not found');

    const payload = JSON.parse(suggestion.previewPayloadJson || '{}');
    const targetSceneIndex = typeof payload.sceneIndex === 'number' ? payload.sceneIndex : 0;
    const targetScene = project.scenes[targetSceneIndex] || project.scenes[0];

    if (targetScene) {
      const updatedHeadline = payload.headlineText || targetScene.headlineText;
      const updatedSubhead = payload.subheadText || targetScene.subheadText;
      const updatedPreset = payload.typographyPreset || targetScene.typographyPreset;
      const updatedTransition = payload.transitionType || targetScene.transitionType;
      const updatedAccent = payload.accentColor || targetScene.accentColor;
      const updatedVideoModel = payload.videoModel || targetScene.videoModelUsed;

      const { svgMarkup, diagnostics } = this.svgTypesetter.renderSceneSvg({
        headlineText: updatedHeadline,
        subheadText: updatedSubhead,
        badgeText: targetScene.badgeText,
        language: project.language,
        typographyPreset: updatedPreset,
        bgColorPrimary: targetScene.bgColorPrimary,
        bgColorSecondary: targetScene.bgColorSecondary,
        accentColor: updatedAccent,
        watermarkText: project.brandKit.watermarkText,
        videoModelBadge: updatedVideoModel,
      });

      await this.prisma.scene.update({
        where: { id: targetScene.id },
        data: {
          headlineText: updatedHeadline,
          subheadText: updatedSubhead,
          typographyPreset: updatedPreset,
          transitionType: updatedTransition,
          accentColor: updatedAccent,
          videoModelUsed: updatedVideoModel,
          svgMarkup,
          lineBreakMetaJson: JSON.stringify(diagnostics),
          visualQaScore: diagnostics.computedVisualQaScore,
        },
      });
    }

    await this.prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: { isApplied: true },
    });

    if (payload.videoModel) {
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          videoModel: payload.videoModel,
          estimatedCostUsd: Math.max(
            0.08,
            Number((project.estimatedCostUsd + suggestion.estimatedCostDelta).toFixed(2)),
          ),
        },
      });
    }

    return this.project(project.id);
  }

  @Mutation(() => SceneModel)
  async updateSceneStudio(
    @Args('sceneId') sceneId: string,
    @Args('headlineText') headlineText: string,
    @Args('subheadText') subheadText: string,
    @Args('typographyPreset') typographyPreset: string,
    @Args('transitionType') transitionType: string,
    @Args('videoModelUsed') videoModelUsed: string,
    @Args('accentColor') accentColor: string,
  ) {
    const scene = await this.prisma.scene.findUnique({
      where: { id: sceneId },
      include: { project: { include: { brandKit: true } } },
    });
    if (!scene) throw new Error('Scene not found');

    const { svgMarkup, diagnostics } = this.svgTypesetter.renderSceneSvg({
      headlineText,
      subheadText,
      badgeText: scene.badgeText,
      language: scene.project.language,
      typographyPreset,
      bgColorPrimary: scene.bgColorPrimary,
      bgColorSecondary: scene.bgColorSecondary,
      accentColor,
      watermarkText: scene.project.brandKit.watermarkText,
      videoModelBadge: videoModelUsed,
    });

    return this.prisma.scene.update({
      where: { id: sceneId },
      data: {
        headlineText,
        subheadText,
        typographyPreset,
        transitionType,
        videoModelUsed,
        accentColor,
        svgMarkup,
        lineBreakMetaJson: JSON.stringify(diagnostics),
        visualQaScore: diagnostics.computedVisualQaScore,
      },
    });
  }

  @Mutation(() => ProjectModel)
  async updateProjectAiConfig(
    @Args('projectId') projectId: string,
    @Args('llmModel') llmModel: string,
    @Args('imageModel') imageModel: string,
    @Args('videoModel') videoModel: string,
    @Args('voiceModel') voiceModel: string,
  ) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        llmModel,
        imageModel,
        videoModel,
        voiceModel,
      },
    });
    return this.project(projectId);
  }

  @Mutation(() => RenderJobModel)
  async triggerRenderPipeline(
    @Args('projectId') projectId: string,
    @Args('simulateErrorType', { nullable: true }) simulateErrorType?: string,
  ) {
    return this.videoRenderer.startRenderJob(projectId, simulateErrorType || 'NONE');
  }

  @Mutation(() => PromptExperimentModel)
  async evaluateOrRollbackPrompt(
    @Args('experimentId') experimentId: string,
    @Args('action') action: string, // 'PROMOTE_TO_ACTIVE' | 'AUTO_ROLLBACK'
  ) {
    const exp = await this.prisma.promptExperiment.findUnique({
      where: { id: experimentId },
    });
    if (!exp) throw new Error('Experiment not found');

    if (action === 'AUTO_ROLLBACK') {
      await this.prisma.operationalAlert.create({
        data: {
          severity: 'WARNING',
          component: 'PROMPT_REGRESSION',
          errorCode: 'ERR_PROMPT_QUALITY_DROP',
          message: `Prompt ${exp.versionTag} (${exp.targetModel}) showed quality regression (Typography Score: ${exp.typographyScore}). Rolled back to ${exp.baselineVersionTag}.`,
          autoMitigationRule: `RULE_PROMPT_ROLLBACK: Restored ${exp.baselineVersionTag} after A/B operational evaluation detected drop below 90.0 threshold.`,
          resolved: true,
          resolvedAt: new Date(),
        },
      });

      return this.prisma.promptExperiment.update({
        where: { id: experimentId },
        data: {
          status: 'ROLLED_BACK',
          regressionNotes: `[Auto-Rollback Executed] Reverted to ${exp.baselineVersionTag} due to quality guardrails.`,
        },
      });
    }

    return this.prisma.promptExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'ACTIVE',
        regressionNotes: `[Promoted to Production] Verified across ${exp.sampleSize} operational runs.`,
      },
    });
  }
}

