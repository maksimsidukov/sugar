import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { startApp } from './app';
import { showToast, showUpdateToast } from './ui/toast';

const updateSW = registerSW({
  onOfflineReady() {
    showToast('Приложение готово работать офлайн');
  },
  onNeedRefresh() {
    showUpdateToast(() => void updateSW(true));
  },
});

const root = document.querySelector<HTMLElement>('#app');
if (root) void startApp(root);
