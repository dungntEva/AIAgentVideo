import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_MOBILE_STUDIO = gql`
  query GetMobileStudio {
    projects {
      id
      title
      language
      videoModel
      estimatedCostUsd
      scenes {
        id
        orderIndex
        headlineText
        subheadText
        transitionType
        svgMarkup
        visualQaScore
      }
      suggestions {
        id
        category
        title
        rationale
        impactMetric
        isApplied
      }
    }
  }
`;

const APPLY_SUGGESTION_MOBILE = gql`
  mutation ApplyAiSuggestion($suggestionId: String!) {
    applyAiSuggestion(suggestionId: $suggestionId) {
      id
      estimatedCostUsd
    }
  }
`;

/**
 * Bare React Native CLI (No Expo) Studio Screen
 * Ensures 100% visual & typography parity between Next.js Web Studio and Mobile via Server-Side SVG (`SvgXml`).
 */
export function MobileStudioScreen() {
  const { data, refetch } = useQuery(GET_MOBILE_STUDIO);
  const [applySuggestion] = useMutation(APPLY_SUGGESTION_MOBILE);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);

  const project = data?.projects?.[0];
  const scenes = project?.scenes || [];
  const activeScene = scenes[selectedSceneIdx] || scenes[0];
  const suggestions = project?.suggestions || [];

  const handleApply = async (suggestionId: string) => {
    await applySuggestion({ variables: { suggestionId } });
    await refetch();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OmniReel Mobile Studio (RN CLI)</Text>
          <Text style={styles.headerBadge}>
            {project?.language?.toUpperCase() || 'VI'} · {project?.videoModel || 'kling-v2.0'}
          </Text>
        </View>

        {/* 9:16 Server-Typeset SVG Frame Preview (Identical on Web & Mobile) */}
        <View style={styles.canvasWrapper}>
          {activeScene?.svgMarkup ? (
            <SvgXml xml={activeScene.svgMarkup} width="100%" height="100%" />
          ) : null}
        </View>

        {/* Scene Selector Strip */}
        <View style={styles.sceneRow}>
          {scenes.map((sc: { id: string; headlineText: string }, idx: number) => (
            <TouchableOpacity
              key={sc.id}
              onPress={() => setSelectedSceneIdx(idx)}
              style={[
                styles.scenePill,
                selectedSceneIdx === idx && styles.scenePillActive,
              ]}
            >
              <Text style={styles.scenePillTitle}>Scene {idx + 1}</Text>
              <Text numberOfLines={1} style={styles.scenePillDesc}>
                {sc.headlineText}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Suggests -> User Decides Cards */}
        <Text style={styles.sectionTitle}>AI Đề xuất → Quyết định 1 Chạm</Text>
        {suggestions.map(
          (sug: {
            id: string;
            title: string;
            rationale: string;
            impactMetric: string;
            isApplied: boolean;
          }) => (
            <View key={sug.id} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.impactBadge}>{sug.impactMetric}</Text>
              </View>
              <Text style={styles.suggestionTitle}>{sug.title}</Text>
              <Text style={styles.suggestionRationale}>{sug.rationale}</Text>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  sug.isApplied && styles.appliedButton,
                ]}
                onPress={() => handleApply(sug.id)}
              >
                <Text style={styles.applyButtonText}>
                  {sug.isApplied ? 'Đã áp dụng' : 'Áp dụng ngay (1-Tap)'}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060911' },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  headerBadge: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  canvasWrapper: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1E293B',
    backgroundColor: '#090D16',
    marginBottom: 14,
  },
  sceneRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  scenePill: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scenePillActive: { borderColor: '#6366F1', backgroundColor: '#1E1B4B' },
  scenePillTitle: { color: '#818CF8', fontSize: 11, fontWeight: '700' },
  scenePillDesc: { color: '#E2E8F0', fontSize: 12, marginTop: 2 },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  suggestionCard: {
    backgroundColor: '#0B101E',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  suggestionHeader: { flexDirection: 'row', marginBottom: 6 },
  impactBadge: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  suggestionRationale: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  appliedButton: { backgroundColor: '#065F46' },
  applyButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

