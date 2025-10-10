<template>
  <sidebar
    id="user-list"
    :label="l('users.title')"
    icon="fa-users"
    :right="true"
    :open="expanded"
  >
    <tabs
      style="flex-shrink: 0"
      :fullWidth="true"
      :tabs="
        channel
          ? { 0: l('users.friends'), 1: l('users.members') }
          : !isConsoleTab
            ? { 0: l('users.friends'), 1: l('user.profile') }
            : { 0: l('users.friends') }
      "
      v-model="tab"
    ></tabs>
    <div
      class="users hidden-scrollbar"
      style="padding-left: 10px"
      v-if="tab === '0'"
    >
      <h4>{{ l('users.friends') }}</h4>
      <div
        v-for="character in friends"
        :key="character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="true"
          :bookmark="false"
          :isMarkerShown="shouldShowMarker"
        ></user>
      </div>
      <h4>{{ l('users.bookmarks') }}</h4>
      <div
        v-for="character in bookmarks"
        :key="character.name"
        class="userlist-item"
      >
        <user
          :character="character"
          :showStatus="true"
          :bookmark="false"
          :isMarkerShown="shouldShowMarker"
        ></user>
      </div>
    </div>
    <div
      v-if="channel && tab === '1'"
      style="padding-left: 5px; flex: 1; display: flex; flex-direction: column"
    >
      <div class="users hidden-scrollbar" style="flex: 1; padding-left: 5px">
        <h4>
          <div ref="memberHeader" style="position: relative; width: 100%">
            <span style="display: inline-block">{{
              l('users.memberCount', channel.sortedMembers.length)
            }}</span>
            <a
              :class="['filter-btn', { active: filterActive }]"
              href="#"
              style="margin-left: 8px; display: inline-block"
              @click.prevent="toggleSortMenu"
              title="Filters"
              aria-label="Open member filters"
            >
              <i class="fa fa-filter"></i>
            </a>

            <div
              v-show="showSortMenu"
              ref="sortPopover"
              class="sort-popover card"
              :style="sortMenuStyle"
            >
              <div style="margin-bottom: 8px">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                  "
                >
                  <strong style="margin: 0">Sort by</strong>
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    @click.prevent="resetFilters"
                  >
                    Reset
                  </button>
                </div>
                <div>
                  <label
                    class="form-check"
                    style="display: block"
                    v-for="s in ['status', 'gender', 'normal']"
                    :key="s"
                  >
                    <input
                      class="form-check-input"
                      type="radio"
                      :value="s"
                      v-model="sortType"
                    />
                    <span class="form-check-label" style="margin-left: 6px">{{
                      s === 'normal'
                        ? 'A-Z'
                        : s.charAt(0).toUpperCase() + s.slice(1)
                    }}</span>
                  </label>
                </div>
              </div>

              <hr style="margin: 6px 0" />
              <div style="margin-bottom: 8px">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                  "
                >
                  <strong>Statuses</strong>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px">
                  <label
                    v-for="st in statusOptions"
                    :key="st"
                    class="form-check"
                    style="margin: 0"
                  >
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="st"
                      v-model="selectedStatuses"
                    />
                    <span class="form-check-label" style="margin-left: 6px">{{
                      st
                    }}</span>
                  </label>
                </div>
              </div>

              <hr style="margin: 6px 0" />
              <div style="margin-bottom: 4px">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                  "
                >
                  <strong>Genders</strong>
                  <button
                    class="btn btn-sm"
                    :class="{
                      'btn-primary': autoGenderFilterEnabled,
                      'btn-outline-secondary': !autoGenderFilterEnabled
                    }"
                    @click.prevent="toggleAutoGenderFilter"
                    :title="
                      autoGenderFilterEnabled
                        ? 'Automatic gender filtering is ON'
                        : 'Automatic gender filtering is OFF'
                    "
                    :aria-pressed="autoGenderFilterEnabled.toString()"
                  >
                    Auto
                  </button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px">
                  <label
                    v-for="g in genderOptions"
                    :key="g"
                    class="form-check"
                    style="margin: 0"
                  >
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="g"
                      v-model="genderFilters"
                      @change="onManualGenderChange"
                    />
                    <span class="form-check-label" style="margin-left: 6px">{{
                      g
                    }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </h4>
        <div
          v-for="member in filteredMembers"
          :key="member.character.name"
          class="userlist-item"
        >
          <user
            :character="member.character"
            :channel="channel"
            :showStatus="true"
            :isMarkerShown="shouldShowMarker"
          ></user>
        </div>
      </div>
      <div class="input-group" style="margin-top: 5px; flex-shrink: 0">
        <span class="input-group-text">
          <span class="fas fa-search"></span>
        </span>
        <input
          class="form-control"
          v-model="filter"
          :placeholder="l('filter')"
          type="text"
        />
      </div>
    </div>
    <div
      v-if="!channel && !isConsoleTab && tab === '1'"
      style="
        flex: 1;
        display: flex;
        flex-direction: column;
        padding-bottom: 10px;
      "
      class="profile hidden-scrollbar"
    >
      <a :href="profileUrl" target="_blank" class="btn profile-button">
        <span class="fa fa-fw fa-user"></span>
        {{ l('user.fullProfile') }}
      </a>

      <character-page
        :authenticated="true"
        :oldApi="true"
        :name="profileName"
        :image-preview="true"
        ref="characterPage"
      ></character-page>
    </div>
  </sidebar>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import Vue from 'vue';
  import Tabs from '../components/tabs';
  import core from './core';
  import { Channel, Character, Conversation } from './interfaces';
  import l from './localize';
  import Sidebar from './Sidebar.vue';
  import UserView from './UserView.vue';
  import _ from 'lodash';
  import characterPage from '../site/character_page/character_page.vue';
  import { profileLink } from './common';
  import {
    genderOptions as builtInGenderOptions,
    filterByName,
    filterByGender,
    filterByStatus,
    sortMembers,
    computeAutoGenders
  } from './memberFilters';

  const availableSorts = ['normal', 'status', 'gender'] as const;

  @Component({
    components: { characterPage, user: UserView, sidebar: Sidebar, tabs: Tabs }
  })
  export default class UserList extends Vue {
    tab = '0';
    expanded = window.innerWidth >= 992;
    filter = '';

    genderFilters: string[] =
      core &&
      core.state &&
      (core.state.settings as any) &&
      Array.isArray((core.state.settings as any).horizonSavedGenderFilters)
        ? (core.state.settings as any).horizonSavedGenderFilters.slice()
        : [];

    genderOptions: string[] = builtInGenderOptions.slice();

    autoGenderFilterEnabled: boolean =
      core &&
      (core.state as any) &&
      (core.state.settings as any) &&
      typeof (core.state.settings as any).horizonAutoGenderFilter === 'boolean'
        ? (core.state.settings as any).horizonAutoGenderFilter
        : true;

    showSortMenu = false;
    statusOptions: string[] = ['looking', 'online', 'idle', 'away', 'busy'];
    selectedStatuses: string[] = [];
    sortMenuStyle: Record<string, any> = {
      position: 'fixed',
      left: '0px',
      right: '0px',
      top: '0px',
      zIndex: 1000,
      padding: '8px',
      boxSizing: 'border-box',
      maxHeight: '360px',
      overflow: 'auto',
      display: 'none'
    };
    l = l;
    sorter = (x: Character, y: Character) =>
      x.name.toLocaleLowerCase() < y.name.toLocaleLowerCase()
        ? -1
        : x.name.toLocaleLowerCase() > y.name.toLocaleLowerCase()
          ? 1
          : 0;

    sortType: (typeof availableSorts)[number] = ((core &&
      core.state &&
      (core.state.settings as any) &&
      (core.state.settings as any).horizonSavedMembersSort) ||
      'status') as (typeof availableSorts)[number];

    @Hook('mounted')
    mounted(): void {
      this.applyOrientationAutoFilter();

      this.$watch(
        () => core.characters.ownProfile,
        (val: any) => {
          if (val) this.applyOrientationAutoFilter();
        },
        { immediate: true }
      );

      this.$watch('tab', (val: any) => {
        if (val === '1' && this.channel) this.applyOrientationAutoFilter();
      });

      this.$watch(
        () => this.genderFilters.slice(),
        (val: any) => {
          try {
            core.state.settings = {
              ...(core.state.settings as any),
              horizonSavedGenderFilters: val
            } as any;
          } catch (e) {
            console.warn(
              'UserList: failed to persist horizonSavedGenderFilters',
              e
            );
          }
        },
        { deep: true }
      );

      this.$watch('sortType', (val: any) => {
        try {
          core.state.settings = {
            ...(core.state.settings as any),
            horizonSavedMembersSort: val
          } as any;
        } catch (e) {
          console.warn(
            'UserList: failed to persist horizonSavedMembersSort',
            e
          );
        }
      });
    }

    applyOrientationAutoFilter(): void {
      if (!this.autoGenderFilterEnabled) return;
      try {
        const prof = core.characters.ownProfile as any;
        if (!prof || !prof.character) return;

        const genders = computeAutoGenders(
          prof.character,
          core.characters.ownCharacter,
          this.genderOptions
        );

        if (genders && genders.length > 0) {
          this.genderFilters = genders.slice();
        } else {
          this.genderFilters = [];
        }

        console.debug(
          'UserList: auto-applied genderFilters',
          this.genderFilters
        );
      } catch (e) {}
    }

    toggleAutoGenderFilter(): void {
      this.autoGenderFilterEnabled = !this.autoGenderFilterEnabled;
      console.debug(
        'UserList: autoGenderFilterEnabled ->',
        this.autoGenderFilterEnabled
      );
      try {
        core.state.settings = {
          ...(core.state.settings as any),
          horizonAutoGenderFilter: this.autoGenderFilterEnabled
        } as any;
      } catch (e) {
        console.warn('UserList: failed to persist horizonAutoGenderFilter', e);
      }
      if (this.autoGenderFilterEnabled) {
        this.applyOrientationAutoFilter();
      }
    }

    onManualGenderChange(): void {
      if (this.autoGenderFilterEnabled) {
        this.autoGenderFilterEnabled = false;
        console.debug(
          'UserList: autoGenderFilterEnabled disabled due to manual gender change'
        );
        try {
          core.state.settings = {
            ...(core.state.settings as any),
            horizonAutoGenderFilter: false
          } as any;
        } catch (e) {
          console.warn(
            'UserList: failed to persist horizonAutoGenderFilter',
            e
          );
        }
      }
    }

    get friends(): Character[] {
      return core.characters.friends.slice().sort(this.sorter);
    }

    get bookmarks(): Character[] {
      return core.characters.bookmarks
        .slice()
        .filter(x => core.characters.friends.indexOf(x) === -1)
        .sort(this.sorter);
    }

    get channel(): Channel {
      return (<Conversation.ChannelConversation>(
        core.conversations.selectedConversation
      )).channel;
    }

    get isConsoleTab(): boolean {
      return (
        core.conversations.selectedConversation ===
        core.conversations.consoleTab
      );
    }
    get profileName(): string | undefined {
      return this.channel
        ? undefined
        : core.conversations.selectedConversation.name;
    }

    get profileUrl(): string | undefined {
      if (!this.profileName) {
        return;
      }

      return profileLink(this.profileName);
    }

    get filteredMembers(): ReadonlyArray<Channel.Member> {
      const members = this.getFilteredMembers();
      return sortMembers(members, this.sortType);
    }

    getFilteredMembers() {
      // start with name-filtered members
      let visible = filterByName(this.channel.sortedMembers, this.filter);

      if (core.state.settings.risingFilter.hideChannelMembers) {
        visible = visible.filter(m => {
          const p = core.cache.profileCache.getSync(m.character.name);
          return !p || !p.match.isFiltered;
        });
      }

      visible = filterByGender(visible, this.genderFilters);
      visible = filterByStatus(visible, this.selectedStatuses);

      return visible;
    }

    toggleSortMenu(): void {
      this.showSortMenu = !this.showSortMenu;
      if (this.showSortMenu) {
        document.addEventListener('click', this.onDocumentClick);
        window.addEventListener('resize', this.updateSortMenuPosition);
        window.addEventListener('scroll', this.updateSortMenuPosition, true);
        this.$nextTick(() => this.updateSortMenuPosition());
      } else {
        document.removeEventListener('click', this.onDocumentClick);
        window.removeEventListener('resize', this.updateSortMenuPosition);
        window.removeEventListener('scroll', this.updateSortMenuPosition, true);
        this.sortMenuStyle.display = 'none';
      }
    }

    onDocumentClick = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : (e as any).path || [];
      if (path && path.some((el: any) => el && el.id === 'user-list')) return;
      this.showSortMenu = false;
      document.removeEventListener('click', this.onDocumentClick);
      window.removeEventListener('resize', this.updateSortMenuPosition);
      window.removeEventListener('scroll', this.updateSortMenuPosition, true);
      this.sortMenuStyle.display = 'none';
    };

    updateSortMenuPosition = (): void => {
      const headerEl = this.$refs.memberHeader as HTMLElement | undefined;
      if (!headerEl) return;

      const rect = headerEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const availableTop = rect.bottom;
      const availableBottom = viewportHeight - availableTop;

      const left = rect.left;
      const right = rect.right;

      this.sortMenuStyle = {
        position: 'fixed',
        left: `${left}px`,
        right: `${window.innerWidth - right}px`,
        top: `${availableTop}px`,
        zIndex: 1000,
        padding: '8px',
        boxSizing: 'border-box',
        maxHeight: `${Math.max(120, availableBottom - 12)}px`,
        overflow: 'auto',
        display: 'block'
      };
    };

    resetFilters(): void {
      this.autoGenderFilterEnabled = true;
      try {
        core.state.settings = {
          ...(core.state.settings as any),
          horizonAutoGenderFilter: true
        } as any;
      } catch (e) {
        console.warn('UserList: failed to persist horizonAutoGenderFilter', e);
      }

      this.genderFilters = [];
      this.selectedStatuses = [];
      this.sortType = 'status';
      this.filter = '';

      this.applyOrientationAutoFilter();
    }

    beforeDestroy(): void {
      document.removeEventListener('click', this.onDocumentClick);
      window.removeEventListener('resize', this.updateSortMenuPosition);
      window.removeEventListener('scroll', this.updateSortMenuPosition, true);
    }

    get shouldShowMarker(): boolean {
      return core.state.settings.horizonShowGenderMarker;
    }

    get filterActive(): boolean {
      return (
        (this.genderFilters && this.genderFilters.length > 0) ||
        (this.selectedStatuses && this.selectedStatuses.length > 0) ||
        this.sortType !== 'normal'
      );
    }
  }
