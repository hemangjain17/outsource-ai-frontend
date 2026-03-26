import './style.css';
import { ApiService, type TaskLog } from './api';

// State
let currentCompanyId: string | null = localStorage.getItem('company_id');
let currentRoute = 'dashboard';

// DOM Elements
const viewContainer = document.getElementById('view-container')!;
const pageTitle = document.getElementById('page-title')!;
const navLinks = document.querySelectorAll('.nav-link');
const statusBadge = document.getElementById('company-status')!;

// Init
function init() {
  updateStatusBadge();
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = (e.target as HTMLElement).getAttribute('data-route');
      if (route) navigateTo(route);
    });
  });

  // initial load
  navigateTo(currentRoute);
}

function updateStatusBadge() {
  if (currentCompanyId) {
    statusBadge.textContent = 'ACTIVE';
    statusBadge.className = 'status-badge active';
  } else {
    statusBadge.textContent = 'NO COMPANY';
    statusBadge.className = 'status-badge error';
  }
}

function navigateTo(route: string) {
  currentRoute = route;
  
  // Update Nav
  navLinks.forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Render View
  switch(route) {
    case 'dashboard':
      pageTitle.textContent = 'Overview';
      renderDashboard();
      break;
    case 'onboard':
      pageTitle.textContent = 'Onboarding';
      renderOnboarding();
      break;
    case 'campaigns':
      pageTitle.textContent = 'Campaigns';
      renderCampaigns();
      break;
    case 'logs':
      pageTitle.textContent = 'Pipeline Logs';
      renderLogs();
      break;
  }
}

