import { addMeasurementToState, createDefaultState, removeMeasurementFromState, updateMeasurementInState, type AppState } from './app-state';
import type { Measurement } from './domain/measurement';
import { defaultRepository, type MeasurementRepository } from './data/db';
import { downloadBlob } from './export/download';
import { exportMeasurements } from './export/xlsx';
import { openDeleteDialog } from './ui/delete-dialog';
import { renderDashboard } from './ui/dashboard';
import { openFilterSheet } from './ui/filter-sheet';
import { renderHistory, type HistoryView } from './ui/history';
import { openMeasurementSheet } from './ui/measurement-sheet';
import { renderNavigation } from './ui/navigation';
import { showToast } from './ui/toast';

export async function startApp(
  root: HTMLElement,
  repository: MeasurementRepository = defaultRepository,
): Promise<void> {
  let state: AppState | null = null;
  let historyView: HistoryView = 'chart';
  root.innerHTML = '<div class="loading-screen"><span class="loading-dot"></span><p>Открываем дневник…</p></div>';

  function render(): void {
    if (!state) return;
    root.innerHTML = '<div class="app-frame"><main class="app-shell" id="main-content" tabindex="-1"></main><nav></nav></div>';
    const main = root.querySelector<HTMLElement>('main')!;
    renderNavigation(root.querySelector('nav')!, state.activeTab);

    if (state.activeTab === 'dashboard') {
      renderDashboard(main, state);
    } else {
      renderHistory(main, state, historyView);
    }
  }

  function openAddSheet(): void {
    openMeasurementSheet(async (input) => {
      if (!state) return;
      const measurement = await repository.saveMeasurement(input);
      state = addMeasurementToState(state, measurement);
      render();
      showToast('Измерение сохранено');
    });
  }

  function openEditSheet(measurement: Measurement): void {
    openMeasurementSheet(async (input) => {
      if (!state) return;
      const updated = await repository.updateMeasurement(measurement.id, input);
      state = updateMeasurementInState(state, updated);
      render();
      showToast('Изменения сохранены');
    }, measurement);
  }

  root.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.hasAttribute('data-retry')) {
      void load();
      return;
    }
    if (!state) return;

    if (button.dataset.action === 'add' || button.dataset.testid === 'dashboard-add') {
      openAddSheet();
      return;
    }

    if (button.hasAttribute('data-view-chart') || button.hasAttribute('data-view-table')) {
      historyView = button.hasAttribute('data-view-table') ? 'table' : 'chart';
      render();
      return;
    }

    if (button.hasAttribute('data-open-filter')) {
      openFilterSheet(state.filter, (filter) => {
        if (!state) return;
        state = { ...state, filter };
        render();
      });
      return;
    }

    if (button.hasAttribute('data-export-report')) {
      const items = state.measurements;
      const filter = state.filter;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      showToast('Формируем XLSX-отчёт…');
      void exportMeasurements(items, filter)
        .then((report) => {
          downloadBlob(report.blob, report.filename);
          showToast('Отчёт XLSX сохранён');
        })
        .catch(() => showToast('Не удалось сформировать отчёт. Попробуйте ещё раз.', 'error'))
        .finally(() => {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        });
      return;
    }

    const tab = button.dataset.tab;
    if (tab === 'dashboard' || tab === 'history') {
      state = { ...state, activeTab: tab };
      render();
      return;
    }

    const editId = button.dataset.editId;
    const editable = editId ? state.measurements.find((item) => item.id === editId) : null;
    if (editable) {
      openEditSheet(editable);
      return;
    }

    const deleteId = button.dataset.deleteId;
    const measurement = deleteId ? state.measurements.find((item) => item.id === deleteId) : null;
    if (measurement) {
      openDeleteDialog(measurement, async () => {
        if (!state) return;
        await repository.deleteMeasurement(measurement.id);
        state = removeMeasurementFromState(state, measurement.id);
        render();
        showToast('Запись удалена');
      });
      return;
    }
  });

  async function load(): Promise<void> {
    try {
      const measurements = await repository.listMeasurements();
      state = createDefaultState(measurements);
      render();
    } catch {
      root.innerHTML = `
        <main class="app-shell error-screen">
          <h1>Не удалось открыть дневник</h1>
          <p>Браузер не предоставил доступ к локальному хранилищу. Проверьте настройки приватности и попробуйте ещё раз.</p>
          <button class="primary-button" type="button" data-retry>Попробовать снова</button>
        </main>
      `;
    }
  }

  await load();
}
