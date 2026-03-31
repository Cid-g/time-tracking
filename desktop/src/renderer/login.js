// ── DOM Elements ──
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const btnLogin = document.getElementById('btn-login');
const btnLoginText = document.getElementById('btn-login-text');
const btnLoginLoading = document.getElementById('btn-login-loading');

// Dashboard
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const userAvatarEl = document.getElementById('user-avatar');
const timerDisplay = document.getElementById('timer-display');
const timerBar = document.getElementById('timer-bar');
const timerBarStatus = document.getElementById('timer-bar-status');
const timerStatusText = document.getElementById('timer-status-text');
const timerBarMeta = document.getElementById('timer-bar-meta');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnStop = document.getElementById('btn-stop');
const btnLogout = document.getElementById('btn-logout');

// Task inputs
const taskInputs = document.getElementById('task-inputs');
const descriptionInput = document.getElementById('description');
const projectTrigger = document.getElementById('project-trigger');
const projectDot = document.getElementById('project-dot');
const projectLabel = document.getElementById('project-label');
const projectMenu = document.getElementById('project-menu');
const taskTrigger = document.getElementById('task-trigger');
const taskDot = document.getElementById('task-dot');
const taskLabel = document.getElementById('task-label');
const taskMenu = document.getElementById('task-menu');

// Active info
const activeInfo = document.getElementById('active-info');
const activeDescription = document.getElementById('active-description');
const activeMeta = document.getElementById('active-meta');

// Activity monitor
const activitySection = document.getElementById('activity-section');
const activityStatus = document.getElementById('activity-status');
const mouseActivity = document.getElementById('mouse-activity');
const mouseValue = document.getElementById('mouse-value');
const keyboardActivity = document.getElementById('keyboard-activity');
const keyboardValue = document.getElementById('keyboard-value');
const currentAppName = document.getElementById('current-app-name');

// Title bar
document.getElementById('btn-minimize').addEventListener('click', () => window.electronAPI.hideWindow());
document.getElementById('btn-close').addEventListener('click', () => window.electronAPI.hideWindow());

// ── State ──
let activeEntry = null;
let timerInterval = null;
let syncInterval = null;
let projects = [];
let tasks = [];
let selectedProjectId = null;
let selectedTaskId = null;
let cleanupLiveStats = null; // Cleanup function for live stats listener

// ── Helpers ──
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function calculateElapsed(entry) {
  if (!entry || !entry.startTime) return 0;
  const start = new Date(entry.startTime).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);
  const breakDuration = entry.totalBreakDuration || 0;
  return Math.max(0, elapsed - breakDuration);
}

function showView(view) {
  loginView.classList.remove('active');
  dashboardView.classList.remove('active');
  view.classList.add('active');
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}

function setLoading(loading) {
  btnLogin.disabled = loading;
  btnLoginText.classList.toggle('hidden', loading);
  btnLoginLoading.classList.toggle('hidden', !loading);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Dropdown Logic ──
document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#project-dropdown')) projectMenu.classList.add('hidden');
  if (!e.target.closest('#task-dropdown')) taskMenu.classList.add('hidden');
});

async function loadProjects() {
  const result = await window.electronAPI.getProjects();
  if (result.success) {
    projects = result.data?.data?.projects || result.data?.projects || [];
  } else {
    projects = [];
  }
  renderProjectMenu();
}

async function loadTasks(projectId) {
  if (!projectId) {
    tasks = [];
    selectedTaskId = null;
    updateTaskTrigger();
    renderTaskMenu();
    taskTrigger.disabled = true;
    return;
  }

  taskTrigger.disabled = false;
  const result = await window.electronAPI.getTasksByProject(projectId);
  if (result.success) {
    tasks = result.data?.data?.tasks || result.data?.tasks || [];
  } else {
    tasks = [];
  }
  renderTaskMenu();
}

