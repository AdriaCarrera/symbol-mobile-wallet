/**
 * @format
 * @flow
 */
import React from 'react';
import { Text, TextInput, Platform } from 'react-native';

import SplashScreen from 'react-native-splash-screen';
import { hasUserSetPinCode } from '@haskkor/react-native-pincode';
import * as Config from './config/environment';
import { setI18nConfig } from './locales/i18n';
import { Router } from './Router';
import {AsyncCache} from './utils/storage/AsyncCache';
import store from '@src/store';
import { MnemonicSecureStorage } from '@src/storage/persistence/MnemonicSecureStorage';
import { AccountSecureStorage } from '@src/storage/persistence/AccountSecureStorage';
import { deletePasscode } from '@src/utils/passcode';
import {CURRENT_DATA_SCHEMA, migrateDataSchema} from "@src/utils/DataSchemaMigrations";

// Handle passcode after 30 secs of inactivity
let appState: string = '';
let appStateTime: number = Date.now();

const isSessionExpired = (lastKnownTime: number) => {
    return Date.now() > lastKnownTime + Number(Config.getSessionTimeoutInMillis());
};

export const handleAppStateChange = async (nextAppState: any) => {
    if (appState.match(/inactive|background/)) {
        appStateTime = Date.now();

        if (nextAppState !== 'active' || !isSessionExpired(appStateTime)) {
            return; // no-op
        }

        const isPin = await hasUserSetPinCode();
        if (isPin) {
            Router.showPasscode({ onSuccess: () => Router.goToDashboard() });
        }
    }

    appState = nextAppState;
};

const initStore = async () => {
    try {
        await store.dispatchAction({ type: 'settings/initState' });
        await store.dispatchAction({ type: 'network/initState' });
    } catch {}
    // store.dispatchAction({ type: 'market/loadMarketData' });
    store.dispatchAction({ type: 'news/loadNews' });
    store.dispatchAction({ type: 'addressBook/loadAddressBook' });
};

export const startApp = async () => {
    setGlobalCustomFont();

    const dataSchemaVersion = await AsyncCache.getDataSchemaVersion();
    if (dataSchemaVersion !== CURRENT_DATA_SCHEMA) await migrateDataSchema(dataSchemaVersion);

    await initStore();

    /* TODO: REGISTER CORRECT LANGUAGE
    const language = await SettingsHelper.getActiveLanguage();
    */
    const selectedLanguage = await AsyncCache.getSelectedLanguage();
    setI18nConfig(selectedLanguage);

    const mnemonic = await MnemonicSecureStorage.retrieveMnemonic();
    const isPin = await hasUserSetPinCode();

    SplashScreen.hide();

    if (mnemonic) {
        scheduleBackgroundJob();
        if (isPin) Router.showPasscode({ resetPasscode: false, onSuccess: () => Router.goToDashboard() });
        else Router.goToDashboard();
    } else {
        /* TODO: SELECT FIRST PAGE
        goToOnBoarding({
            // goToDashboard: () => goToOptinWelcomeAsRoot(),
            goToDashboard: () => goToNetworkSelector({}),
            goToPasscode: (props: Object) => goToPasscode(props),
        });
         */
        Router.goToTermsAndPrivacy({});
    }
};

const scheduleBackgroundJob = () => {
    /* TODO: SCHEDULE BACKGROUND JOB
    return WalletRepository.getWalletNotification().subscribe(
        notificationSyncInterval => {
            const syncInterval = Config.getSyncIntervalValue(notificationSyncInterval);

            BackgroundFetch.scheduleBackgroundTask(syncInterval);
        },
        error => {
            console.log('Error scheduling background task => ', error);
        }
    );
     */
};

// One Plus Fix for Oxygen OS and its painful Slate font truncating on bold text
// https://github.com/facebook/react-native/issues/15114
export const setGlobalCustomFont = () => {
    const oldRender = Text.render;
    Text.render = (...args) => {
        const origin = oldRender.call(this, ...args);
        return React.cloneElement(origin, {
            style: [{ fontFamily: 'NotoSans-Regular' }, origin.props.style],
        });
    };

    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.maxFontSizeMultiplier = 1.3;
    Text.defaultProps.allowFontScaling = false;

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.maxFontSizeMultiplier = 1.3;
    TextInput.defaultProps.allowFontScaling = false;
};

export const logout = async () => {
    await Promise.all([deletePasscode(), AsyncCache.removeAll(), MnemonicSecureStorage.clear(), AccountSecureStorage.clear()]);
    return initStore();
};