</script>

<style lang="scss">
  @import '~bootstrap/scss/functions';
  @import '~bootstrap/scss/variables';
  @import '~bootstrap/scss/mixins/breakpoints';

  #user-list {
    flex-direction: column;
    h4 {
      margin: 5px 0 0 -5px;
      font-size: 17px;
    }

    .users {
      height: 100%;
    }

    .nav li:first-child a {
      border-left: 0;
      border-top-left-radius: 0;
    }

    .sidebar {
      .body {
        overflow-x: hidden;
      }
    }

    .userlist-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (min-width: breakpoint-min(md)) {
      .sidebar {
        position: static;
        margin: 0;
        height: 100%;
      }

      .modal-backdrop {
        display: none;
      }
    }

    &.open .body {
      display: flex;
    }

    .profile {
      .profile-button {
        border: 1px var(--bs-secondary) solid;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        min-height: 2rem;
        margin-left: 0.3rem;
        margin-right: 0.3rem;
        margin-top: 0.6rem;
        display: block;
      }

      h4 {
        margin: 0.5rem 0 0.5rem 0 !important;
        padding-left: 0.25rem;
        padding-right: 0.2rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        color: var(--characterKinkCustomColor);
      }

      .match-report {
        display: none;
      }

      .tab-content #overview > div {
        margin-bottom: 0.4rem !important;
        margin-left: 5px;
        margin-right: 5px;

        &.character-kinks-block {
          margin-left: 0;
          margin-right: 0;
        }
      }

      .row.character-page {
        display: flex;
        margin-right: 0;
        margin-left: 0;

        > div {
          max-width: 100% !important;
          margin: 0;
          padding: 0;
          border: 0;
          flex: 0 0 100%;
        }
      }

      #character-page-sidebar {
        border: none;
        background-color: transparent !important;
      }

      .card-body {
        padding: 0;
      }

      .character-page {
        .character-links-block,
        .character-avatar,
        .character-page-note-link,
        .character-card-header,
        .compare-highlight-block {
          display: none !important;
        }

        .character-avatar.icon {
          display: initial !important;
        }

        #characterView {
          .card {
            border: none !important;
            background-color: transparent !important;
          }
          .indentText {
            padding-left: 0px;
          }

          .character-kinks-block {
            .kink-block-no {
              .card {
                background-color: var(--scoreMismatchBgFaint) !important;
              }
            }

            .kink-block-maybe {
              .card {
                background-color: var(--scoreWeakMismatchBgFaint) !important;
              }
            }

            .kink-block-yes {
              .card {
                background-color: var(--scoreWeakMatchBgFaint) !important;
              }
            }

            .kink-block-favorite {
              .card {
                background-color: var(--scoreMatchBgFaint) !important;
              }
            }
          }
        }

        .infotag {
          margin: 0;
          padding: 0;
          margin-bottom: 0.3rem;

          .infotag-value {
            margin: 0;
          }
        }

        .character-list-block {
          display: none !important;
        }

        .quick-info-block {
          margin-left: 5px;
          margin-right: 5px;
        }

        .quick-info {
          display: none !important;
        }

        #headerCharacterMemo {
          margin-left: 5px;
          margin-right: 5px;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .character-kinks-block {
          > div {
            flex-direction: column !important;
            margin: 0 !important;

            > div {
              min-width: 100% !important;
              padding: 0 !important;
              margin-top: 0.5rem;

              .card {
                border: none !important;

                .card-header {
                  margin: 0;
                  padding: 0;
                }

                div.stock-kink + div.custom-kink {
                  border-top: 1px var(--characterKinkCustomBorderColor) solid !important;
                  padding-top: 0.25rem !important;
                  margin-top: 0.25rem !important;
                }

                .character-kink {
                  margin: 0;
                  padding: 0;

                  &.stock-kink {
                    padding-left: 0.2rem !important;
                    margin-right: 0.3rem !important;
                    margin-left: 0.1rem !important;
                  }

                  &.custom-kink {
                    margin-bottom: 0.3rem;
                    border: none;
                    margin-left: auto;
                    max-width: 95%;
                    margin-right: auto;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px var(--characterKinkCustomBorderColor)
                      solid;
                  }

                  .popover {
                    min-width: 180px;
                    max-width: 180px;
                  }
                }
              }
            }
          }
        }
      }
    }

    .filter-btn {
      background-color: transparent;
      border: 1px solid var(--bs-border-color, #dcdcdc);
      color: var(--bs-primary, #0d6efd);
      padding: 0.25rem 0.45rem;
      border-radius: 0.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition:
        box-shadow 0.15s ease,
        border-color 0.15s ease,
        transform 0.08s ease,
        color 0.15s ease;
    }

    .filter-btn:hover {
      transform: translateY(-1px);
      background-color: rgba(0, 0, 0, 0.03);
    }

    .filter-btn.active {
      border-color: rgba(13, 110, 253, 0.9);
      color: rgba(13, 110, 253, 0.95);
      box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.06);
    }
  }
</style>
