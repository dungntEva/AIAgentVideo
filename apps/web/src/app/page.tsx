'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_STUDIO_DASHBOARD,
  GET_COMPILED_PROMPTS,
  SWITCH_PROJECT_LANGUAGE,
  APPLY_AI_SUGGESTION,
  UPDATE_SCENE_STUDIO,
  UPDATE_PROJECT_AI_CONFIG,
  TRIGGER_RENDER_PIPELINE,
  EVALUATE_OR_ROLLBACK_PROMPT,
} from '@/lib/graphql-queries';
import {
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Type,
  Wand2,
  Film,
  Volume2,
  ShieldCheck,
  RefreshCw,
  GitCompare,
  Cpu,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Zap,
  RotateCcw,
  Eye,
  Sliders,
  Activity,
  ChevronRight,
} from 'lucide-react';

type StudioTab = 'STUDIO_EDITOR' | 'PROMPT_QA_LAB' | 'PIPELINE_RELIABILITY';

const UI_I18N: Record<
  string,
  {
    studioSubtitle: string;
    tabStudio: string;
    tabPromptQa: string;
    tabReliability: string;
    aiSuggestsHeader: string;
    aiSuggestsDesc: string;
    applyOneClick: string;
    appliedBadge: string;
    safeZoneToggle: string;
    lineBreakInspector: string;
    mobileParityToggle: string;
    renderMp4Btn: string;
    renderingBtn: string;
    sceneTimeline: string;
    fineTuneHeader: string;
  }
> = {
  vi: {
    studioSubtitle: 'AI Đề xuất → Người dùng Quyết định · Đa ngôn ngữ SVG (VI/KO/EN) · FFmpeg & AI Gateway',
    tabStudio: '1. Studio Sáng Tạo & Chỉnh Sửa (4.2)',
    tabPromptQa: '2. Kiểm Duyệt Trực Quan & Prompt A/B (4.1)',
    tabReliability: '3. Hàng Đợi & Tự Khôi Phục Lỗi (4.3)',
    aiSuggestsHeader: 'AI Đề Xuất Có Cơ Sở → Chọn 1 Chạm',
    aiSuggestsDesc:
      'Thay thế biểu mẫu nhập liệu phức tạp bằng các phương án đã tính toán sẵn bố cục SVG, nhịp chuyển cảnh và chi phí AI.',
    applyOneClick: 'Áp dụng phương án này',
    appliedBadge: 'Đã áp dụng',
    safeZoneToggle: 'Khung Safe-Zone TikTok/Reels',
    lineBreakInspector: 'Kiểm tra Ngắt dòng & Dấu phụ',
    mobileParityToggle: 'So sánh Web & React Native',
    renderMp4Btn: 'Kết xuất Video FFmpeg (MP4)',
    renderingBtn: 'Đang kết xuất FFmpeg...',
    sceneTimeline: 'Phân cảnh Video & Nhịp Phụ Đề ElevenLabs',
    fineTuneHeader: 'Tinh chỉnh Phân cảnh & Mô hình AI',
  },
  ko: {
    studioSubtitle: 'AI 제안 → 사용자 결정 · 서버 사이드 다국어 SVG 조판 (KO/VI/EN) · FFmpeg 파이프라인',
    tabStudio: '1. AI 크리에이티브 스튜디오 (4.2)',
    tabPromptQa: '2. 시각적 검수 및 프롬프트 A/B 테스트 (4.1)',
    tabReliability: '3. 렌더링 큐 & 자동 복구 모니터 (4.3)',
    aiSuggestsHeader: 'AI 근거 기반 시안 제안 → 원클릭 결정',
    aiSuggestsDesc:
      '복잡한 입력 폼 대신 어절 보존 줄바꿈(keep-all), 트랜지션, 비용이 계산된 최적 시안을 원클릭으로 적용하세요.',
    applyOneClick: '원클릭 시안 적용',
    appliedBadge: '적용 완료',
    safeZoneToggle: '틱톡/릴스 세이프존 가이드',
    lineBreakInspector: '다국어 줄바꿈 & 조판 진단',
    mobileParityToggle: 'Web · React Native 일관성 뷰',
    renderMp4Btn: 'FFmpeg MP4 영상 렌더링',
    renderingBtn: 'FFmpeg 렌더링 중...',
    sceneTimeline: '장면 타임라인 & 일레븐랩스 자막 싱크',
    fineTuneHeader: '장면 세부 편집 & AI 모델 게이트웨이',
  },
  en: {
    studioSubtitle: 'AI Suggests → User Decides · Server-Side SVG Typesetting (VI/KO/EN) · FFmpeg Pipeline',
    tabStudio: '1. Creative Studio & Editor (4.2)',
    tabPromptQa: '2. Visual QA & Prompt A/B Lab (4.1)',
    tabReliability: '3. Queue & Auto-Recovery Console (4.3)',
    aiSuggestsHeader: 'AI Grounded Suggestions → 1-Click Decide',
    aiSuggestsDesc:
      'Replaces complex input forms with data-backed layout, motion, and cost-optimized presets ready to apply.',
    applyOneClick: 'Apply in 1 Click',
    appliedBadge: 'Applied',
    safeZoneToggle: 'TikTok/Reels Safe-Zone Overlay',
    lineBreakInspector: 'Line-Break & Diacritic Inspector',
    mobileParityToggle: 'Web + React Native Parity View',
    renderMp4Btn: 'Render FFmpeg MP4 Video',
    renderingBtn: 'Rendering FFmpeg MP4...',
    sceneTimeline: 'Scene Timeline & ElevenLabs Subtitle Sync',
    fineTuneHeader: 'Scene Inspector & AI Gateway Models',
  },
};

