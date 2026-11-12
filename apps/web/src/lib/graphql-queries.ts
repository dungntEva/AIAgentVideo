import { gql } from '@apollo/client';

export const GET_STUDIO_DASHBOARD = gql`
  query GetStudioDashboard {
    projects {
      id
      title
      campaignGoal
      language
      aspectRatio
      status
      llmModel
      imageModel
      videoModel
      voiceModel
      bgmTrack
      bgmDuckingDb
      estimatedCostUsd
      aiCallsCount
      visualQaScore
      promptVersionTag
      renderedVideoUrl
      brandKit {
        id
        name
        primaryColor
        secondaryColor
        accentColor
        darkBgColor
        fontFamilyVi
        fontFamilyKo
        fontFamilyEn
        watermarkText
        safeZonePreset
      }
      scenes {
        id
        projectId
        orderIndex
        durationSec
        headlineText
        subheadText
        badgeText
        voiceoverScript
        subtitleTimingJson
        typographyPreset
        transitionType
        imagePrompt
        videoPrompt
        videoModelUsed
        bgColorPrimary
        bgColorSecondary
        accentColor
        svgMarkup
        lineBreakMetaJson
        visualQaScore
      }
      suggestions {
        id
        projectId
        sceneId
        category
        title
        rationale
        impactMetric
        confidenceScore
        estimatedCostDelta
        previewPayloadJson
        isApplied
      }
      renderJobs {
        id
        projectId
        status
        currentStage
        progressPercent
        primaryVideoModel
        activeVideoModel
        fallbackTriggered
        retryCount
        failureReason
        recoveryActionTaken
        logsJson
        outputUrl
        durationMs
        createdAt
      }
    }
    promptExperiments {
      id
      name
      targetModel
      versionTag
      baselineVersionTag
      syntaxStyle
      promptTemplate
      structuredSchemaJson
      sampleSize
      typographyScore
      brandConsistencyScore
      subtitleSyncScore
      avgLatencyMs
      avgCostUsd
      status
      regressionNotes
    }
    operationalAlerts {
      id
      severity
      component
      errorCode
      message
      autoMitigationRule
      resolved
      createdAt
    }
  }
`;

export const GET_COMPILED_PROMPTS = gql`
  query GetCompiledPrompts($projectId: String!, $sceneIndex: Int) {
    compiledPrompts(projectId: $projectId, sceneIndex: $sceneIndex) {
      claudeXmlPrompt
      gptJsonSchemaPrompt
      geminiSystemPrompt
      geminiImagePrompt
      klingMotionPrompt
      seedanceMotionPrompt
      hailuoMotionPrompt
      elevenlabsSsmlPrompt
      batchOptimizationNote
    }
  }
`;

export const SWITCH_PROJECT_LANGUAGE = gql`
  mutation SwitchProjectLanguage($projectId: String!, $language: String!) {
    switchProjectLanguage(projectId: $projectId, language: $language) {
      id
      language
    }
  }
`;

export const APPLY_AI_SUGGESTION = gql`
  mutation ApplyAiSuggestion($suggestionId: String!) {
    applyAiSuggestion(suggestionId: $suggestionId) {
      id
      estimatedCostUsd
      videoModel
    }
  }
`;

export const UPDATE_SCENE_STUDIO = gql`
  mutation UpdateSceneStudio(
    $sceneId: String!
    $headlineText: String!
    $subheadText: String!
    $typographyPreset: String!
    $transitionType: String!
    $videoModelUsed: String!
    $accentColor: String!
  ) {
    updateSceneStudio(
      sceneId: $sceneId
      headlineText: $headlineText
      subheadText: $subheadText
      typographyPreset: $typographyPreset
      transitionType: $transitionType
      videoModelUsed: $videoModelUsed
      accentColor: $accentColor
    ) {
      id
      headlineText
      subheadText
      typographyPreset
      transitionType
      videoModelUsed
      accentColor
      svgMarkup
      lineBreakMetaJson
      visualQaScore
    }
  }
`;

export const UPDATE_PROJECT_AI_CONFIG = gql`
  mutation UpdateProjectAiConfig(
    $projectId: String!
    $llmModel: String!
    $imageModel: String!
    $videoModel: String!
    $voiceModel: String!
  ) {
    updateProjectAiConfig(
      projectId: $projectId
      llmModel: $llmModel
      imageModel: $imageModel
      videoModel: $videoModel
      voiceModel: $voiceModel
    ) {
      id
      llmModel
      imageModel
      videoModel
      voiceModel
    }
  }
`;

export const TRIGGER_RENDER_PIPELINE = gql`
  mutation TriggerRenderPipeline($projectId: String!, $simulateErrorType: String) {
    triggerRenderPipeline(projectId: $projectId, simulateErrorType: $simulateErrorType) {
      id
      status
      currentStage
      progressPercent
      primaryVideoModel
      activeVideoModel
      fallbackTriggered
      retryCount
      failureReason
      recoveryActionTaken
      logsJson
      outputUrl
      durationMs
    }
  }
`;

export const EVALUATE_OR_ROLLBACK_PROMPT = gql`
  mutation EvaluateOrRollbackPrompt($experimentId: String!, $action: String!) {
    evaluateOrRollbackPrompt(experimentId: $experimentId, action: $action) {
      id
      status
      regressionNotes
    }
  }
`;

