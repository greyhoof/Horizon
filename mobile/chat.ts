import Axios from 'axios';
import {init as initCore} from '../chat/core';
import {setupRaven} from '../chat/vue-raven';
import Socket from '../chat/WebSocket';
import Connection from '../fchat/connection';
import {appVersion, Logs, SettingsStore} from './filesystem';
import Index from './Index.vue';
import Notifications from './notifications';
import { GeneralSettings } from '../electron/common';

const version = (<{version: string}>require('./package.json')).version; //tslint:disable-line:no-require-imports
(<any>window)['setupPlatform'] = (platform: string) => { //tslint:disable-line:no-any
    Axios.defaults.params = { __fchat: `mobile-${platform}/${version}` };
};

if(process.env.NODE_ENV === 'production')
    setupRaven('https://a9239b17b0a14f72ba85e8729b9d1612@sentry.f-list.net/2', `mobile-${version}`);

const connection = new Connection('F-Chat 3.0 (Mobile)', appVersion, Socket);
initCore(connection, new GeneralSettings(), Logs, SettingsStore, Notifications);

new Index({ //tslint:disable-line:no-unused-expression
    el: '#app'
});