function renderProjectMenu() {
  projectMenu.innerHTML = '';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'dropdown-item clear';
  clearBtn.textContent = 'No project';
  clearBtn.addEventListener('click', () => {
    selectProject(null);
    projectMenu.classList.add('hidden');
  });
  projectMenu.appendChild(clearBtn);

  if (projects.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.textContent = 'No projects available';
    projectMenu.appendChild(empty);
    return;
  }

  projects.forEach((p) => {
    const btn = document.createElement('button');
    btn.className = `dropdown-item${selectedProjectId === p._id ? ' selected' : ''}`;
    btn.innerHTML = `<span class="item-dot" style="background:${p.color || '#7c3aed'}"></span>${escapeHtml(p.name)}`;
    btn.addEventListener('click', () => {
      selectProject(p);
      projectMenu.classList.add('hidden');
    });
    projectMenu.appendChild(btn);
  });
}

function renderTaskMenu() {
  taskMenu.innerHTML = '';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'dropdown-item clear';
  clearBtn.textContent = 'No task';
  clearBtn.addEventListener('click', () => {
    selectTask(null);
    taskMenu.classList.add('hidden');
  });
  taskMenu.appendChild(clearBtn);

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.textContent = selectedProjectId ? 'No tasks in project' : 'Select a project first';
    taskMenu.appendChild(empty);
    return;
  }

  tasks.forEach((t) => {
    const priorityClass = `priority-${t.priority || 'medium'}`;
    const btn = document.createElement('button');
    btn.className = `dropdown-item${selectedTaskId === t._id ? ' selected' : ''}`;
    btn.innerHTML = `<span class="item-dot ${priorityClass}"></span>${escapeHtml(t.title)}`;
    btn.addEventListener('click', () => {
      selectTask(t);
      taskMenu.classList.add('hidden');
    });
    taskMenu.appendChild(btn);
  });
}

function selectProject(project) {
  selectedProjectId = project?._id || null;
  selectedTaskId = null;
  updateProjectTrigger(project);
  updateTaskTrigger(null);
  loadTasks(selectedProjectId);
}

function selectTask(task) {
  selectedTaskId = task?._id || null;
  updateTaskTrigger(task);
}

function updateProjectTrigger(project) {
  if (project) {
    projectDot.style.background = project.color || '#7c3aed';
    projectLabel.textContent = project.name;
    projectTrigger.classList.add('has-value');
  } else {
    projectDot.style.background = '#d1d1d6';
    projectLabel.textContent = 'Select Project';
    projectTrigger.classList.remove('has-value');
  }
}

function updateTaskTrigger(task) {
  if (task) {
    const colors = { low: '#94a3b8', medium: '#7c3aed', high: '#f59e0b', urgent: '#ef4444' };
    taskDot.style.background = colors[task.priority] || '#7c3aed';
    taskLabel.textContent = task.title;
    taskTrigger.classList.add('has-value');
  } else {
    taskDot.style.background = '#d1d1d6';
    taskLabel.textContent = 'Select Task';
    taskTrigger.classList.remove('has-value');
  }
}

projectTrigger.addEventListener('click', () => {
  taskMenu.classList.add('hidden');
  projectMenu.classList.toggle('hidden');
});

taskTrigger.addEventListener('click', () => {
  if (taskTrigger.disabled) return;
  projectMenu.classList.add('hidden');
  taskMenu.classList.toggle('hidden');
});

// ── Timer Bar + UI ──
function updateTimerUI(entry) {
  activeEntry = entry;
  clearInterval(timerInterval);

  if (!entry || entry.status === 'completed') {
    // No active timer
    timerDisplay.textContent = '00:00:00';
    timerBar.className = 'timer-bar idle';
    timerStatusText.textContent = 'No active timer';
    timerBarMeta.textContent = '';
    taskInputs.classList.remove('hidden');
    activeInfo.classList.add('hidden');
    btnStart.classList.remove('hidden');
    btnPause.classList.add('hidden');
    btnResume.classList.add('hidden');
    btnStop.classList.add('hidden');
    updateActivityUI(false);
    return;
  }

  // Active timer — hide inputs, show info
  taskInputs.classList.add('hidden');
  btnStart.classList.add('hidden');

  // Show active entry info
  showActiveInfo(entry);

  // Update timer bar meta
  updateTimerBarMeta(entry);

  if (entry.status === 'running') {
    timerBar.className = 'timer-bar running';
    timerStatusText.textContent = 'Tracking';
    btnPause.classList.remove('hidden');
    btnResume.classList.add('hidden');
    btnStop.classList.remove('hidden');
    updateActivityUI(true);

    timerInterval = setInterval(() => {
      timerDisplay.textContent = formatDuration(calculateElapsed(entry));
    }, 1000);
    timerDisplay.textContent = formatDuration(calculateElapsed(entry));
  } else if (entry.status === 'paused') {
    timerBar.className = 'timer-bar paused';
    timerStatusText.textContent = 'Paused';
    btnPause.classList.add('hidden');
    btnResume.classList.remove('hidden');
    btnStop.classList.remove('hidden');
    timerDisplay.textContent = formatDuration(calculateElapsed(entry));
    updateActivityUI(false);
  }
}

