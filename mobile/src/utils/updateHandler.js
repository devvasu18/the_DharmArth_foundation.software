import { Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import Constants from 'expo-constants';
import api from '../services/api';

/**
 * Checks for available updates using a dual-track strategy:
 * 1. Primary: Native Google Play/App Store In-App Updates.
 * 2. Fallback: Backend database check comparison with a premium modal redirect.
 * 
 * @param {Function} setUpdateInfo Callback to update layout state to show fallback modal.
 */
export const checkAndRunUpdates = async (setUpdateInfo) => {
  // Update checking is only relevant on real native devices/emulators
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    console.log("[UpdateHandler] Update checks skipped for non-native platform:", Platform.OS);
    return;
  }

  // 1. Run the native In-App Updates check (Primary Track)
  try {
    console.log("[UpdateHandler] Starting Primary Native Update Check...");
    const inAppUpdates = new SpInAppUpdates(
      __DEV__ // Enable debug logs in development mode
    );

    const updateResponse = await inAppUpdates.checkNeedsUpdate();
    
    if (updateResponse.shouldUpdate) {
      console.log("[UpdateHandler] Native update available! Triggering native Play Store UI...");
      
      if (Platform.OS === 'android') {
        // Immediate updates block app access; suitable for forced versions
        await inAppUpdates.startUpdate({
          updateType: IAUUpdateKind.IMMEDIATE 
        });
        return; // Native UI is now managing the update sequence
      }
    } else {
      console.log("[UpdateHandler] Native check: App is up-to-date natively.");
    }
  } catch (error) {
    console.warn(
      "[UpdateHandler] Primary Native Update check failed or unsupported. Transitioning to Fallback Track...", 
      error
    );
  }

  // 2. Fallback System (Backup Track): Compare local build against our remote API
  try {
    console.log("[UpdateHandler] Fetching remote version specifications from backend...");
    const response = await api.get('/settings/app-version/public');
    const remoteConfig = response.data;
    
    if (!remoteConfig) {
      console.warn("[UpdateHandler] Fallback check: Backend returned empty app-version configuration.");
      return;
    }

    // Read the current local version code from expoConfig (android)
    const currentVersionCode = Constants.expoConfig?.android?.versionCode || 1;
    const remoteVersionCode = remoteConfig.latestVersionCode || 1;
    
    console.log(`[UpdateHandler] Fallback check comparisons: Local Code [${currentVersionCode}], Remote Code [${remoteVersionCode}]`);

    if (remoteVersionCode > currentVersionCode) {
      console.log("[UpdateHandler] Fallback check: A newer app version is required. Launching UpdateModal...");
      setUpdateInfo({
        show: true,
        forceUpdate: remoteConfig.forceUpdate || false,
        playStoreUrl: remoteConfig.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.thedharmarth.foundation'
      });
    } else {
      console.log("[UpdateHandler] Fallback check: Version is up-to-date.");
    }
  } catch (fallbackError) {
    console.error("[UpdateHandler] Fallback check failed completely:", fallbackError);
  }
};
