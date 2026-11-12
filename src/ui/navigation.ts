import type { AppTab } from '../app-state';
import { icon } from './icons';

export function renderNavigation(container: HTMLElement, activeTab: AppTab): void {
  container.className = 'bottom-nav';
  container.setAttribute('aria-label', 'Основная навигация');
  container.innerHTML = `
    <div class="bottom-nav__inner">
      <button class="nav-item ${activeTab === 'dashboard' ? 'nav-item--active' : ''}" type="button" data-tab="dashboard" ${activeTab === 'dashboard' ? 'aria-current="page"' : ''}>
        ${icon('home', 23)}<span>Обзор</span>
      </button>
      <button class="nav-add" type="button" data-action="add" aria-label="Добавить измерение">
        ${icon('plus', 28)}
      </button>
      <button class="nav-item ${activeTab === 'history' ? 'nav-item--active' : ''}" type="button" data-tab="history" ${activeTab === 'history' ? 'aria-current="page"' : ''}>
        ${icon('history', 23)}<span>История</span>
      </button>
    </div>
  `;
}
