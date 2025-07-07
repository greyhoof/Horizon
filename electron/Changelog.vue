<template>
  <div
    class="card-full"
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <div class="window-modal modal" :class="getThemeClass()" tabindex="-1">
      <div class="modal-dialog modal-xl" style="height: 100vh">
        <div class="modal-content" style="height: 100vh">
          <div class="modal-header">
            <h4 class="modal-title" style="-webkit-app-region: drag">
              {{
                updateVersion
                  ? l('changelog.version', updateVersion)
                  : l('help.changelog')
              }}
            </h4>
            <button
              type="button"
              class="close"
              aria-label="Close"
              v-if="!isMac"
              @click.stop="close()"
              z-
            >
              <span class="fas fa-times"></span>
            </button>
          </div>
          <div class="modal-body">
            <div
              class="logs-container"
              v-html="changeLogText"
              ref="mdContainer"
            ></div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click.stop="close()"
              >
                {{ l('action.close') }}
              </button>
              <button
                v-if="updateVersion"
                type="button"
                class="btn btn-secondary"
                @click.stop="goToDownload()"
              >
                {{ l('changelog.download') }}
              </button>

              <button
                v-if="updateVersion"
                type="button"
                class="btn btn-primary"
                @click.stop="closeAndDownload()"
              >
                {{ l('changelog.quitAndDownload') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import * as remote from '@electron/remote';
  import Vue from 'vue';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  import Tabs from '../components/tabs';
  import FilterableSelect from '../components/FilterableSelect.vue';
  import Axios from 'axios';
  import markdownit from 'markdown-it';
  import electron from 'electron';

  type ReleaseInfo = {
    html_url: string;
    tag_name: string;
    body: string;
  };

  const browserWindow = remote.getCurrentWindow();
  @Component({
    components: { tabs: Tabs, 'filterable-select': FilterableSelect }
  })
  export default class Changelog extends Vue {
    settings!: GeneralSettings;
    updateVersion!: string | undefined;
    isMaximized = false;
    l = l;
    platform = process.platform;
    isMac = process.platform === 'darwin';
    hasCompletedUpgrades = false;
    changeLogText: string = '';

    get styling(): string {
      try {
        return `<style>${fs.readFileSync(path.join(__dirname, `themes/${this.settings.theme}.css`), 'utf8').toString()}</style>`;
      } catch (e) {
        if (
          (<Error & { code: string }>e).code === 'ENOENT' &&
          this.settings.theme !== 'default'
        ) {
          this.settings.theme = 'default';
          return this.styling;
        }
        throw e;
      }
    }

    @Hook('mounted')
    async mounted(): Promise<void> {
      const container = <HTMLElement>this.$refs['mdContainer'];
      if (container) {
        container.addEventListener('click', this.delegateLinkClick);
      }
      let apiUrl =
        'https://api.github.com/repos/Fchat-Horizon/Horizon/releases/tags/' +
        (this.updateVersion
          ? this.updateVersion!
          : 'v' + process.env.APP_VERSION);
      let releaseInfo: ReleaseInfo = (await Axios.get<ReleaseInfo>(apiUrl))
        .data;
      let md = markdownit();

      const defaultRender =
        md.renderer.rules.link_open ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options);
        };

      md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        token.attrPush(['data-action', 'openExternal']);
        // Set href to "#" or "javascript:void(0)"
        //const hrefIndex = token.attrIndex('href');
        //if (hrefIndex >= 0) token.attrs![hrefIndex][1] = '#';
        // Add onclick handler
        return defaultRender(tokens, idx, options, env, self);
      };
      this.changeLogText = md.render(releaseInfo.body);
    }

    close(): void {
      browserWindow.close();
    }

    externalUrlHandler(url: string) {
      electron.ipcRenderer.send('open-url-externally', url);
    }

    delegateLinkClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'A' &&
        target.getAttribute('data-action') === 'openExternal'
      ) {
        event.preventDefault();
        this.externalUrlHandler(target.getAttribute('href') || '#');
      }
    }

    getThemeClass() {
      // console.log('getThemeClassWindow', this.settings?.risingDisableWindowsHighContrast);

      try {
        // Hack!
        if (process.platform === 'win32') {
          if (this.settings?.risingDisableWindowsHighContrast) {
            document
              .querySelector('html')
              ?.classList.add('disableWindowsHighContrast');
          } else {
            document
              .querySelector('html')
              ?.classList.remove('disableWindowsHighContrast');
          }
        }

        return {
          ['platform-' + this.platform]: true,
          disableWindowsHighContrast:
            this.settings?.risingDisableWindowsHighContrast || false
        };
      } catch (err) {
        return {
          ['platform-' + this.platform]: true
        };
      }
    }

    goToDownload() {
      this.externalUrlHandler(
        'https://horizn.moe/download.html?ver=' + this.updateVersion
      );
    }

    closeAndDownload(): void {
      electron.ipcRenderer.send('update-and-exit', this.updateVersion);
    }
  }
</script>

<style lang="scss">
  .card-full .window-modal {
    position: relative;
    display: block;
  }
  .window-modal .modal-dialog {
    margin: 0px;
    max-width: 100%;
  }

  .modal-title {
    width: 100%;
  }

  .tab-content {
    overflow: auto;
  }

  .modal-body {
    height: 100%;
    display: flex;
    flex-flow: column;
  }

  .logs-container {
    height: 100%;
    width: 100%;
    overflow-y: scroll;
  }

  /*This override exists because we allow the user to resize the window, which potentially resizes the footer otherwise*/
  .modal-body .modal-footer {
    height: 52px;
    min-height: 52px;
  }

  .card-full {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
  }

  .card-body .form-group {
    margin-left: 0;
    margin-right: 0;
  }

  .card-body .form-group .filters label {
    display: list-item;
    margin: 0;
    margin-left: 5px;
    list-style: none;
  }

  #windowButtons .btn {
    border-top: 0;
    font-size: 14px;
  }

  #window-browser-settings {
    user-select: none;
    .btn {
      border: 0;
      border-radius: 0;
      padding: 0 18px;
      display: flex;
      align-items: center;
      line-height: 1;
      -webkit-app-region: no-drag;
      flex-grow: 0;
    }

    .btn-default {
      background: transparent;
    }

    h4 {
      margin: 0 10px;
      user-select: none;
      cursor: default;
      align-self: center;
      -webkit-app-region: drag;
    }

    .fa {
      line-height: inherit;
    }
  }

  .warning {
    border: 1px solid var(--warning);
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 3px;

    div {
      margin-top: 10px;
    }
  }

  .disableWindowsHighContrast,
  .disableWindowsHighContrast * {
    forced-color-adjust: none;
  }
</style>