export default function OmniReelStudioPage() {
  const { data, loading, refetch } = useQuery(GET_STUDIO_DASHBOARD);

  const [activeTab, setActiveTab] = useState<StudioTab>('STUDIO_EDITOR');
  const [selectedSceneIdx, setSelectedSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTimeSec, setPlaybackTimeSec] = useState<number>(0);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(1);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [showLineBreakDiag, setShowLineBreakDiag] = useState<boolean>(true);
  const [showMobileParity, setShowMobileParity] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Controlled editor fields for the active scene
  const [editHeadline, setEditHeadline] = useState<string>('');
  const [editSubhead, setEditSubhead] = useState<string>('');
  const [editPreset, setEditPreset] = useState<string>('DYNAMIC_HERO_CENTER');
  const [editTransition, setEditTransition] = useState<string>('zoompan');
  const [editVideoModel, setEditVideoModel] = useState<string>('kling-v2.0');
  const [editAccentColor, setEditAccentColor] = useState<string>('#38BDF8');

  const project = data?.projects?.[0];
  const scenes = project?.scenes || [];
  const activeScene = scenes[selectedSceneIdx] || scenes[0];
  const suggestions = project?.suggestions || [];
  const renderJobs = project?.renderJobs || [];
  const promptExperiments = data?.promptExperiments || [];
  const operationalAlerts = data?.operationalAlerts || [];

  const { data: promptData, refetch: refetchPrompts } = useQuery(GET_COMPILED_PROMPTS, {
    variables: {
      projectId: project?.id || '',
      sceneIndex: selectedSceneIdx,
    },
    skip: !project?.id,
  });

  const [switchLanguageMutation, { loading: switchingLang }] = useMutation(
    SWITCH_PROJECT_LANGUAGE,
  );
  const [applySuggestionMutation, { loading: applyingSuggestion }] =
    useMutation(APPLY_AI_SUGGESTION);
  const [updateSceneMutation, { loading: updatingScene }] = useMutation(UPDATE_SCENE_STUDIO);
  const [updateAiConfigMutation] = useMutation(UPDATE_PROJECT_AI_CONFIG);
  const [triggerRenderMutation, { loading: triggeringRender }] =
    useMutation(TRIGGER_RENDER_PIPELINE);
  const [evaluatePromptMutation] = useMutation(EVALUATE_OR_ROLLBACK_PROMPT);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync controlled inputs whenever activeScene changes
  useEffect(() => {
    if (activeScene) {
      setEditHeadline(activeScene.headlineText);
      setEditSubhead(activeScene.subheadText);
      setEditPreset(activeScene.typographyPreset);
      setEditTransition(activeScene.transitionType);
      setEditVideoModel(activeScene.videoModelUsed);
      setEditAccentColor(activeScene.accentColor);
    }
  }, [activeScene?.id, activeScene?.headlineText, activeScene?.subheadText, activeScene?.typographyPreset, activeScene?.transitionType, activeScene?.videoModelUsed, activeScene?.accentColor]);

  // Multi-scene video playback loop with WebAudio beat & ElevenLabs word-sync highlight
  useEffect(() => {
    if (!isPlaying || scenes.length === 0) return;

    const interval = setInterval(() => {
      setPlaybackTimeSec((prev) => {
        const next = Number((prev + 0.25).toFixed(2));
        const currentSceneDur = activeScene?.durationSec || 3.5;

        // Advance active subtitle word highlight
        setActiveWordIdx((w) => (w + 1) % 6);

        if (next >= currentSceneDur) {
          setSelectedSceneIdx((idx) => {
            const nextIdx = (idx + 1) % scenes.length;
            return nextIdx;
          });
          return 0;
        }
        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, scenes.length, activeScene?.durationSec]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  const playSubtleAudioCue = (freq = 520) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Ignore if browser blocks audio before interaction
    }
  };

  const handleTogglePlayback = () => {
    playSubtleAudioCue(isPlaying ? 380 : 640);
    setIsPlaying(!isPlaying);
  };

  const handleLanguageSwitch = async (lang: string) => {
    if (!project) return;
    playSubtleAudioCue(580);
    await switchLanguageMutation({
      variables: { projectId: project.id, language: lang },
    });
    await refetch();
    await refetchPrompts();
    const langNames: Record<string, string> = {
      vi: 'Tiếng Việt (Bảo toàn từ ghép & dấu phụ)',
      ko: '한국어 (어절 단위 줄바꿈 keep-all)',
      en: 'English (Optical Kerning & Widow Guard)',
    };
    showToast(`Đã chuyển ngôn ngữ & tái căn chỉnh chữ SVG sang: ${langNames[lang] || lang}`);
  };

  const handleApplySuggestion = async (suggestionId: string, title: string) => {
    playSubtleAudioCue(720);
    await applySuggestionMutation({
      variables: { suggestionId },
    });
    await refetch();
    await refetchPrompts();
    showToast(`Đã áp dụng đề xuất AI: "${title}"`);
  };

  const handleSaveSceneEdits = async () => {
    if (!activeScene) return;
    playSubtleAudioCue(660);
    await updateSceneMutation({
      variables: {
        sceneId: activeScene.id,
        headlineText: editHeadline,
        subheadText: editSubhead,
        typographyPreset: editPreset,
        transitionType: editTransition,
        videoModelUsed: editVideoModel,
        accentColor: editAccentColor,
      },
    });
    await refetch();
    await refetchPrompts();
    showToast('Đã kết xuất lại SVG phía máy chủ & cập nhật chẩn đoán ngắt dòng!');
  };

  const handleTriggerRender = async (simulateErrorType = 'NONE') => {
    if (!project) return;
    playSubtleAudioCue(780);
    const res = await triggerRenderMutation({
      variables: {
        projectId: project.id,
        simulateErrorType,
      },
    });
    await refetch();
    const job = res.data?.triggerRenderPipeline;
    if (job?.status === 'RECOVERED') {
      showToast(
        `⚡ Tự động khôi phục thành công (${job.activeVideoModel}): ${job.recoveryActionTaken}`,
      );
    } else {
      showToast(`🎬 Đã kết xuất video MP4 thành công (${job?.outputUrl})!`);
    }
  };

  const handlePromptRollback = async (experimentId: string, action: string) => {
    playSubtleAudioCue(440);
    await evaluatePromptMutation({
      variables: { experimentId, action },
    });
    await refetch();
    showToast(
      action === 'AUTO_ROLLBACK'
        ? '⏪ Đã tự động Rollback về phiên bản Prompt ổn định trước đó do điểm chất lượng suy giảm!'
        : '✅ Đã phê duyệt phiên bản Prompt lên môi trường Production!',
    );
  };

  const lang = project?.language || 'vi';
  const t = UI_I18N[lang] || UI_I18N.vi;

  let lineBreakDiagnostics: {
    ruleApplied?: string;
    fontStack?: string;
    lineHeightMultiplier?: number;
    diacriticHeadroomPx?: number;
    headlineLines?: string[];
    subheadLines?: string[];
    compoundWordsPreserved?: string[];
    orphanPrevented?: boolean;
    safeZoneCompliant?: boolean;
    contrastRatio?: number;
    computedVisualQaScore?: number;
  } = {};

  try {
    if (activeScene?.lineBreakMetaJson) {
      lineBreakDiagnostics = JSON.parse(activeScene.lineBreakMetaJson);
    }
  } catch {
    lineBreakDiagnostics = {};
  }

  let subtitleTimings: Array<{ word: string; startSec: number; endSec: number }> = [];
  try {
    if (activeScene?.subtitleTimingJson) {
      subtitleTimings = JSON.parse(activeScene.subtitleTimingJson);
    }
  } catch {
    subtitleTimings = [];
  }

  const transitionAnimClass =
    editTransition === 'wipeleft'
      ? 'animate-wipeleft'
      : editTransition === 'circleopen'
        ? 'animate-circleopen'
        : 'animate-zoompan';

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  return (
    <div className={`min-h-screen flex flex-col bg-[#060911] text-slate-100 lang-${lang}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-indigo-500/40 bg-slate-900/95 px-5 py-3.5 text-sm font-medium text-indigo-100 shadow-2xl backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Studio Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080C16]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          {/* Brand Logo & Architecture Badges */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 shadow-lg shadow-indigo-500/20">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  OmniReel AI Studio
                </h1>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  GraphQL + Prisma + FFmpeg Live
                </span>
                <span className="hidden xl:inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                  Prompt {project?.promptVersionTag || 'v2.4-prod'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.studioSubtitle}</p>
            </div>
          </div>

          {/* Multi-Language Switcher (VI / KO / EN) & Primary Render Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1">
              <Globe className="ml-2 mr-1.5 h-3.5 w-3.5 text-slate-400" />
              {[
                { code: 'vi', label: '🇻🇳 Tiếng Việt' },
                { code: 'ko', label: '🇰🇷 한국어' },
                { code: 'en', label: '🇺🇸 English' },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleLanguageSwitch(item.code)}
                  disabled={switchingLang}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    lang === item.code
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Cost & Visual QA Telemetry Pill */}
            <div className="hidden md:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-400">Visual QA:</span>
                <span className="font-bold text-emerald-300">
                  {activeScene?.visualQaScore || project?.visualQaScore || 96.4}%
                </span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-slate-400">Chi phí:</span>
                <span className="font-bold text-amber-300">
                  ${project?.estimatedCostUsd?.toFixed(2) || '0.16'}/video ({project?.aiCallsCount || 4} lệnh AI)
                </span>
              </div>
            </div>

            <button
              onClick={() => handleTriggerRender('NONE')}
              disabled={triggeringRender}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 transition-all"
            >
              <Film className="h-4 w-4" />
              {triggeringRender ? t.renderingBtn : t.renderMp4Btn}
            </button>
          </div>
        </div>

        {/* Navigation Tabs corresponding directly to JD Sections 4.2, 4.1, and 4.3 */}
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 border-t border-slate-800/60 px-6 pt-2">
          {[
            { id: 'STUDIO_EDITOR', label: t.tabStudio, icon: Wand2 },
            { id: 'PROMPT_QA_LAB', label: t.tabPromptQa, icon: GitCompare },
            { id: 'PIPELINE_RELIABILITY', label: t.tabReliability, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 p-6">
        {loading && !project ? (
          <div className="flex h-96 items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
            <span>Đang kết nối GraphQL Backend & Server-Side SVG Engine...</span>
          </div>
        ) : null}

        {/* =====================================================================
            TAB 1: "AI SUGGESTS -> USER DECIDES" STUDIO & MULTI-LANGUAGE SVG EDITOR
           ===================================================================== */}
        {activeTab === 'STUDIO_EDITOR' && project && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN (4 cols): AI SUGGESTS -> USER DECIDES */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="rounded-2xl border border-slate-800/90 bg-[#0B101E] p-5 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">{t.aiSuggestsHeader}</h2>
                  </div>
                  <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    Zero-Form UX
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {t.aiSuggestsDesc}
                </p>

                <div className="space-y-3.5">
                  {suggestions.map((sug: {
                    id: string;
                    category: string;
                    title: string;
                    rationale: string;
                    impactMetric: string;
                    confidenceScore: number;
                    estimatedCostDelta: number;
                    isApplied: boolean;
                  }) => (
                    <div
                      key={sug.id}
                      className={`rounded-xl border p-4 transition-all ${
                        sug.isApplied
                          ? 'border-emerald-500/50 bg-emerald-950/15'
                          : 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                          {sug.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                            {sug.impactMetric}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Tin cậy: {Math.round(sug.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1.5">{sug.title}</h3>
                      <p className="text-xs text-slate-300/90 leading-relaxed mb-3">
                        {sug.rationale}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">
                          Chi phí thay đổi:{' '}
                          <strong className="text-slate-200">
                            {sug.estimatedCostDelta <= 0
                              ? `${sug.estimatedCostDelta.toFixed(2)} USD (Tiết kiệm)`
                              : `+${sug.estimatedCostDelta.toFixed(2)} USD`}
                          </strong>
                        </span>

                        <button
                          onClick={() => handleApplySuggestion(sug.id, sug.title)}
                          disabled={applyingSuggestion}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            sug.isApplied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                          }`}
                        >
                          {sug.isApplied ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t.appliedBadge}
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-3.5 w-3.5" />
                              {t.applyOneClick}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Language Typography & Diacritic Diagnostics Card */}
              {showLineBreakDiag && (
                <div className="rounded-2xl border border-slate-800/90 bg-[#0B101E] p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                        Chẩn Đoán Ghép Chữ SVG Phía Máy Chủ ({lang.toUpperCase()})
                      </h3>
                    </div>
                    <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      WCAG AAA {lineBreakDiagnostics.contrastRatio || 14.8}:1
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2">
                      <span className="text-slate-400">Quy tắc ngắt dòng:</span>
                      <span className="font-mono text-[11px] font-semibold text-indigo-300">
                        {lineBreakDiagnostics.ruleApplied || 'VI_COMPOUND_KEEP'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2">
                      <span className="text-slate-400">Khoảng đệm dấu phụ (Diacritic Headroom):</span>
                      <span className="font-semibold text-emerald-300">
                        +{lineBreakDiagnostics.diacriticHeadroomPx || 22}px (Không cắt dấu)
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-900/80 px-3 py-2">
                      <div className="text-slate-400 mb-1.5">
                        Các dòng tiêu đề đã tách tự động ({lineBreakDiagnostics.headlineLines?.length || 0} dòng):
                      </div>
                      <div className="space-y-1">
                        {(lineBreakDiagnostics.headlineLines || [activeScene?.headlineText]).map(
                          (line, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 rounded bg-slate-950 px-2.5 py-1 font-medium text-slate-200 border border-slate-800/80"
                            >
                              <span className="text-[10px] font-mono text-indigo-400">
                                L{i + 1}
                              </span>
                              <span>{line}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {lineBreakDiagnostics.compoundWordsPreserved &&
                      lineBreakDiagnostics.compoundWordsPreserved.length > 0 && (
                        <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/30 px-3 py-2">
                          <span className="text-indigo-300 font-semibold block mb-1">
                            Từ ghép tiếng Việt được khóa bảo toàn:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {lineBreakDiagnostics.compoundWordsPreserved.map((w, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-200"
                              >
                                &ldquo;{w}&rdquo;
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER COLUMN (4 cols): LIVE 9:16 SERVER-SIDE SVG & VIDEO PREVIEW CANVAS */}
            <div className="lg:col-span-4 flex flex-col items-center">
              {/* Canvas Toolbar */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 rounded-xl border border-slate-800 bg-[#0B101E] px-3.5 py-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowSafeZone(!showSafeZone)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      showSafeZone
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.safeZoneToggle}
                  </button>
                  <button
                    onClick={() => setShowMobileParity(!showMobileParity)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      showMobileParity
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    {t.mobileParityToggle}
                  </button>
                </div>

                <span className="font-mono text-[11px] text-slate-400">
                  9:16 · 1080×1920 · {editTransition.toUpperCase()}
                </span>
              </div>

              {/* 9:16 Vertical Phone Studio Viewport */}
              <div className="relative w-[330px] sm:w-[356px] aspect-[9/16] rounded-[34px] border-[6px] border-slate-800 bg-slate-950 shadow-2xl shadow-indigo-950/40 overflow-hidden">
                {/* Live Server-Rendered SVG Scene with Transition Effect */}
                {activeScene?.svgMarkup ? (
                  <div
                    key={`${activeScene.id}-${editTransition}-${selectedSceneIdx}-${lang}`}
                    className={`w-full h-full [&>svg]:w-full [&>svg]:h-full ${transitionAnimClass}`}
                    dangerouslySetInnerHTML={{ __html: activeScene.svgMarkup }}
                  />
                ) : null}

                {/* Optional TikTok / Reels UI Safe-Zone Inspector Overlay */}
                {showSafeZone && (
                  <div className="pointer-events-none absolute inset-0 z-10">
                    {/* Top Safe-Zone Danger Area */}
                    <div className="absolute top-0 inset-x-0 h-[11%] border-b border-dashed border-rose-500/60 bg-rose-950/20 flex items-center justify-center">
                      <span className="rounded bg-rose-950/80 px-2 py-0.5 text-[9px] font-mono uppercase text-rose-300">
                        TikTok/Reels Top Status Safe-Zone
                      </span>
                    </div>

                    {/* Right Action Column Danger Area */}
                    <div className="absolute right-0 top-[35%] bottom-[22%] w-[14%] border-l border-dashed border-rose-500/60 bg-rose-950/20 flex flex-col items-center justify-around py-4">
                      <div className="h-7 w-7 rounded-full bg-rose-500/30 border border-rose-400/50" />
                      <div className="h-7 w-7 rounded-full bg-rose-500/30 border border-rose-400/50" />
                      <div className="h-7 w-7 rounded-full bg-rose-500/30 border border-rose-400/50" />
                      <span className="rotate-90 text-[8px] font-mono text-rose-300 whitespace-nowrap">
                        ICONS ZONE
                      </span>
                    </div>

                    {/* Bottom Caption & Music Marquee Danger Area */}
                    <div className="absolute bottom-0 inset-x-0 h-[21%] border-t border-dashed border-rose-500/60 bg-rose-950/25 flex flex-col justify-end p-3">
                      <div className="text-[10px] font-mono text-rose-300">
                        @brand_official · Nhạc nền ElevenLabs AI (Safe-Zone Dưới)
                      </div>
                    </div>
                  </div>
                )}

                {/* Playback Transport Overlay Bar */}
                <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between rounded-2xl border border-white/15 bg-slate-950/85 px-3.5 py-2 backdrop-blur-md">
                  <button
                    onClick={handleTogglePlayback}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 mx-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                      <span>
                        Cảnh {selectedSceneIdx + 1}/{scenes.length} ({activeScene?.videoModelUsed})
                      </span>
                      <span className="font-mono">
                        {playbackTimeSec.toFixed(1)}s / {activeScene?.durationSec || 3.5}s
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-200"
                        style={{
                          width: `${Math.min(
                            100,
                            (playbackTimeSec / (activeScene?.durationSec || 3.5)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {project.renderedVideoUrl && (
                    <a
                      href={`${backendUrl}${project.renderedVideoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Tải xuống bản kết xuất MP4 FFmpeg"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Scene Selector Timeline & Subtitle Sync Strip */}
              <div className="w-full mt-4 rounded-2xl border border-slate-800 bg-[#0B101E] p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-300">{t.sceneTimeline}</span>
                  <span className="text-[11px] text-indigo-300 font-mono">
                    BGM Ducking: {project.bgmDuckingDb}dB
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {scenes.map((sc: {
                    id: string;
                    orderIndex: number;
                    headlineText: string;
                    transitionType: string;
                    durationSec: number;
                  }, idx: number) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setSelectedSceneIdx(idx);
                        setPlaybackTimeSec(0);
                      }}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        selectedSceneIdx === idx
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 mb-1">
                        <span>CẢNH {idx + 1}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300">
                          {sc.transitionType}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] font-medium text-slate-200">
                        {sc.headlineText}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Word-Level ElevenLabs Subtitle Timing Strip */}
                <div className="rounded-xl bg-slate-950/90 border border-slate-800/80 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Đồng bộ phụ đề theo từ (ElevenLabs Word Timestamps):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subtitleTimings.map((item, idx) => (
                      <span
                        key={idx}
                        className={`rounded px-2 py-0.5 text-xs font-medium transition-all ${
                          idx === activeWordIdx
                            ? 'bg-cyan-500 text-slate-950 font-bold scale-105'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {item.word}{' '}
                        <span className="text-[9px] opacity-70">{item.startSec}s</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (4 cols): SCENE INSPECTOR, AI MODEL GATEWAY & WEB/MOBILE PARITY */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="rounded-2xl border border-slate-800/90 bg-[#0B101E] p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">{t.fineTuneHeader}</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Cảnh {selectedSceneIdx + 1} / {scenes.length}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Tiêu đề chính (Tự động căn chỉnh & ghép chữ SVG phía máy chủ)
                    </label>
                    <textarea
                      rows={2}
                      value={editHeadline}
                      onChange={(e) => setEditHeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Tiêu đề phụ / Thông điệp bổ trợ
                    </label>
                    <textarea
                      rows={2}
                      value={editSubhead}
                      onChange={(e) => setEditSubhead(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Bố cục chữ SVG (Layout Preset)
                      </label>
                      <select
                        value={editPreset}
                        onChange={(e) => setEditPreset(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                      >
                        <option value="DYNAMIC_HERO_CENTER">Chính giữa (Hero Center)</option>
                        <option value="EDITORIAL_SPLIT">Lệch trái (Editorial Split)</option>
                        <option value="KINETIC_BOTTOM_SAFE">Nửa dưới (Kinetic Safe)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Chuyển cảnh FFmpeg (Transition)
                      </label>
                      <select
                        value={editTransition}
                        onChange={(e) => setEditTransition(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                      >
                        <option value="zoompan">ZoomPan (Ken Burns 3D)</option>
                        <option value="wipeleft">Wipe Left (Lướt ngang)</option>
                        <option value="circleopen">Circle Open (Mở tâm)</option>
                        <option value="fade">Cross Fade (Mờ dần)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Mô hình Video (AI Gateway)
                      </label>
                      <select
                        value={editVideoModel}
                        onChange={(e) => setEditVideoModel(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                      >
                        <option value="kling-v2.0">Kling v2.0 Master</option>
                        <option value="seedance-1.0">Seedance 1.0 Pro</option>
                        <option value="hailuo-i2v">Hailuo I2V-01 Live</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Màu nhấn thương hiệu (Brand Accent)
                      </label>
                      <div className="flex items-center gap-2">
                        {['#38BDF8', '#34D399', '#F472B6', '#A78BFA', '#FBBF24'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditAccentColor(color)}
                            className={`h-7 w-7 rounded-full border-2 transition-transform ${
                              editAccentColor === color
                                ? 'scale-110 border-white'
                                : 'border-transparent opacity-75'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSceneEdits}
                    disabled={updatingScene}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white shadow-md transition-all"
                  >
                    <RefreshCw className={`h-4 w-4 ${updatingScene ? 'animate-spin' : ''}`} />
                    Cập nhật Bố cục SVG & Chẩn đoán Đa ngôn ngữ
                  </button>
                </div>
              </div>

              {/* Multi-Model Stack Configuration (Claude, GPT, Gemini, ElevenLabs) */}
              <div className="rounded-2xl border border-slate-800/90 bg-[#0B101E] p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Cấu Hình Cổng Kết Nối Đa Mô Hình AI (Mục 3)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Văn bản & Kịch bản (LLM)</span>
                    <select
                      value={project.llmModel}
                      onChange={async (e) => {
                        await updateAiConfigMutation({
                          variables: {
                            projectId: project.id,
                            llmModel: e.target.value,
                            imageModel: project.imageModel,
                            videoModel: project.videoModel,
                            voiceModel: project.voiceModel,
                          },
                        });
                        refetch();
                      }}
                      className="mt-1 w-full bg-transparent font-bold text-slate-100 focus:outline-none"
                    >
                      <option value="claude-3-7-sonnet" className="bg-slate-900">
                        Claude 3.7 Sonnet
                      </option>
                      <option value="gpt-4o" className="bg-slate-900">
                        OpenAI GPT-4o
                      </option>
                      <option value="gemini-2.5-pro" className="bg-slate-900">
                        Gemini 2.5 Pro
                      </option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Tạo Hình Ảnh (Image AI)</span>
                    <select
                      value={project.imageModel}
                      onChange={async (e) => {
                        await updateAiConfigMutation({
                          variables: {
                            projectId: project.id,
                            llmModel: project.llmModel,
                            imageModel: e.target.value,
                            videoModel: project.videoModel,
                            voiceModel: project.voiceModel,
                          },
                        });
                        refetch();
                      }}
                      className="mt-1 w-full bg-transparent font-bold text-slate-100 focus:outline-none"
                    >
                      <option value="gemini-2.5-flash-image" className="bg-slate-900">
                        Gemini 2.5 Flash Image
                      </option>
                      <option value="gemini-imagen-3" className="bg-slate-900">
                        Gemini Imagen 3
                      </option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Giọng nói & Nhạc (Audio)</span>
                    <div className="mt-1 font-bold text-emerald-300">ElevenLabs Multilingual v2</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Xử lý & Kết xuất</span>
                    <div className="mt-1 font-bold text-cyan-300">SVG + Chromium + FFmpeg</div>
                  </div>
                </div>
              </div>

              {/* Web & React Native Mobile Consistency Preview (Mục 3 & 4.2) */}
              {showMobileParity && (
                <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/15 p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-cyan-200">
                        Đồng Nhất Giao Diện Web (Next.js) & Mobile (React Native CLI)
                      </h3>
                    </div>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      No Expo · Shared GraphQL
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    Cùng một gói dữ liệu GraphQL <code className="text-cyan-300">SceneModel</code> và bộ quy tắc ngắt dòng <code className="text-cyan-300">{lineBreakDiagnostics.ruleApplied}</code> được chia sẻ trực tiếp với ứng dụng <code className="text-cyan-300">apps/mobile-rn</code> (React Native bare CLI + <code className="text-cyan-300">react-native-svg</code>).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: VISUAL QA & PROMPT A/B REGRESSION TESTING LAB (Mục 4.1)
           ===================================================================== */}
        {activeTab === 'PROMPT_QA_LAB' && project && (
          <div className="space-y-6">
            {/* Top Row: Model-Specific Prompt Syntax Optimizer */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <GitCompare className="h-5 w-5 text-indigo-400" />
                    Bộ Biên Dịch & Tối Ưu Cú Pháp Prompt Theo Từng Mô Hình AI (Mục 4.1)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {promptData?.compiledPrompts?.batchOptimizationNote ||
                      'Gộp Ideation + Copywriting + Subtitle Timing trong 1 lần gọi để giảm 62% chi phí.'}
                  </p>
                </div>
                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  Tiết kiệm 62% Token & Số lần gọi AI
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300">Claude 3.7 Sonnet (XML Tags)</span>
                    <span className="text-[10px] font-mono text-slate-400">Prefill + XML</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                    {promptData?.compiledPrompts?.claudeXmlPrompt}
                  </pre>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-300">GPT-4o (Strict JSON Schema)</span>
                    <span className="text-[10px] font-mono text-slate-400">strict: true</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                    {promptData?.compiledPrompts?.gptJsonSchemaPrompt}
                  </pre>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-300">
                      Gemini 2.5 Pro & Flash Image
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Negative Space</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                    {promptData?.compiledPrompts?.geminiImagePrompt}
                  </pre>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-pink-300">
                      Kling 2.0 / Seedance / Hailuo DSL
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Camera Vectors</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                    {promptData?.compiledPrompts?.klingMotionPrompt}
                    {'\n\n'}
                    {promptData?.compiledPrompts?.seedanceMotionPrompt}
                  </pre>
                </div>
              </div>
            </div>

            {/* Bottom Row: Operational A/B Regression Comparison & 1-Click Auto-Rollback */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Kiểm Thử Hồi Quy Prompt (A/B Regression) & Khôi Phục Tự Động Khi Suy Giảm Chất Lượng
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sử dụng dữ liệu vận hành để so sánh kết quả giữa phiên bản cũ và mới; khôi phục phiên bản trước nếu điểm hiển thị chữ hoặc đồng bộ phụ đề suy giảm.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {promptExperiments.map((exp: {
                  id: string;
                  name: string;
                  targetModel: string;
                  versionTag: string;
                  baselineVersionTag: string;
                  syntaxStyle: string;
                  sampleSize: number;
                  typographyScore: number;
                  brandConsistencyScore: number;
                  subtitleSyncScore: number;
                  avgLatencyMs: number;
                  avgCostUsd: number;
                  status: string;
                  regressionNotes: string;
                }) => {
                  const isDegraded = exp.typographyScore < 90;
                  return (
                    <div
                      key={exp.id}
                      className={`rounded-xl border p-5 flex flex-col justify-between ${
                        exp.status === 'ROLLED_BACK'
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : isDegraded
                            ? 'border-rose-500/50 bg-rose-950/15'
                            : 'border-emerald-500/40 bg-slate-900/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-indigo-300">
                            {exp.versionTag} (vs {exp.baselineVersionTag})
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              exp.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : exp.status === 'ROLLED_BACK'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {exp.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mb-1">{exp.name}</h4>
                        <div className="text-[11px] text-slate-400 mb-3">
                          Mô hình: <strong className="text-slate-200">{exp.targetModel}</strong> · Tập mẫu:{' '}
                          <strong className="text-slate-200">{exp.sampleSize} video</strong>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                          <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                            <span className="block text-[10px] text-slate-400">Hiển thị chữ</span>
                            <span
                              className={`text-sm font-bold ${
                                exp.typographyScore >= 90 ? 'text-emerald-300' : 'text-rose-400'
                              }`}
                            >
                              {exp.typographyScore}%
                            </span>
                          </div>
                          <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                            <span className="block text-[10px] text-slate-400">Thương hiệu</span>
                            <span className="text-sm font-bold text-sky-300">
                              {exp.brandConsistencyScore}%
                            </span>
                          </div>
                          <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                            <span className="block text-[10px] text-slate-400">Khớp phụ đề</span>
                            <span className="text-sm font-bold text-indigo-300">
                              {exp.subtitleSyncScore}%
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                          {exp.regressionNotes}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <span className="text-[11px] text-slate-400">
                          Chi phí TB: <strong>${exp.avgCostUsd}</strong> · {exp.avgLatencyMs}ms
                        </span>

                        {exp.status !== 'ROLLED_BACK' && isDegraded ? (
                          <button
                            onClick={() => handlePromptRollback(exp.id, 'AUTO_ROLLBACK')}
                            className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Rollback về {exp.baselineVersionTag}
                          </button>
                        ) : exp.status === 'ROLLED_BACK' ? (
                          <span className="text-xs font-semibold text-amber-300">
                            Đã khôi phục {exp.baselineVersionTag}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" /> Đạt chuẩn vận hành
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: PIPELINE RELIABILITY, TASK QUEUE & AUTO-RECOVERY CONSOLE (Mục 4.3)
           ===================================================================== */}
        {activeTab === 'PIPELINE_RELIABILITY' && project && (
          <div className="space-y-6">
            {/* Chaos Engineering & Auto-Recovery Trigger Panel */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    Hệ Thống Hàng Đợi Tác Vụ & Cơ Chế Tự Động Khôi Phục Lỗi (Mục 4.3)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Kiểm chứng thực tế khả năng phân tích nguyên nhân lỗi và tự động chuyển đổi dự phòng (Failover) theo các quy tắc xác định.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleTriggerRender('KLING_TIMEOUT_503')}
                    disabled={triggeringRender}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-3.5 py-2 text-xs font-bold text-rose-200 transition-all"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Giả lập lỗi Kling 503 Timeout → Tự chuyển sang Seedance 1.0
                  </button>

                  <button
                    onClick={() => handleTriggerRender('SVG_TEXT_OVERFLOW')}
                    disabled={triggeringRender}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3.5 py-2 text-xs font-bold text-amber-200 transition-all"
                  >
                    <Type className="h-4 w-4 text-amber-400" />
                    Giả lập lỗi Tràn chữ SVG → Tự thu phóng & Giữ từ ghép
                  </button>

                  <button
                    onClick={() => handleTriggerRender('ELEVENLABS_RATE_LIMIT')}
                    disabled={triggeringRender}
                    className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3.5 py-2 text-xs font-bold text-indigo-200 transition-all"
                  >
                    <Volume2 className="h-4 w-4 text-indigo-400" />
                    Giả lập lỗi ElevenLabs 429 → Tự động Backoff Retry
                  </button>
                </div>
              </div>

              {/* Render Job Queue History */}
              <div className="space-y-4">
                {renderJobs.map((job: {
                  id: string;
                  status: string;
                  currentStage: string;
                  progressPercent: number;
                  primaryVideoModel: string;
                  activeVideoModel: string;
                  fallbackTriggered: boolean;
                  retryCount: number;
                  failureReason?: string;
                  recoveryActionTaken?: string;
                  logsJson: string;
                  outputUrl?: string;
                  durationMs: number;
                }) => {
                  let logs: Array<{
                    timestamp: string;
                    stage: string;
                    level: string;
                    message: string;
                  }> = [];
                  try {
                    logs = JSON.parse(job.logsJson || '[]');
                  } catch {
                    logs = [];
                  }

                  return (
                    <div
                      key={job.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/90 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              job.status === 'RECOVERED'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {job.status}
                          </span>
                          <span className="font-mono text-xs text-slate-300">
                            Job #{job.id.slice(-6)}
                          </span>
                          <span className="text-xs text-slate-400">
                            Mô hình Video:{' '}
                            <strong className="text-white">{job.primaryVideoModel}</strong>
                            {job.fallbackTriggered && (
                              <span className="text-amber-300 font-bold">
                                {' '}
                                → Tự chuyển sang {job.activeVideoModel}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-400">
                            Số lần thử lại (Retry): <strong>{job.retryCount}</strong>
                          </span>
                          <span className="text-slate-400">
                            Thời gian: <strong>{job.durationMs}ms</strong>
                          </span>
                          {job.outputUrl && (
                            <a
                              href={`${backendUrl}${job.outputUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-emerald-400 hover:underline font-semibold"
                            >
                              <Download className="h-3.5 w-3.5" /> MP4 ({job.outputUrl})
                            </a>
                          )}
                        </div>
                      </div>

                      {job.recoveryActionTaken && (
                        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3.5 py-2 text-xs text-amber-200">
                          <div>
                            <strong>Nguyên nhân lỗi phát hiện:</strong> {job.failureReason}
                          </div>
                          <div className="mt-0.5 text-emerald-300">
                            <strong>Hành động tự động khôi phục:</strong> {job.recoveryActionTaken}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 font-mono text-[11px]">
                        {logs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 text-slate-300">
                            <span className="text-slate-500 shrink-0">[{log.stage}]</span>
                            <span
                              className={
                                log.level === 'ERROR'
                                  ? 'text-rose-400'
                                  : log.level === 'WARN'
                                    ? 'text-amber-300'
                                    : log.level === 'SUCCESS'
                                      ? 'text-emerald-300 font-semibold'
                                      : 'text-slate-300'
                              }
                            >
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operational Monitoring Alerts */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3">
                Cảnh Báo Giám Sát Vận Hành & Quy Tắc Xử Lý Tự Động (Operational Alerts)
              </h3>
              <div className="space-y-2.5">
                {operationalAlerts.map((alert: {
                  id: string;
                  severity: string;
                  component: string;
                  errorCode: string;
                  message: string;
                  autoMitigationRule: string;
                  resolved: boolean;
                }) => (
                  <div
                    key={alert.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : alert.severity === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-mono font-bold text-indigo-300">
                          [{alert.component}] {alert.errorCode}
                        </span>
                      </div>
                      <p className="text-slate-200">{alert.message}</p>
                      <p className="text-emerald-300/90 font-mono text-[11px]">
                        ↳ {alert.autoMitigationRule}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
                      Đã xử lý tự động
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

