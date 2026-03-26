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
    case 'tasks_assign':
      pageTitle.textContent = 'Task Assignment';
      renderTasksAssign();
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
          
          <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);" id="stats-container-${c.company_id}">
            <button class="btn load-stats-btn" data-id="${c.company_id}" style="padding: 4px 8px; font-size: 11px; margin-right: 8px; background: rgba(37, 99, 235, 0.2); color: var(--primary);">Load Realtime Stats</button>
            <span class="stats-text" id="stats-text-${c.company_id}" style="display: none;"></span>
          </div>

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

      document.querySelectorAll('.load-stats-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const target = e.target as HTMLButtonElement;
          const companyId = target.getAttribute('data-id');
          if (!companyId) return;
          
          const textSpan = document.getElementById('stats-text-' + companyId);
          if (!textSpan) return;

          target.textContent = 'Loading...';
          target.disabled = true;
          
          try {
            const [campData, contData] = await Promise.all([
              ApiService.getCampaigns(companyId),
              ApiService.getContent(companyId)
            ]);
            
            target.style.display = 'none';
            textSpan.style.display = 'inline-block';
            textSpan.innerHTML = `<strong>Campaigns:</strong> ${campData.total || 0} &nbsp;|&nbsp; <strong>Content Items:</strong> ${contData.total || 0}`;
          } catch (err: any) {
            target.textContent = 'Failed to load';
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

async function renderTasksAssign() {
  viewContainer.innerHTML = `<div class="empty-state">Loading companies...</div>`;
  try {
    const dbData = await ApiService.getCompanies();
    if (!dbData.companies || dbData.companies.length === 0) {
      viewContainer.innerHTML = `<div class="empty-state">No companies onboarded. Please onboard a company first to assign tasks.</div>`;
      return;
    }
    
    const optionsHtml = dbData.companies.map((c: any) => {
      const name = c.data.onboarding?.company_name || c.company_id;
      const desc = c.data.onboarding?.description || 'No description';
      const maxDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
      return `<option value="${c.company_id}" ${c.company_id === currentCompanyId ? 'selected' : ''}>${name} - ${maxDesc}</option>`;
    }).join('');

    viewContainer.innerHTML = `
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <h2 style="margin-bottom: 24px;">Assign Task to Company Agent</h2>
        <form id="assign-task-form">
          <div class="form-group">
            <label>Select Company *</label>
            <select id="task_company_id" required>
              <option value="" disabled>Select a company...</option>
              ${optionsHtml}
            </select>
          </div>
          
          <div class="form-group">
            <label>Task Title *</label>
            <input type="text" id="task_title" required placeholder="e.g. Write a blog post about AI">
          </div>
          
          <div class="form-group">
            <label>Task Description *</label>
            <textarea id="task_description" required rows="5" placeholder="Detailed instructions for the agent..."></textarea>
          </div>
          
          <div class="form-group">
            <label>Assign To Agent</label>
            <select id="task_agent" required>
              <option value="strategist">Strategist</option>
              <option value="planner">Planner</option>
              <option value="content_generator">Content Generator</option>
              <option value="designer">Designer</option>
              <option value="manager" selected>Manager</option>
            </select>
          </div>
          
          <button type="submit" class="btn" id="submit-task-btn" style="width: 100%; margin-top: 12px;">Assign Task</button>
        </form>
      </div>
    `;

    document.getElementById('assign-task-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-task-btn') as HTMLButtonElement;
      btn.textContent = 'Assigning...';
      btn.disabled = true;
      
      const companyId = (document.getElementById('task_company_id') as HTMLSelectElement).value;
      const payload = {
        title: (document.getElementById('task_title') as HTMLInputElement).value,
        description: (document.getElementById('task_description') as HTMLTextAreaElement).value,
        assigned_to: (document.getElementById('task_agent') as HTMLSelectElement).value,
      };

      try {
        const res = await ApiService.assignTask(companyId, payload);
        alert('Task successfully assigned! ID: ' + res.task_id);
        
        // Auto-switch context
        if (currentCompanyId !== companyId) {
            currentCompanyId = companyId;
            localStorage.setItem('company_id', currentCompanyId);
            updateStatusBadge();
        }
        navigateTo('logs');
      } catch (err: any) {
        alert('Error assigning task: ' + err.message);
        btn.textContent = 'Assign Task';
        btn.disabled = false;
      }
    });

  } catch(err: any) {
    viewContainer.innerHTML = `<div class="empty-state error">Failed to load assignment view: ${err.message}</div>`;
  }
}

