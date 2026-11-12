import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class BrandKitModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  primaryColor: string;

  @Field()
  secondaryColor: string;

  @Field()
  accentColor: string;

  @Field()
  darkBgColor: string;

  @Field()
  fontFamilyVi: string;

  @Field()
  fontFamilyKo: string;

  @Field()
  fontFamilyEn: string;

  @Field()
  watermarkText: string;

  @Field()
  safeZonePreset: string;
}

@ObjectType()
export class SceneModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field(() => Int)
  orderIndex: number;

  @Field(() => Float)
  durationSec: number;

  @Field()
  headlineText: string;

  @Field()
  subheadText: string;

  @Field()
  badgeText: string;

  @Field()
  voiceoverScript: string;

  @Field()
  subtitleTimingJson: string;

  @Field()
  typographyPreset: string;

  @Field()
  transitionType: string;

  @Field()
  imagePrompt: string;

  @Field()
  videoPrompt: string;

  @Field()
  videoModelUsed: string;

  @Field()
  bgColorPrimary: string;

  @Field()
  bgColorSecondary: string;

  @Field()
  accentColor: string;

  @Field()
  svgMarkup: string;

  @Field()
  lineBreakMetaJson: string;

  @Field(() => Float)
  visualQaScore: number;
}

@ObjectType()
export class AiSuggestionModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field({ nullable: true })
  sceneId?: string;

  @Field()
  category: string;

  @Field()
  title: string;

  @Field()
  rationale: string;

  @Field()
  impactMetric: string;

  @Field(() => Float)
  confidenceScore: number;

  @Field(() => Float)
  estimatedCostDelta: number;

  @Field()
  previewPayloadJson: string;

  @Field()
  isApplied: boolean;
}

@ObjectType()
export class RenderJobModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  status: string;

  @Field()
  currentStage: string;

  @Field(() => Int)
  progressPercent: number;

  @Field()
  primaryVideoModel: string;

  @Field()
  activeVideoModel: string;

  @Field()
  fallbackTriggered: boolean;

  @Field(() => Int)
  retryCount: number;

  @Field({ nullable: true })
  failureReason?: string;

  @Field({ nullable: true })
  recoveryActionTaken?: string;

  @Field()
  logsJson: string;

  @Field({ nullable: true })
  outputUrl?: string;

  @Field(() => Int)
  durationMs: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ProjectModel {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  campaignGoal: string;

  @Field()
  language: string;

  @Field()
  aspectRatio: string;

  @Field()
  status: string;

  @Field()
  llmModel: string;

  @Field()
  imageModel: string;

  @Field()
  videoModel: string;

  @Field()
  voiceModel: string;

  @Field()
  bgmTrack: string;

  @Field(() => Float)
  bgmDuckingDb: number;

  @Field(() => Float)
  estimatedCostUsd: number;

  @Field(() => Int)
  aiCallsCount: number;

  @Field(() => Float)
  visualQaScore: number;

  @Field()
  promptVersionTag: string;

  @Field({ nullable: true })
  renderedVideoUrl?: string;

  @Field(() => BrandKitModel)
  brandKit: BrandKitModel;

  @Field(() => [SceneModel])
  scenes: SceneModel[];

  @Field(() => [AiSuggestionModel])
  suggestions: AiSuggestionModel[];

  @Field(() => [RenderJobModel])
  renderJobs: RenderJobModel[];
}

@ObjectType()
export class PromptExperimentModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  targetModel: string;

  @Field()
  versionTag: string;

  @Field()
  baselineVersionTag: string;

  @Field()
  syntaxStyle: string;

  @Field()
  promptTemplate: string;

  @Field()
  structuredSchemaJson: string;

  @Field(() => Int)
  sampleSize: number;

  @Field(() => Float)
  typographyScore: number;

  @Field(() => Float)
  brandConsistencyScore: number;

  @Field(() => Float)
  subtitleSyncScore: number;

  @Field(() => Int)
  avgLatencyMs: number;

  @Field(() => Float)
  avgCostUsd: number;

  @Field()
  status: string;

  @Field()
  regressionNotes: string;
}

@ObjectType()
export class OperationalAlertModel {
  @Field()
  id: string;

  @Field()
  severity: string;

  @Field()
  component: string;

  @Field()
  errorCode: string;

  @Field()
  message: string;

  @Field()
  autoMitigationRule: string;

  @Field()
  resolved: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class CompiledModelPromptsObject {
  @Field()
  claudeXmlPrompt: string;

  @Field()
  gptJsonSchemaPrompt: string;

  @Field()
  geminiSystemPrompt: string;

  @Field()
  geminiImagePrompt: string;

  @Field()
  klingMotionPrompt: string;

  @Field()
  seedanceMotionPrompt: string;

  @Field()
  hailuoMotionPrompt: string;

  @Field()
  elevenlabsSsmlPrompt: string;

  @Field()
  batchOptimizationNote: string;
}