// Views
async function renderDashboard() {
  if (!currentCompanyId) {
    viewContainer.innerHTML = `
      <div class="empty-state">
        <h2>Welcome to Outsource AI</h2>
        <p>You need to onboard a company first.</p>
        <button class="btn" style="margin-top:20px;" id="go-onboard-btn">Go to Onboarding</button>
      </div>
    `;
    document.getElementById('go-onboard-btn')?.addEventListener('click', () => navigateTo('onboard'));
    return;
  }

  viewContainer.innerHTML = `<div class="empty-state">Loading dashboard data...</div>`;
  
  try {
    const campaignsData = await ApiService.getCampaigns(currentCompanyId);
    const contentData = await ApiService.getContent(currentCompanyId);

    viewContainer.innerHTML = `
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-label">Total Campaigns</div>
          <div class="stat-value">${campaignsData.total || 0}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Generated Content</div>
          <div class="stat-value">${contentData.total || 0}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Company ID</div>
          <div class="stat-value" style="font-size: 16px; word-break: break-all; margin-top:20px;">${currentCompanyId}</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <h2>Quick Actions</h2>
        <p style="color: var(--text-muted); margin-bottom: 16px;">Trigger a new strategy cycle manually.</p>
        <button class="btn" id="trigger-campaign-btn">Trigger New Campaign</button>
      </div>

      <div class="card">
        <h2>Latest Content</h2>
        <div class="log-stream" style="margin-top:16px;">
          ${contentData.content && contentData.content.length > 0 ? 
            contentData.content.slice(0,5).map((c: any) => `
              <div class="log-entry state_change">
                <div class="log-content">
                  <div class="log-agent">Content</div>
                  <div class="log-message">Content ID: ${c.content_id}</div>
                </div>
              </div>
            `).join('') : '<p class="text-muted">No content generated yet.</p>'
          }
        </div>
      </div>
    `;

    document.getElementById('trigger-campaign-btn')?.addEventListener('click', async () => {
      try {
        const btn = document.getElementById('trigger-campaign-btn') as HTMLButtonElement;
        btn.textContent = 'Triggering...';
        btn.disabled = true;
        await ApiService.triggerCampaign(currentCompanyId!, "Manual trigger from UI");
        alert('Campaign cycle started!');
        btn.textContent = 'Trigger New Campaign';
        btn.disabled = false;
        navigateTo('logs'); // go see the logs
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    });

  } catch (err: any) {
    viewContainer.innerHTML = `<div class="empty-state error">Failed to load dashboard: ${err.message}</div>`;
  }
}

function renderOnboarding() {
  viewContainer.innerHTML = `
    <div class="tabs-container" style="max-width: 800px; margin: 0 auto;">
      <div class="tabs-header" style="display: flex; gap: 16px; margin-bottom: 24px;">
        <button class="btn tab-btn active" id="tab-new" style="flex: 1;">New Company Form</button>
        <button class="btn tab-btn" id="tab-list" style="flex: 1; background: var(--bg-card); color: var(--text-muted);">Company List</button>
      </div>

      <div id="tab-content-new" class="card tab-content">
        <h2 style="margin-bottom: 24px;">Onboard Your Company</h2>
        <form id="onboard-form">
          <div class="form-group">
            <label>Company Name *</label>
            <input type="text" id="company_name" required placeholder="e.g. Acme Corp">
          </div>
          <div class="form-group">
            <label>Description *</label>
            <textarea id="description" required rows="4" placeholder="What does your company do?"></textarea>
          </div>
          <div class="form-group">
            <label>Website URL</label>
            <input type="url" id="website" placeholder="https://example.com">
          </div>
          <div class="form-group">
            <label>LinkedIn URL</label>
            <input type="url" id="linkedin" placeholder="https://linkedin.com/company/acme">
          </div>
          <div class="form-group">
            <label>Twitter Handle (wihtout @)</label>
            <input type="text" id="twitter" placeholder="acmecorp">
          </div>
          <button type="submit" class="btn" id="submit-onboard" style="width: 100%;">Start Agentic Pipeline</button>
        </form>
      </div>

      <div id="tab-content-list" class="card tab-content" style="display: none;">
        <h2 style="margin-bottom: 24px;">Company Database</h2>
        <div id="companies-list"><div class="empty-state">Loading companies...</div></div>
      </div>
    </div>
  `;

  document.getElementById('tab-new')?.addEventListener('click', () => {
    document.getElementById('tab-content-new')!.style.display = 'block';
    document.getElementById('tab-content-list')!.style.display = 'none';
    const btnNew = document.getElementById('tab-new')!;
    const btnList = document.getElementById('tab-list')!;
    btnNew.style.background = 'var(--primary)';
    btnNew.style.color = 'white';
    btnList.style.background = 'var(--bg-card)';
    btnList.style.color = 'var(--text-muted)';
  });

  document.getElementById('tab-list')?.addEventListener('click', async () => {
    document.getElementById('tab-content-new')!.style.display = 'none';
    document.getElementById('tab-content-list')!.style.display = 'block';
    const btnNew = document.getElementById('tab-new')!;
    const btnList = document.getElementById('tab-list')!;
    btnList.style.background = 'var(--primary)';
    btnList.style.color = 'white';
    btnNew.style.background = 'var(--bg-card)';
    btnNew.style.color = 'var(--text-muted)';
    
    // Fetch and render list
    const listContainer = document.getElementById('companies-list')!;
    listContainer.innerHTML = '<div class="empty-state">Loading companies...</div>';
    try {
      const dbData = await ApiService.getCompanies();
      if (!dbData.companies || dbData.companies.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">No companies onboarded yet.</div>';
        return;
      }
      
      listContainer.innerHTML = dbData.companies.map((c: any) => `
        <div style="padding: 16px; border-bottom: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <strong style="color: var(--text-main); font-size: 16px;">${c.data.onboarding?.company_name || 'Unknown Company'}</strong>
            <span style="color: var(--text-muted); font-size: 12px;">Added: ${new Date(c.created_at).toLocaleString()}</span>
          </div>
          <div style="font-size: 14px; color: var(--text-muted);">${c.data.onboarding?.description || 'No description provided.'}</div>
          <div style="font-size: 12px; margin-top: 4px;">ID: <code>${c.company_id}</code></div>
          <div style="margin-top: 8px;">
            <button class="btn switch-btn" data-id="${c.company_id}" style="padding: 6px 12px; font-size: 12px;">Select Profile Context</button>
          </div>
        </div>
      `).join('');
      
      document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetId = (e.target as HTMLButtonElement).getAttribute('data-id');
          if (targetId) {
            currentCompanyId = targetId;
            localStorage.setItem('company_id', currentCompanyId);
            updateStatusBadge();
            alert('Switched active company context to: ' + targetId);
          }
        });
      });
      
    } catch (err: any) {
      listContainer.innerHTML = `<div class="empty-state error">Failed to load companies: ${err.message}</div>`;
    }
  });

  document.getElementById('onboard-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-onboard') as HTMLButtonElement;
    btn.textContent = 'Processing...';
    btn.disabled = true;

    const payload = {
      company_name: (document.getElementById('company_name') as HTMLInputElement).value,
      description: (document.getElementById('description') as HTMLTextAreaElement).value,
      website: (document.getElementById('website') as HTMLInputElement).value || undefined,
      linkedin_url: (document.getElementById('linkedin') as HTMLInputElement).value || undefined,
      twitter_handle: (document.getElementById('twitter') as HTMLInputElement).value || undefined,
    };

    try {
      const res = await ApiService.onboardCompany(payload);
      currentCompanyId = res.company_id;
      localStorage.setItem('company_id', currentCompanyId);
      updateStatusBadge();
      alert('Onboarding started! The agents are now working.');
      navigateTo('logs');
    } catch (err: any) {
      alert('Error: ' + err.message);
      btn.textContent = 'Start Agentic Pipeline';
      btn.disabled = false;
    }
  });
}

