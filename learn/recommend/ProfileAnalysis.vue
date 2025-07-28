<template>
  <div
    id="match-report"
    :class="{ 'match-report': true, minimized: isMinimized }"
    class="profile-analysis-wrapper"
    ref="profileAnalysisWrapper"
  >
    <a class="minimize-btn" @click.prevent="toggleMinimize()"
      ><i
        :class="{ fa: true, 'fa-plus': isMinimized, 'fa-minus': !isMinimized }"
      ></i
    ></a>
    <div class="alert alert-info" role="alert">
      <h4 class="alert-heading">Work in progress!</h4>
      <p>
        This version of the profile analysis is due for a rework. Our intention
        is for it to work as more of an explanation of how the matcher sees your
        profile, which things you'd match well (or poorly) with, etc.
      </p>
      <p>
        For now, if this thing gets in the way, you can click the
        <b>-</b> button on the top right to close it.
      </p>
      <hr />
      <p class="mb-0">
        As we develop this update more and more, it'll get done. Please hold on
        for now though.
      </p>
    </div>
    <div v-if="!analyzing && !recommendations.length">
      <h3>Looking good!</h3>
      <p>
        The profile analyzer could not find any improvement recommendations for
        your profile.
      </p>
    </div>

    <div v-else-if="analyzing && !recommendations.length">
      <p>Having problems with finding good matches?</p>
      <p>&nbsp;</p>
      <p>
        The profile analyzer will identify if your profile could benefit from
        adjustments.
      </p>
      <p>&nbsp;</p>
      <h3>Analyzing...</h3>
    </div>

    <div v-else>
      <p>Having problems with finding good matches?</p>
      <p>&nbsp;</p>
      <p>
        The profile analyzer recommends the following adjustments to your
        profile:
      </p>

      <ul>
        <li
          v-for="r in recommendations"
          class="recommendation"
          :class="r.level"
        >
          <h3>{{ r.title }}</h3>
          <p>{{ r.desc }}</p>
          <p class="more-info" v-if="r.helpUrl">
            <a :href="r.helpUrl">Here's how</a>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>
<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import core from '../../chat/core';
  import {
    ProfileRecommendation,
    ProfileRecommendationAnalyzer
  } from './profile-recommendation';
  import { CharacterAnalysis } from '../matcher';
  import { methods } from '../../site/character_page/data_store';

  @Component({})
  export default class ProfileAnalysis extends Vue {
    recommendations: ProfileRecommendation[] = [];
    analyzing = false;

    isMinimized = false;

    @Prop({ required: true })
    readonly characterName: string;

    @Prop({ required: true })
    readonly characterId: number;
    @Prop({ required: true })
    @Hook('beforeMount')
    async beforeMount(): Promise<void> {
      this.isMinimized = !!(await core.settingsStore.get(
        'hideProfileComparisonSummary'
      ));
    }

    @Hook('mounted')
    async onMounted(): void {
      this.analyze();
    }

    async analyze() {
      this.analyzing = true;
      this.recommendations = [];

      const char = await methods.characterData(
        this.characterName,
        this.characterId,
        true
      );
      const profile = new CharacterAnalysis(char.character);
      const analyzer = new ProfileRecommendationAnalyzer(profile);

      this.recommendations = await analyzer.analyze();

      this.analyzing = false;
    }

    async toggleMinimize(): Promise<void> {
      this.isMinimized = !this.isMinimized;

      await core.settingsStore.set(
        'hideProfileComparisonSummary',
        this.isMinimized
      );
    }
  }
</script>
<style lang="scss">
  .profile-analysis-wrapper {
    h3 {
      font-size: 130%;
      margin-bottom: 0;
    }

    p {
      font-size: 95%;
      margin: 0;
    }

    ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
    }

    li {
      padding: 10px;
      margin: 5px;
      line-height: 120%;
      border-radius: 3px;

      &.critical {
        background-color: var(--scoreMismatchBg);
      }

      &.note {
        background-color: var(--scoreWeakMismatchBg);
      }
    }

    .more-info {
      margin-top: 1em;

      a {
        color: var(--linkForcedColor) !important;
        font-weight: bold;
      }
    }
  }
</style>
