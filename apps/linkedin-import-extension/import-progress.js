(function () {
  const STEPS = [
    {
      id: 'checking',
      label: 'Checking',
      hint: 'Verifying your import session…',
    },
    {
      id: 'opening',
      label: 'Opening',
      hint: 'Waiting for your LinkedIn profile to finish loading…',
    },
    {
      id: 'readmore',
      label: 'Read more',
      hint: 'Expanding About, Experience, and other collapsed sections…',
    },
    {
      id: 'fetching',
      label: 'Fetching',
      hint: 'Capturing profile content from the page…',
    },
    {
      id: 'sending',
      label: 'Sending',
      hint: 'Sending snapshot to linkedinpost for AI extraction…',
    },
    {
      id: 'returning',
      label: 'Returning',
      hint: 'Taking you back to Settings…',
    },
    {
      id: 'done',
      label: 'Completed',
      hint: 'Profile sent — review will open in Settings shortly.',
    },
  ];

  const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));

  let root = null;
  let currentStepId = null;
  let isError = false;
  let errorMessage = null;
  let retryHandler = null;

  function ensureRoot() {
    if (root) return root;

    root = document.createElement('div');
    root.id = 'lp-import-progress';
    root.innerHTML = `
      <style>
        #lp-import-progress {
          position: fixed;
          inset: 0;
          z-index: 2147483646;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.45);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #lp-import-progress .lp-card {
          width: min(420px, 100%);
          border-radius: 16px;
          border: 1px solid #e8ebf2;
          background: #fff;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
          padding: 20px 22px 18px;
        }
        #lp-import-progress .lp-brand {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 6px;
        }
        #lp-import-progress .lp-title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
        }
        #lp-import-progress .lp-subtitle {
          font-size: 13px;
          line-height: 1.5;
          color: #64748b;
          margin: 0 0 16px;
          min-height: 2.8em;
        }
        #lp-import-progress .lp-spinner-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        #lp-import-progress .lp-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: lp-spin 0.75s linear infinite;
          flex-shrink: 0;
        }
        #lp-import-progress.lp-done .lp-spinner,
        #lp-import-progress.lp-error .lp-spinner {
          display: none;
        }
        #lp-import-progress .lp-status-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        #lp-import-progress .lp-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
        }
        #lp-import-progress .lp-step {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
          font-size: 12px;
          color: #94a3b8;
        }
        #lp-import-progress .lp-step-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 700;
          margin-top: 1px;
        }
        #lp-import-progress .lp-step.lp-active {
          color: #0f172a;
          font-weight: 600;
        }
        #lp-import-progress .lp-step.lp-active .lp-step-icon {
          border-color: #6366f1;
          background: #eef2ff;
          color: #6366f1;
        }
        #lp-import-progress .lp-step.lp-done {
          color: #64748b;
        }
        #lp-import-progress .lp-step.lp-done .lp-step-icon {
          border-color: #22c55e;
          background: #f0fdf4;
          color: #16a34a;
        }
        #lp-import-progress .lp-step.lp-error {
          color: #dc2626;
        }
        #lp-import-progress .lp-step.lp-error .lp-step-icon {
          border-color: #fca5a5;
          background: #fef2f2;
          color: #dc2626;
        }
        @keyframes lp-spin {
          to { transform: rotate(360deg); }
        }
        #lp-import-progress .lp-actions {
          display: none;
          margin-top: 14px;
          gap: 8px;
        }
        #lp-import-progress.lp-error .lp-actions {
          display: flex;
          flex-wrap: wrap;
        }
        #lp-import-progress .lp-retry-btn {
          appearance: none;
          border: 1px solid #6366f1;
          background: #6366f1;
          color: #fff;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        #lp-import-progress .lp-retry-btn:hover {
          background: #4f46e5;
          border-color: #4f46e5;
        }
        #lp-import-progress .lp-dismiss-btn {
          appearance: none;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
      </style>
      <div class="lp-card" role="status" aria-live="polite">
        <div class="lp-brand">linkedinpost</div>
        <h2 class="lp-title">Importing LinkedIn profile</h2>
        <p class="lp-subtitle"></p>
        <div class="lp-spinner-row">
          <div class="lp-spinner" aria-hidden="true"></div>
          <span class="lp-status-label"></span>
        </div>
        <ol class="lp-steps"></ol>
        <div class="lp-actions">
          <button type="button" class="lp-retry-btn">Retry import</button>
          <button type="button" class="lp-dismiss-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    root.querySelector('.lp-retry-btn')?.addEventListener('click', () => {
      if (typeof retryHandler === 'function') {
        errorMessage = null;
        isError = false;
        retryHandler();
      }
    });

    root.querySelector('.lp-dismiss-btn')?.addEventListener('click', () => {
      window.lpImportProgress.hide();
    });

    renderSteps();
    return root;
  }

  function renderSteps() {
    if (!root) return;
    const list = root.querySelector('.lp-steps');
    list.innerHTML = STEPS.map(
      (step) =>
        `<li class="lp-step" data-step="${step.id}"><span class="lp-step-icon"></span><span class="lp-step-text">${step.label}</span></li>`,
    ).join('');
  }

  function stepMeta(stepId) {
    return STEPS.find((s) => s.id === stepId) ?? STEPS[0];
  }

  function paint() {
    if (!root || !currentStepId) return;

    const meta = stepMeta(currentStepId);
    const idx = STEP_INDEX[currentStepId] ?? 0;

    root.querySelector('.lp-subtitle').textContent = isError
      ? errorMessage ||
        'Something went wrong. Retry below or return to Settings.'
      : meta.hint;
    root.querySelector('.lp-status-label').textContent = isError
      ? 'Import failed'
      : `${meta.label}…`;

    root.classList.toggle('lp-done', currentStepId === 'done' && !isError);
    root.classList.toggle('lp-error', isError);

    root.querySelectorAll('.lp-step').forEach((el) => {
      const stepId = el.getAttribute('data-step');
      const stepIdx = STEP_INDEX[stepId] ?? -1;
      const icon = el.querySelector('.lp-step-icon');

      el.classList.remove('lp-active', 'lp-done', 'lp-error');

      if (isError && stepId === currentStepId) {
        el.classList.add('lp-error');
        icon.textContent = '!';
        return;
      }

      if (stepIdx < idx) {
        el.classList.add('lp-done');
        icon.textContent = '✓';
      } else if (stepId === currentStepId) {
        el.classList.add('lp-active');
        icon.textContent = '•';
      } else {
        icon.textContent = '';
      }
    });
  }

  window.lpImportProgress = {
    show(stepId) {
      currentStepId = stepId || 'checking';
      isError = false;
      errorMessage = null;
      ensureRoot();
      paint();
    },

    setRetryHandler(handler) {
      retryHandler = typeof handler === 'function' ? handler : null;
    },

    setStep(stepId) {
      if (isError) return;
      currentStepId = stepId;
      if (!root) ensureRoot();
      paint();
    },

    setError(message) {
      isError = true;
      errorMessage = message || null;
      if (!root) ensureRoot();
      root.querySelector('.lp-status-label').textContent = 'Import failed';
      root.classList.add('lp-error');
      paint();
    },

    hide() {
      root?.remove();
      root = null;
      currentStepId = null;
      isError = false;
      errorMessage = null;
      retryHandler = null;
    },
  };
})();