function renderCampaigns() {
  if (!currentCompanyId) {
    viewContainer.innerHTML = `<div class="empty-state">Please onboard a company first.</div>`;
    return;
  }
  
  viewContainer.innerHTML = `<div class="empty-state">Loading campaigns...</div>`;

  ApiService.getCampaigns(currentCompanyId).then(data => {
    if (data.total === 0) {
      viewContainer.innerHTML = `<div class="empty-state">No campaigns found.</div>`;
      return;
    }

    const html = data.campaigns.map((c: any) => `
      <div class="card" style="margin-bottom: 20px;">
        <h3>Campaign ID: ${c.campaign_id}</h3>
        <p style="color: var(--text-muted); margin-top: 8px;">Created: ${new Date(c.created_at).toLocaleString()}</p>
        <div style="margin-top: 16px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; max-height: 200px; overflow-y: auto;">
          <pre style="margin: 0; font-size: 12px; color: var(--text-main); white-space: pre-wrap;">${JSON.stringify(c.data, null, 2)}</pre>
        </div>
      </div>
    `).join('');

    viewContainer.innerHTML = html;
  }).catch(err => {
    viewContainer.innerHTML = `<div class="empty-state error">Failed to load campaigns: ${err.message}</div>`;
  });
}

let logPollInterval: any = null;

function renderLogs() {
  if (logPollInterval) clearInterval(logPollInterval);
  
  if (!currentCompanyId) {
    viewContainer.innerHTML = `<div class="empty-state">Please onboard a company first.</div>`;
    return;
  }

  viewContainer.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Live Agent Activity</h2>
        <div class="status-badge active">Polling Live...</div>
      </div>
    </div>
    <div id="logs-container" class="log-stream"></div>
  `;

  const fetchLogs = async () => {
    try {
      const data = await ApiService.getTaskLogs(currentCompanyId!);
      const container = document.getElementById('logs-container');
      if (!container) return;

      if (data.total === 0) {
        container.innerHTML = `<div class="empty-state">No activity logs yet. The agents might be sleeping.</div>`;
        return;
      }

      container.innerHTML = data.logs.map((log: TaskLog) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `
          <div class="log-entry ${log.event}">
            <div class="log-time">${time}</div>
            <div class="log-content">
              ${log.agent ? `<div class="log-agent">${log.agent}</div>` : ''}
              <div class="log-message">
                <strong>[${log.event.toUpperCase()}]</strong> ${log.message} 
                ${log.new_status ? `<span style="color: var(--text-muted); margin-left: 8px;">→ ${log.new_status.toUpperCase()}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  fetchLogs();
  logPollInterval = setInterval(fetchLogs, 3000);
}

// Custom route change cleanup
const originalNavigateTo = navigateTo;
// @ts-ignore
window.navigateTo = function(route: string) {
  if (logPollInterval) {
    clearInterval(logPollInterval);
    logPollInterval = null;
  }
  originalNavigateTo(route);
};

init();
