<template>
  <div
    class="card-full"
    style="display: flex; flex-direction: column; height: 100%"
    :class="getThemeClass()"
    @auxclick.prevent
  >
    <div v-html="styling"></div>
    <!--<div
      style="display: flex; align-items: stretch; border-bottom-width: 1px"
      class="border-bottom"
      id="window-browser-settings"
    >
      <h4 style="padding: 2px 0">{{ l('settings.browserOptionHeader') }}</h4>
      <div
        style="
          flex: 1;
          display: flex;
          justify-content: flex-end;
          -webkit-app-region: drag;
        "
        class="btn-group"
        id="windowButtons"
      >
        <i
          class="far fa-window-minimize btn btn-light"
          @click.stop="minimize()"
        ></i>
        <!--        <i class="far btn btn-light" :class="'fa-window-' + (isMaximized ? 'restore' : 'maximize')" @click="maximize()"></i>-->
    <!--<span class="btn btn-light" @click.stop="close()">
          <i class="fa fa-times fa-lg"></i>
        </span>
      </div>
</div>-->
    <div class="window-modal modal" :class="getThemeClass()" tabindex="-1">
      <div class="modal-dialog modal-xl" style="height: 100vh;">
        <div class="modal-content" style="height: 100vh;">
          <div class="modal-header" style="-webkit-app-region: drag">
            <h5 class="modal-title">{{ l('settings.action') }}</h5>
          </div>
          <div class="modal-body">
            <tabs
              style="flex-shrink: 0; margin-bottom: 10px"
              v-model="selectedTab"
              :tabs="[
                l('settings.tabs.general'),
                l('settings.tabs.look'),
                l('settings.tabs.notifications'),
                l('settings.tabs.behavior'),
                l('settings.tabs.accessibility'),
                l('settings.tabs.advanced')
              ]"
            ></tabs>
            <!--General -->
            <div
              v-show="selectedTab === '0'"
              class="card-body settings-content"
              style="height: 100%; width: 100%"
            >
              <div class="form-group">
                <label class="control-label" for="updatecheck">
                  <input
                    type="checkbox"
                    id="updateCheck"
                    v-model="settings.updateCheck"
                  />
                  {{ l('settings.updateCheck') }}
                </label>
              </div>
              <div class="form-group" v-if="settings.updateCheck">
                <label class="control-label" for="beta">
                  <input type="checkbox" id="beta" v-model="settings.beta" />
                  {{ l('settings.beta') }}
                </label>
              </div>
            </div>
            <!--Appearance-->
            <div
              v-show="selectedTab === '1'"
              class="card-body settings-content"
              style="height: 100%; width: 100%"
            >
              <div class="form-group">
                <label class="control-label" for="theme">
                  {{ l('settings.theme') }}
                  <select
                    id="theme"
                    class="form-control"
                    v-model="settings.theme"
                    style="flex: 1; margin-right: 10px"
                  >
                    <option v-for="theme in availableThemes" :value="theme">
                      {{ theme }}
                    </option>
                  </select>
                </label>
              </div>
            </div>
            <!--Notifications-->
            <div
              v-show="selectedTab === '2'"
              class="card-body settings-content"
              style="height: 100%; width: 100%"
            >
              notifications
            </div>
            <!--Behavior-->
            <div
              v-show="selectedTab === '3'"
              class="card-body settings-content"
              style="height: 100%; width: 100%"
            >
              <div class="form-group">
                <label class="control-label" for="profileViewer">
                  <input
                    type="checkbox"
                    id="profileViewer"
                    v-model="settings.profileViewer"
                  />
                  {{ l('settings.profileViewer') }}
                </label>
              </div>
              <div class="form-group">
                <label class="control-label" for="closeToTray">
                  <input
                    type="checkbox"
                    id="closeToTray"
                    v-model="settings.closeToTray"
                  />
                  {{ l('settings.closeToTray') }}
                </label>
              </div>
            </div>
            <!--Accessibility-->
            <div
              v-show="selectedTab === '4'"
              class="card-body settings-content"
              style="height: 100%; width: 100%"
            >
              <div class="form-group" v-if="isWindows">
                <label
                  class="control-label"
                  for="risingDisableWindowsHighContrast"
                >
                  <input
                    type="checkbox"
                    id="hwAcceleration"
                    v-model="settings.risingDisableWindowsHighContrast"
                  />
                  {{ l('settings.risingDisableWindowsHighContrast') }}
                </label>
              </div>
            </div>
            <!-- Advanced -->
            <div
              v-show="selectedTab === '5'"
              class="card-body settings-content"
              style="height: 100%; width: 100%"
            >
              <div class="form-group">
                <label class="control-label" for="hwAcceleration">
                  <input
                    type="checkbox"
                    id="hwAcceleration"
                    v-model="settings.hwAcceleration"
                  />
                  {{ l('settings.hwAcceleration') }}
                </label>
              </div>
              <div class="form-group">
                <!--We do this one slightly differently because we 
                cannot and will not make ElectronLogger.LogType reactive -->
                <label class="control-label" for="systemLogLevel">
                  {{ l('settings.systemLogLevel') }}
                  <select
                    id="systemLogLevel"
                    class="form-control"
                    style="flex: 1; margin-right: 10px"
                    v-model="settings.risingSystemLogLevel"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warn</option>
                    <option value="info">Info</option>
                    <option value="verbose">Verbose</option>
                    <option value="debug">Debug</option>
                    <option value="silly">Silly</option>
                  </select>
                </label>
              </div>

              <h4 class="card-title">{{ l('settings.browserOptionTitle') }}</h4>
              <div class="form-group col-12">
                <div class="row">
                  <div class="col-12">
                    <div class="warning" v-if="isMac">
                      <h5>Danger Zone!</h5>

                      <hr />
                      <p>
                        Mac User: As of writing, MacOS has a bug in how it
                        handles opening links.
                      </p>
                      <p>
                        When your default browser is something other than Safari
                        and you select Safari in this settings window, links
                        might be opened twice.
                      </p>
                      <p>
                        Once in Safari and a second time in your default
                        browser. This tends to happen when Safari is not running
                        when clicking a link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group col-12">
                <label class="control-label" for="browserPath">{{
                  l('settings.browserOptionPath')
                }}</label>
                <div class="row">
                  <div class="col-10">
                    <input
                      class="form-control"
                      id="browserPath"
                      v-model="browserPath"
                    />
                  </div>
                  <div class="col-2">
                    <button
                      class="btn btn-primary"
                      @click.prevent.stop="browseForPath()"
                    >
                      {{ l('settings.browserOptionBrowse') }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-group col-12">
                <label class="control-label" for="browserArgs">{{
                  l('settings.browserOptionArguments')
                }}</label>
                <div class="row">
                  <div class="col-12">
                    <input
                      class="form-control"
                      id="browserArgs"
                      v-model="browserArgs"
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <small class="form-text text-muted">{{
                      l('settings.browserOptionArgumentsHelp')
                    }}</small>
                  </div>
                </div>
              </div>
              <div class="form-group col-12">
                <div class="row no-gutters">
                  <div class="col-4">
                    <button
                      class="btn btn-danger"
                      style="float: right"
                      @click.prevent.stop="resetToDefault()"
                    >
                      {{ l('settings.browserOptionReset') }}
                    </button>
                  </div>
                  <div class="col"></div>
                  <div class="col-2">
                    <button
                      class="btn btn-primary"
                      @click.prevent.stop="submit()"
                    >
                      {{ l('settings.browserOptionSave') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click.stop="close()"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click.stop="submit()"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import * as electron from 'electron';
  import { Component, Hook } from '@f-list/vue-ts';
  import * as remote from '@electron/remote';
  import Vue from 'vue';
  import l from '../chat/localize';
  import { GeneralSettings } from './common';
  import fs from 'fs';
  import path from 'path';
  import { ipcRenderer } from 'electron';
  import log from 'electron-log';
  import Tabs from '../components/tabs';

  const browserWindow = remote.getCurrentWindow();
  @Component({
    components: { tabs: Tabs }
  })
  export default class BrowserOption extends Vue {
    settings!: GeneralSettings;
    selectedTab = '0';
    isMaximized = false;
    l = l;
    platform = process.platform;
    hasCompletedUpgrades = false;
    browserPath = '';
    browserArgs = '';
    availableThemes!: ReadonlyArray<string> = [];
    logLevel = 'Info';

    //These are not reactive.
    //Which is kind of good because of all the security issues that'd otherwise arise
    isWindows = process.platform === 'windows';
    isMac = process.platform === 'darwin';

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
      this.browserPath = this.settings.browserPath;
      this.browserArgs = this.settings.browserArgs;
      this.logLevel = this.settings.risingSystemLogLevel.to;
      this.availableThemes = fs
        .readdirSync(path.join(__dirname, 'themes'))
        .filter(x => x.substr(-4) === '.css')
        .map(x => x.slice(0, -4));
    }

    minimize(): void {
      browserWindow.minimize();
    }

    close(): void {
      browserWindow.close();
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

    submit(): void {
      ipcRenderer.send('general-settings-update', this.settings);
      this.close();
    }

    resetToDefault(): void {
      this.browserPath = '';
      this.browserArgs = '';
    }

    browseForPath(): void {
      ipcRenderer.invoke('browser-option-browse').then(result => {
        this.browserPath = result;
      });
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
  
  .modal-body {
    overflow: auto;
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