function updateTimerBarMeta(entry) {
  let meta = '';
  if (entry.project) {
    const pName = typeof entry.project === 'object' ? entry.project.name : '';
    if (pName) meta += pName;
  }
  if (entry.task) {
    const tTitle = typeof entry.task === 'object' ? entry.task.title : '';
    if (tTitle) {
      if (meta) meta += ' / ';
      meta += tTitle;
    }
  }
  if (entry.description && !meta) {
    meta = entry.description;
  }
  timerBarMeta.textContent = meta;
}

function showActiveInfo(entry) {
  let hasContent = false;

  if (entry.description) {
    activeDescription.textContent = entry.description;
    hasContent = true;
  } else {
    activeDescription.textContent = '';
  }

  let metaHtml = '';
  if (entry.project) {
    const pName = typeof entry.project === 'object' ? entry.project.name : '';
    const pColor = typeof entry.project === 'object' ? (entry.project.color || '#7c3aed') : '#7c3aed';
    if (pName) {
      metaHtml += `<span class="meta-dot" style="background:${pColor}"></span>${escapeHtml(pName)}`;
      hasContent = true;
    }
  }
  if (entry.task) {
    const tTitle = typeof entry.task === 'object' ? entry.task.title : '';
    if (tTitle) {
      if (metaHtml) metaHtml += `<span class="meta-separator">/</span>`;
      metaHtml += escapeHtml(tTitle);
      hasContent = true;
    }
  }
  activeMeta.innerHTML = metaHtml;

  if (hasContent) {
    activeInfo.classList.remove('hidden');
  } else {
    activeInfo.classList.add('hidden');
  }
}

function updateActivityUI(isActive) {
  if (isActive) {
    activityStatus.textContent = 'Monitoring';
    activityStatus.className = 'activity-status active';
    startLiveStatsListener();
  } else {
    activityStatus.textContent = 'Idle';
    activityStatus.className = 'activity-status';
    mouseActivity.style.width = '0%';
    mouseValue.textContent = '0%';
    keyboardActivity.style.width = '0%';
    keyboardValue.textContent = '0%';
    currentAppName.textContent = 'No app detected';
    stopLiveStatsListener();
  }
}

// ── Live Activity Stats from Main Process ──
function startLiveStatsListener() {
  if (cleanupLiveStats) return; // Already listening
  cleanupLiveStats = window.electronAPI.onLiveStats((stats) => {
    if (!stats) return;
    mouseActivity.style.width = `${stats.mouseActivity}%`;
    mouseValue.textContent = `${stats.mouseActivity}%`;
    keyboardActivity.style.width = `${stats.keyboardActivity}%`;
    keyboardValue.textContent = `${stats.keyboardActivity}%`;
    currentAppName.textContent = stats.currentApp || 'No app detected';

    // Update status badge if idle
    if (stats.isIdle) {
      activityStatus.textContent = 'Idle';
      activityStatus.className = 'activity-status idle-warning';
    } else {
      activityStatus.textContent = 'Monitoring';
      activityStatus.className = 'activity-status active';
    }
  });
}

function stopLiveStatsListener() {
  if (cleanupLiveStats) {
    cleanupLiveStats();
    cleanupLiveStats = null;
  }
}