async function renderCampaigns() {
  if (!currentCompanyId) {
    viewContainer.innerHTML = `<div class="empty-state">Please onboard a company first.</div>`;
    return;
  }
  
  viewContainer.innerHTML = `<div class="empty-state">Loading campaigns...</div>`;

  try {
    const data = await ApiService.getCampaigns(currentCompanyId);
    if (data.total === 0) {
      viewContainer.innerHTML = `<div class="empty-state">No campaigns found.</div>`;
      return;
    }

    let html = '';
    for (const c of data.campaigns) {
      const dbData = c.data || {};
      
      // Fetch content for this campaign to link
      let campaignContent: any[] = [];
      try {
        const cData = await ApiService.getCampaignContent(currentCompanyId, c.campaign_id);
        campaignContent = cData.content || [];
      } catch (e) {
        console.warn('Could not fetch content for campaign ' + c.campaign_id);
      }

      html += `
        <div class="card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="color: var(--primary); margin-bottom: 4px;">Campaign: ${dbData.theme ? 'Theme & Objectives' : c.campaign_id}</h2>
              <p style="color: var(--text-muted); font-size: 14px;">Period: ${dbData.start_date || '?'} to ${dbData.end_date || '?'} | Type: ${dbData.campaign_type || 'Unknown'}</p>
            </div>
            <div class="status-badge active" style="font-size: 12px;">Active</div>
          </div>
          
          ${dbData.theme ? `<div style="margin-top: 16px; padding: 12px; background: rgba(37,99,235,0.1); border-left: 3px solid var(--primary); border-radius: 4px;"><strong>Theme:</strong> ${dbData.theme}</div>` : ''}
          
          ${dbData.goals && dbData.goals.length > 0 ? `
            <div style="margin-top: 16px;">
              <h4 style="margin-bottom: 8px;">Goals</h4>
              <ul style="margin: 0; padding-left: 20px; color: var(--text-muted); font-size: 14px;">
                ${dbData.goals.map((g: string) => `<li style="margin-bottom: 4px;">${g}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="display: flex; gap: 24px; margin-top: 20px;">
            ${dbData.planner_notes ? `
              <div style="flex: 1; font-size: 13px; color: var(--text-muted); padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                <strong>Planner Notes:</strong><br/>${dbData.planner_notes}
              </div>
            ` : ''}
            ${dbData.strategist_notes ? `
              <div style="flex: 1; font-size: 13px; color: var(--text-muted); padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                <strong>Strategist Notes:</strong><br/>${dbData.strategist_notes}
              </div>
            ` : ''}
          </div>

          <h3 style="margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">Scheduled Posts & Content</h3>
          <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
            ${(dbData.post_slots || []).map((slot: any) => {
              // Try to find matching content
              const matchedContent = campaignContent.find(cc => cc.data?.task_id === slot.content_task_id || cc.content_id === slot.slot_id);
              
              return `
              <div style="background: var(--bg-panel); border: 1px solid var(--border-light); border-radius: 8px; padding: 16px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 12px; color: var(--text-main);">
                    ${slot.platform}
                  </span>
                  <span class="status-badge ${slot.status === 'planned' ? 'pending' : (slot.status === 'completed' ? 'active' : 'info')}" style="font-size: 10px;">
                    ${slot.status || 'unknown'}
                  </span>
                </div>
                
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: var(--text-main);">${slot.topic || 'No topic'}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                  <strong>Type:</strong> ${slot.post_type}<br/>
                  <strong>Date:</strong> ${slot.scheduled_datetime ? new Date(slot.scheduled_datetime).toLocaleString() : 'TBD'}<br/>
                  ${slot.product_id ? `<strong>Product:</strong> ${slot.product_id}` : ''}
                </div>
                
                <div style="font-size: 11px; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                  <em>"${slot.ideal_time_rationale || 'No rationale'}"</em>
                </div>

                ${slot.content_task_id ? `
                  <div style="margin-top: 12px; border-top: 1px dashed var(--border-light); padding-top: 12px;">
                    <button class="btn view-result-btn" data-task-id="${slot.content_task_id}" style="width: 100%; padding: 8px; font-size: 12px;">View Generation Task Result</button>
                    <div id="result-${slot.content_task_id}" style="display: none; margin-top: 8px; font-size: 12px; background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px; overflow-x: auto;"></div>
                  </div>
                ` : '<div style="font-size: 12px; color: var(--warning); text-align: center; margin-top: 12px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px;">Pending Generation</div>'}
                
                ${matchedContent ? `
                  <div style="margin-top: 8px; font-size: 12px; color: var(--success); text-align: center; padding: 4px; background: rgba(16, 185, 129, 0.1); border-radius: 4px;">✓ Content Available in DB</div>
                ` : ''}
              </div>
            `;
            }).join('')}
          </div>
        </div>
      `;
    }

    viewContainer.innerHTML = html;

    // Attach event listeners for the view result buttons
    document.querySelectorAll('.view-result-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.target as HTMLButtonElement;
        const taskId = target.getAttribute('data-task-id');
        if (!taskId) return;
        
        const resDiv = document.getElementById(`result-${taskId}`);
        if (!resDiv) return;

        if (resDiv.style.display === 'block') {
          resDiv.style.display = 'none';
          target.textContent = 'View Generation Task Result';
          return;
        }

        target.textContent = 'Loading...';
        try {
          const result = await ApiService.getTaskResult(taskId);
          resDiv.style.display = 'block';
          if (result && result.output_data) {
             resDiv.innerHTML = `<pre style="margin:0; white-space:pre-wrap; color:var(--text-main); font-family:monospace;">${JSON.stringify(result.output_data, null, 2)}</pre>`;
          } else {
             resDiv.innerHTML = `<span style="color: var(--warning);">Task hasn't completed or no output found yet.</span>`;
          }
        } catch (err: any) {
          resDiv.style.display = 'block';
          resDiv.innerHTML = `<span style="color: var(--error);">Error: ${err.message}</span>`;
        }
        target.textContent = 'Hide Task Result';
      });
    });

  } catch (err: any) {
    viewContainer.innerHTML = `<div class="empty-state error">Failed to load campaigns: ${err.message}</div>`;
  }
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
