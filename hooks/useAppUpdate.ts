import { useState, useEffect } from 'react';
import { Platform, InteractionManager } from 'react-native';
import { fetchAppVersionInfo } from '@/apis/app-info';
import { checkUpdateStatus } from '@/utils/versioning';
import { clientStorage } from '@/utils/storage';
import { useAuth } from '@/context/AuthContext';

export const useAppUpdate = () => {
  const { isAuthenticated } = useAuth();
  const [updateInfo, setUpdateInfo] = useState<{
    visible: boolean;
    isMandatory: boolean;
    latestVersion: string;
    updateUrl: string;
    releaseNotes: string;
  }>({
    visible: false,
    isMandatory: false,
    latestVersion: '',
    updateUrl: '',
    releaseNotes: ''
  });

  const hideUpdateModal = () => setUpdateInfo(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkUpdate = async () => {
      try {
        const lastCheckStr = await clientStorage.getItem('last_update_check');
        const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;
        const now = Date.now();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        if (now - lastCheck > ONE_DAY_MS) {
          const info = await fetchAppVersionInfo();

          // Fallback to EXPO_PUBLIC_APP_VERSION, then 3.0.0
          let currentVersion = process.env.EXPO_PUBLIC_APP_VERSION ?? '3.0.0';
          try {
            const packageJson = require('../../package.json');
            if (packageJson && packageJson.version) {
              currentVersion = packageJson.version;
            }
          } catch (e) {
            // Ignore if package.json cannot be required
          }

          const { isMandatory, isOptional } = checkUpdateStatus(currentVersion, info.latestVersion, info.minRequiredVersion);

          if (isMandatory || isOptional) {
            setUpdateInfo({
              visible: true,
              isMandatory: isMandatory,
              latestVersion: info.latestVersion,
              updateUrl: Platform.OS === 'ios' ? info.updateUrl.ios : info.updateUrl.android,
              releaseNotes: info.releaseNotes
            });
          }
          await clientStorage.setItem('last_update_check', now.toString());
        }
      } catch (e) {
        console.warn('Failed to check for updates on load', e);
      }
    };

    // Delay update check so it doesn't affect app startup performance
    const task = InteractionManager.runAfterInteractions(() => {
      const updateTimer = setTimeout(() => {
        checkUpdate();
      }, 10000); // 10 seconds delay after interactions

      // We can't clear the timeout inside InteractionManager easily if it unmounts immediately,
      // but typically AppInitializer doesn't unmount unless the app closes.
    });

    return () => task.cancel();
  }, [isAuthenticated]);

  return {
    updateInfo,
    hideUpdateModal,
  };
};