function showDashboard(user) {
  userNameEl.textContent = `${user.firstName} ${user.lastName}`;
  userRoleEl.textContent = user.role;
  userAvatarEl.textContent = user.firstName[0].toUpperCase();
  showView(dashboardView);
  loadProjects();
  startSyncPolling();
}

// ── Cross-device Sync Polling ──
function startSyncPolling() {
  stopSyncPolling();
  syncInterval = setInterval(async () => {
    try {
      const result = await window.electronAPI.getActiveTimer();
      const serverEntry = result.data?.data?.entry || result.data?.entry || null;

      const localId = activeEntry?._id;
      const serverId = serverEntry?._id;
      const localStatus = activeEntry?.status;
      const serverStatus = serverEntry?.status;
      const localBreaks = activeEntry?.breaks?.length || 0;
      const serverBreaks = serverEntry?.breaks?.length || 0;

      const changed =
        localId !== serverId ||
        localStatus !== serverStatus ||
        localBreaks !== serverBreaks;

      if (changed) {
        updateTimerUI(serverEntry);
      }
    } catch {
      // Network error — keep current state
    }
  }, 5000);
}

function stopSyncPolling() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ── Login ──
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  setLoading(true);

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const result = await window.electronAPI.login(email, password);
  setLoading(false);

  if (result.success) {
    showDashboard(result.data.user);

    const timerResult = await window.electronAPI.getActiveTimer();
    const entry = timerResult.data?.data?.entry || timerResult.data?.entry;
    if (timerResult.success && entry) {
      updateTimerUI(entry);
    }
  } else {
    showError(result.message || 'Login failed');
  }
});

// ── Timer Controls ──
btnStart.addEventListener('click', async () => {
  btnStart.disabled = true;
  const data = {};
  const desc = descriptionInput.value.trim();
  if (desc) data.description = desc;
  if (selectedProjectId) data.project = selectedProjectId;
  if (selectedTaskId) data.task = selectedTaskId;

  const result = await window.electronAPI.startTimer(data);
  btnStart.disabled = false;

  if (result.success) {
    const entry = result.data?.data?.entry || result.data?.entry;
    updateTimerUI(entry);
    descriptionInput.value = '';
    selectProject(null);
  }
});

descriptionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    btnStart.click();
  }
});

btnPause.addEventListener('click', async () => {
  if (!activeEntry) return;
  btnPause.disabled = true;
  const result = await window.electronAPI.pauseTimer(activeEntry._id);
  btnPause.disabled = false;
  if (result.success) {
    const entry = result.data?.data?.entry || result.data?.entry;
    updateTimerUI(entry);
  }
});

btnResume.addEventListener('click', async () => {
  if (!activeEntry) return;
  btnResume.disabled = true;
  const result = await window.electronAPI.resumeTimer(activeEntry._id);
  btnResume.disabled = false;
  if (result.success) {
    const entry = result.data?.data?.entry || result.data?.entry;
    updateTimerUI(entry);
  }
});

btnStop.addEventListener('click', async () => {
  if (!activeEntry) return;
  btnStop.disabled = true;
  const result = await window.electronAPI.stopTimer(activeEntry._id);
  btnStop.disabled = false;
  if (result.success) {
    updateTimerUI(null);
  }
});

// ── Logout ──
btnLogout.addEventListener('click', async () => {
  await window.electronAPI.logout();
  activeEntry = null;
  clearInterval(timerInterval);
  stopSyncPolling();
  stopLiveStatsListener();
  timerDisplay.textContent = '00:00:00';
  passwordInput.value = '';
  descriptionInput.value = '';
  selectedProjectId = null;
  selectedTaskId = null;
  projects = [];
  tasks = [];
  showView(loginView);
});

// ── Init: Check if already logged in ──
(async () => {
  const loggedIn = await window.electronAPI.isLoggedIn();
  if (loggedIn) {
    const user = await window.electronAPI.getUser();
    if (user) {
      showDashboard(user);
      const timerResult = await window.electronAPI.getActiveTimer();
      const entry = timerResult.data?.data?.entry || timerResult.data?.entry;
      if (timerResult.success && entry) {
        updateTimerUI(entry);
      }
    }
  }
})();
