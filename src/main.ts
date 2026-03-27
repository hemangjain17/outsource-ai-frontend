import './style.css';
import { ApiService, type TaskLog } from './api';

function formatContentData(data: any): string {
  if (!data || Object.keys(data).length === 0) return '<div class="text-muted">No details available</div>';

  // Standard fields for Content Generator
  const hasContentFields = data.title || data.body || data.cta;
  // Standard fields for Designer
  const hasDesignFields = data.design_url || data.design_brief;

  if (hasContentFields) {
    return `
      <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-family: var(--font-body, Inter, sans-serif);">
        ${data.title ? `<div><strong style="color: var(--primary);">Title:</strong> <span style="color: var(--text-main); font-weight: 500;">${data.title}</span></div>` : ''}
        ${data.status ? `<div><strong>Status:</strong> <span class="status-badge ${data.status === 'completed' || data.status === 'approved' ? 'active' : 'pending'}" style="font-size: 11px;">${data.status.replace('_', ' ')}</span></div>` : ''}
        ${data.content_type ? `<div><strong>Content Type:</strong> <span style="text-transform: capitalize;">${data.content_type.replace('_', ' ')}</span></div>` : ''}
        ${data.body ? `<div><strong style="display: block; margin-bottom: 4px;">Body:</strong>
          <div style="white-space: pre-wrap; font-family: inherit; padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; color: var(--text-main); font-size: 14px; line-height: 1.5;">${data.body}</div>
        </div>` : ''}
        ${data.cta ? `<div><strong>CTA:</strong> <em style="color: var(--text-main);">${data.cta}</em></div>` : ''}
        ${data.hashtags && data.hashtags.length > 0 ? `<div><strong>Hashtags:</strong> <span style="color: var(--primary);">${data.hashtags.map((h: string) => '#' + h.replace('#', '')).join(' ')}</span></div>` : ''}
        
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 4px;">
          ${data.content_id ? `<span><strong>Content ID:</strong> <code>${data.content_id}</code></span>` : ''}
          ${data.slot_id ? `<span><strong>Slot ID:</strong> <code>${data.slot_id}</code></span>` : ''}
        </div>
      </div>
    `;
  }

  if (hasDesignFields) {
    return `
      <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-family: var(--font-body, Inter, sans-serif);">
        ${data.design_url ? `<div><strong style="color: var(--primary);">Design Asset:</strong> <a href="${data.design_url}" target="_blank" style="color: var(--primary); font-size: 13px; text-decoration: underline;">Open Figma Design</a></div>` : ''}
        ${data.design_brief ? `<div><strong style="display: block; margin-bottom: 4px;">Visual Brief:</strong>
          <div style="padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; font-size: 13px; color: var(--text-muted); line-height: 1.4;">
            ${data.design_brief.mood ? `<strong>Mood:</strong> ${data.design_brief.mood}<br/>` : ''}
            ${data.design_brief.description ? `<span>${data.design_brief.description}</span>` : ''}
          </div>
        </div>` : ''}
      </div>
    `;
  }

  // Fallback to raw JSON dump formatted nicely
  return `<pre style="margin:0; font-size: 11px; white-space: pre-wrap; color: var(--text-muted); padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">${JSON.stringify(data, null, 2)}</pre>`;
}

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

  // ── Theme Toggle ──────────────────────────────────────────
  const themeBtn = document.getElementById('theme-toggle-btn') as HTMLButtonElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeBtn.textContent = '☀️';
  } else {
    themeBtn.textContent = '🌙';
  }
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
  // ─────────────────────────────────────────────────────────

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
  switch (route) {
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
        contentData.content.slice(0, 5).map((c: any) => `
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

  } catch (err: any) {
    viewContainer.innerHTML = `<div class="empty-state error">Failed to load assignment view: ${err.message}</div>`;
  }
}

async function renderCampaigns() {
  // ── Dummy Campaign Data ────────────────────────────────────────────────────
  const DUMMY_CAMPAIGNS = [
    {
      id: '9d59b843-f6df-468e',
      theme: 'Developer Empowerment & AI-First Products',
      status: 'active',
      start_date: '2026-04-01',
      end_date: '2026-04-30',
      campaign_type: 'Brand Awareness',
      goals: [
        'Increase developer sign-ups by 30% via organic LinkedIn reach',
        'Establish thought leadership in the AI API space',
        'Drive 500+ unique visitors to the API documentation',
      ],
      planner_notes: 'Focus on developer success stories and practical tutorials. Schedule posts during peak dev hours (9–11am, 5–7pm). Avoid product-heavy CTA on the first touchpoint.',
      strategist_notes: 'Competitor analysis shows a gap in authentic storytelling. Position OpenAI as the partner of individual developers, not just enterprises. Hashtag strategy: blend trending AI tags with niche developer community tags.',
      posts: [
        {
          id: 'li-001',
          platform: 'LinkedIn',
          platform_icon: '💼',
          topic: 'Developer Spotlight: AI-Powered Legal Document Analyser',
          post_type: 'Storytelling',
          scheduled: 'Apr 3, 2026 · 10:00 AM',
          status: 'approved',
          title: 'How One Developer Built an AI-Powered Legal Document Analyzer in 6 Weeks',
          body: `When we talk about what's possible with the OpenAI API, stories like Sarah's really bring it to life.\n\nSarah Chen, a solo developer and former paralegal, wanted to help her old law firm manage thousands of contracts more efficiently. With no ML team and a tight timeline, she turned to the OpenAI API.\n\nUsing GPT-4 via the API, she built ContractIQ — a tool that extracts key clauses, flags risky language, and summarizes dense legal documents in seconds.\n\n"The integration was surprisingly straightforward," Sarah shared. "Within a week, I had a working prototype."\n\nThe result: 80% reduction in manual document review time for the firm, and Sarah now serves 12 more firms as a paying customer.\n\n#OpenAI #DeveloperSpotlight #AIApps #GPT4 #Startup`,
          cta: 'What would you build if you had access to state-of-the-art language AI?',
          hashtags: ['OpenAI', 'DeveloperSpotlight', 'AIApps', 'GPT4', 'Startup'],
          media: '/ai_developer_sleek.png',
        },
        {
          id: 'tw-001',
          platform: 'Twitter/X',
          platform_icon: '🐦',
          topic: 'API Tip: Function Calling for Structured Outputs',
          post_type: 'Educational Thread',
          scheduled: 'Apr 5, 2026 · 9:30 AM',
          status: 'scheduled',
          title: '🧵 Thread: The one GPT-4 feature that changed how I build apps',
          body: `1/ The one GPT-4 feature that changed how I build apps? Function calling.\n\nHere's a quick breakdown 👇\n\n2/ Instead of parsing messy text output, you define structured functions. The model returns clean JSON every time.\n\n3/ Example: Ask the model to extract invoice data → get back {vendor, amount, date} — no regex needed.\n\n4/ This powers everything from booking bots to medical intake forms. The model does the heavy lifting.\n\n5/ If you haven't tried function calling yet, the OpenAI docs have a great quickstart. Link in bio. 🚀\n\n#OpenAI #LLM #DeveloperTips #AI #GPT4`,
          cta: 'Have you tried function calling in your projects? Drop your use case below 👇',
          hashtags: ['OpenAI', 'LLM', 'DeveloperTips', 'AI', 'GPT4'],
          media: '/ai_nodes_abstract.png',
        },
        {
          id: 'bl-001',
          platform: 'Blog / Medium',
          platform_icon: '✍️',
          topic: 'Building a Production-Ready RAG System in 2026',
          post_type: 'Technical Deep-Dive',
          scheduled: 'Apr 10, 2026 · 8:00 AM',
          status: 'draft',
          title: 'Building a Production-Ready RAG Pipeline with the OpenAI API: A Complete Guide',
          body: `Retrieval-Augmented Generation (RAG) has moved from research prototype to production standard in under two years. In this guide, we'll walk through the architecture decisions, chunking strategies, and API patterns that separate demo-quality RAG from production-grade systems.\n\n## What We're Building\nA document Q&A system that can accurately answer questions over a 10,000-page internal knowledge base in under 2 seconds.\n\n## Architecture Overview\n- Ingestion layer: PDF → text → semantic chunks\n- Embedding store: OpenAI text-embedding-3-small + pgvector\n- Retrieval: hybrid BM25 + cosine similarity re-ranking\n- Generation: GPT-4o with system-injected context and citations\n\n## Key Learnings\n1. Chunk size matters more than embedding model choice\n2. Re-ranking dramatically improves answer quality\n3. System prompt engineering accounts for 40% of perceived quality\n\nRead the full guide on our blog for code snippets and benchmarks.`,
          cta: 'Read the full guide →',
          hashtags: ['RAG', 'OpenAI', 'LLM', 'MachineLearning', 'AIEngineering'],
          media: '/data_flows_rag.png',
        },
      ],
    },
    {
      id: 'a1b2c3d4-e5f6-7890',
      theme: 'Enterprise AI Adoption & Safety',
      status: 'planning',
      start_date: '2026-05-01',
      end_date: '2026-05-31',
      campaign_type: 'Thought Leadership',
      goals: [
        'Target CTOs and VPs of Engineering at Series B+ companies',
        'Publish three authoritative pieces on responsible AI deployment',
        'Generate 20+ qualified enterprise leads from LinkedIn',
      ],
      planner_notes: 'Content should feel authoritative and data-backed. White-paper style posts perform best with this audience. Pair with a webinar invite in the second week.',
      strategist_notes: 'Enterprise buyers care deeply about compliance, security, and ROI. Lead with those angles. Avoid hype language — this audience is skeptical. Use case studies with named clients where possible.',
      posts: [
        {
          id: 'li-ent-001',
          platform: 'LinkedIn',
          platform_icon: '💼',
          topic: 'The Hidden Costs of DIY LLM Infrastructure',
          post_type: 'Insight / Data Post',
          scheduled: 'May 2, 2026 · 8:30 AM',
          status: 'planned',
          title: 'The Hidden Costs of Building Your Own LLM Infrastructure',
          body: `CFOs are starting to ask the right questions about AI infrastructure.\n\nOur analysis of 47 mid-to-large engineering teams shows that self-hosting LLMs costs 3.2× more than using a managed API — once you factor in:\n\n• Model maintenance & version management: ~$180K/year\n• GPU infra & cooling: ~$240K/year  \n• Internal ML Ops headcount: ~$320K/year\n• Compliance & audit overhead: ~$60K/year\n\nTotal: ~$800K/year vs. ~$250K for comparable API usage at scale.\n\nThe math changes when you cross 10M+ requests/day. Until then, the API is almost always the right call.\n\n#EnterpriseAI #LLM #CloudComputing #CTO #AIStrategy`,
          cta: 'Is your team doing this calculation? We\'d love to hear the numbers you\'re seeing.',
          hashtags: ['EnterpriseAI', 'LLM', 'CloudComputing', 'CTO', 'AIStrategy'],
          media: '/ai_nodes_abstract.png',
        },
        {
          id: 'li-ent-002',
          platform: 'LinkedIn',
          platform_icon: '💼',
          topic: 'AI Safety is a Business Requirement, Not a PR Exercise',
          post_type: 'Opinion / Perspective',
          scheduled: 'May 8, 2026 · 10:00 AM',
          status: 'planned',
          title: 'AI Safety Is a Business Requirement, Not a PR Exercise',
          body: `A hard truth for 2026: companies that treat AI safety as a PR checkbox will face regulatory and reputational risk within 18 months.\n\nHere's what responsible AI deployment actually looks like at the infrastructure level:\n\n✅ Output filtering and content policies tied to use-case context\n✅ Prompt injection audit trails\n✅ Human-in-the-loop escalation for high-stakes decisions\n✅ Quarterly red-team exercises on your AI products\n✅ Model versioning with rollback capability\n\nThe companies doing this now are building durable competitive advantages. The companies skipping it are accumulating technical and legal debt.\n\nAt OpenAI, safety is baked into every layer of the API — not bolted on after the fact.\n\n#AIResponsibility #AIGovernance #EnterpriseAI #CTO #SafeAI`,
          cta: 'What\'s one AI safety practice your team has implemented that you\'d recommend to others?',
          hashtags: ['AIResponsibility', 'AIGovernance', 'EnterpriseAI', 'CTO', 'SafeAI'],
          media: '/ai_safety_nodes.png',
        },
        {
          id: 'bl-ent-001',
          platform: 'Blog / Medium',
          platform_icon: '✍️',
          topic: 'Case Study: FinanceOS Reduced Analyst Time by 60%',
          post_type: 'Customer Case Study',
          scheduled: 'May 14, 2026 · 8:00 AM',
          status: 'planned',
          title: 'Case Study: How FinanceOS Cut FP&A Report Generation Time by 60% with GPT-4o',
          body: `FinanceOS, a B2B SaaS platform serving 200+ enterprise finance teams, had a problem: their analysts were spending 12+ hours a week on routine variance commentary for board reports.\n\nThe solution was straightforward in concept — an AI co-pilot that drafts the first version of each variance explanation, pulling context from the financial data and prior commentary.\n\nBut making it accurate enough for a CFO audience was the hard part.\n\nOver 8 weeks, FinanceOS's team used the OpenAI API to build and iterate on a GPT-4o-powered writing assistant embedded directly in their reporting workflow.\n\nThe results:\n• 60% reduction in time-to-draft for variance commentary\n• 94% analyst satisfaction rate (up from 67% for previous tool)\n• Zero hallucinated numbers — achieved via structured data injection and output validation\n\n"Our analysts still own every word," said FinanceOS CTO Maria Valdez. "The AI just removes the blank page problem."\n\nRead the full case study for the architecture breakdown and prompt engineering details.`,
          cta: 'Read the full case study →',
          hashtags: ['FinTech', 'EnterpriseAI', 'FP&A', 'GPT4', 'ProductivityAI'],
          media: '/ai_developer_sleek.png',
        },
      ],
    },
  ];

  // ── Modal helper ────────────────────────────────────────────────────────────
  function openPostModal(post: any) {
    const statusColor = post.status === 'approved' ? 'var(--success)' :
      post.status === 'scheduled' ? 'var(--primary)' :
        post.status === 'draft' ? 'var(--warning)' : 'var(--text-muted)';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'post-modal';
    modal.innerHTML = `
      <div class="modal-box">
        <button class="modal-close" id="modal-close-btn">✕</button>

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <span style="font-size: 24px;">${post.platform_icon}</span>
          <div>
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 600;">${post.platform}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">📅 ${post.scheduled}</div>
          </div>
          <span style="margin-left: auto; color: ${statusColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; background: ${statusColor}22; padding: 4px 10px; border-radius: 20px;">${post.status}</span>
        </div>

        ${post.media ? `
          <div class="modal-media-preview">
            <img src="${post.media}" alt="Post Media">
          </div>
        ` : ''}

        <h2 style="font-size: 18px; line-height: 1.4; margin-bottom: 16px; color: var(--text-main);">${post.title}</h2>

        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: var(--text-muted); background: rgba(37,99,235,0.04); border: 1px solid var(--border-light); border-radius: 10px; padding: 16px; margin-bottom: 16px;">${post.body}</div>

        ${post.cta ? `<div style="padding: 12px 16px; border-left: 3px solid var(--primary); background: rgba(37,99,235,0.08); border-radius: 6px; font-size: 14px; color: var(--text-main); font-style: italic; margin-bottom: 12px;">"${post.cta}"</div>` : ''}

        ${post.hashtags && post.hashtags.length > 0 ? `<div style="font-size: 13px; color: var(--primary); margin-bottom: 20px;">${post.hashtags.map((h: string) => '#' + h).join(' ')}</div>` : ''}

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn" id="approve-btn" style="flex:2; background: var(--success); font-size: 13px;">✓ Approve & Schedule</button>
          <button class="btn" id="revision-btn" style="flex:1; background: rgba(239,68,68,0.1); color: var(--error); border: 1px solid var(--error); font-size: 13px; box-shadow: none;">✗ Revision</button>
        </div>
        <div id="action-status" style="margin-top: 12px; font-size: 12px; text-align: center; color: var(--text-muted); display: none;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const approveBtn = document.getElementById('approve-btn');
    const revisionBtn = document.getElementById('revision-btn');
    const statusDiv = document.getElementById('action-status');

    approveBtn?.addEventListener('click', () => {
      if (!approveBtn || !revisionBtn || !statusDiv) return;
      approveBtn.innerHTML = `Scheduling <div class="loader-dots"><span></span><span></span><span></span></div>`;
      approveBtn.style.opacity = '0.7';
      approveBtn.style.pointerEvents = 'none';
      revisionBtn.style.display = 'none';
      
      setTimeout(() => {
        statusDiv.style.display = 'block';
        statusDiv.style.color = 'var(--success)';
        statusDiv.innerHTML = '✨ Post successfully scheduled to ' + post.platform + '!';
        approveBtn.innerHTML = '🎉 Scheduled';
        setTimeout(() => modal.remove(), 1500);
      }, 2000);
    });

    revisionBtn?.addEventListener('click', () => {
      if (!approveBtn || !revisionBtn || !statusDiv) return;
      revisionBtn.innerHTML = `Requesting <div class="loader-dots"><span></span><span></span><span></span></div>`;
      revisionBtn.style.opacity = '0.7';
      revisionBtn.style.pointerEvents = 'none';
      approveBtn.style.display = 'none';
      
      setTimeout(() => {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '🤖 Agent is working on your revision... (ETA 2 min)';
        setTimeout(() => modal.remove(), 2500);
      }, 2000);
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  // ── Render HTML ─────────────────────────────────────────────────────────────
  let html = '';

  for (const camp of DUMMY_CAMPAIGNS) {
    const statusColor = camp.status === 'active' ? 'var(--success)' : 'var(--warning)';
    const statusBg = camp.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)';

    html += `
      <div class="card" style="margin-bottom: 32px;">
        <!-- Campaign Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="color: var(--primary); margin-bottom: 6px; font-size: 22px;">${camp.theme}</h2>
            <p style="color: var(--text-muted); font-size: 13px; margin: 0;">
              📅 ${camp.start_date} – ${camp.end_date} &nbsp;·&nbsp; 📌 ${camp.campaign_type}
            </p>
          </div>
          <span style="color: ${statusColor}; background: ${statusBg}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${camp.status}</span>
        </div>

        <!-- Goals -->
        <div style="margin-top: 20px; padding: 16px; background: rgba(37,99,235,0.05); border: 1px solid rgba(37,99,235,0.15); border-radius: 10px;">
          <h4 style="color: var(--primary); margin-bottom: 10px; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Campaign Goals</h4>
          <ul style="margin: 0; padding-left: 18px; color: var(--text-muted); font-size: 14px; line-height: 1.8;">
            ${camp.goals.map(g => `<li>${g}</li>`).join('')}
          </ul>
        </div>

        <!-- Notes -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
          <div style="font-size: 13px; color: var(--text-muted); padding: 14px; background: rgba(0,0,0,0.15); border-radius: 8px; border: 1px solid var(--border-light);">
            <strong style="color: var(--text-main); display: block; margin-bottom: 6px;">📋 Planner Notes</strong>
            ${camp.planner_notes}
          </div>
          <div style="font-size: 13px; color: var(--text-muted); padding: 14px; background: rgba(0,0,0,0.15); border-radius: 8px; border: 1px solid var(--border-light);">
            <strong style="color: var(--text-main); display: block; margin-bottom: 6px;">🎯 Strategist Notes</strong>
            ${camp.strategist_notes}
          </div>
        </div>

        <!-- Posts grid -->
        <h3 style="margin-top: 28px; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 10px; font-size: 16px;">
          📝 Scheduled Content — ${camp.posts.length} Posts
        </h3>
        <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          ${camp.posts.map(post => {
      const pStatusColor = post.status === 'approved' ? 'var(--success)' :
        post.status === 'scheduled' ? 'var(--primary)' :
          post.status === 'draft' ? 'var(--warning)' : 'var(--text-muted)';
      const pStatusBg = post.status === 'approved' ? 'rgba(16,185,129,0.12)' :
        post.status === 'scheduled' ? 'rgba(37,99,235,0.12)' :
          post.status === 'draft' ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.1)';
      return `
              <div class="post-card" data-post-id="${post.id}">
                ${post.media ? `
                  <div class="post-thumbnail-container">
                    <img src="${post.media}" alt="Thumbnail">
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    ${post.platform_icon} ${post.platform}
                  </span>
                  <span style="color: ${pStatusColor}; background: ${pStatusBg}; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 9px; border-radius: 20px;">${post.status}</span>
                </div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 4px;">${post.post_type}</div>
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main); margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.topic}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">📅 ${post.scheduled}</div>
                
                <button class="btn view-post-btn" data-post-id="${post.id}" style="width: 100%; padding: 10px; font-size: 13px; border-radius: 8px;">
                  View Post ↗
                </button>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  viewContainer.innerHTML = html;

  // Build a flat lookup of posts for the click handlers
  const allPosts: Record<string, any> = {};
  for (const camp of DUMMY_CAMPAIGNS) {
    for (const p of camp.posts) allPosts[p.id] = p;
  }

  document.querySelectorAll('.view-post-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).getAttribute('data-post-id');
      if (id && allPosts[id]) openPostModal(allPosts[id]);
    });
  });
}

import { supabase } from './supabase';

let logRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let expandedOutputs: Record<string, string> = {};

// ── helper: render a single TaskLog row into HTML ────────────────────────────
function renderLogEntry(log: TaskLog): string {
  const time = new Date(log.timestamp).toLocaleTimeString();
  const isContentGenCompleted = log.agent === 'content_generator' && log.new_status === 'completed';
  const isExpanded = expandedOutputs[log.log_id] !== undefined;

  return `
    <div class="log-entry ${log.event}" data-log-id="${log.log_id}">
      <div class="log-time">${time}</div>
      <div class="log-content">
        ${log.agent ? `<div class="log-agent">${log.agent}</div>` : ''}
        <div class="log-message">
          <strong>[${log.event.toUpperCase()}]</strong> ${log.message}
          ${log.new_status ? `<span style="color: var(--text-muted); margin-left: 8px;">→ ${log.new_status.toUpperCase()}</span>` : ''}
        </div>
        ${isContentGenCompleted ? `
          <div style="margin-top: 8px;">
            <button class="btn view-output-btn" data-task-id="${log.task_id}" data-log-id="${log.log_id}" style="padding: 4px 8px; font-size: 11px; background: rgba(37, 99, 235, 0.2); color: var(--primary);">
              ${isExpanded ? 'Hide Output Data' : 'View Output Data'}
            </button>
            <div id="output-${log.log_id}" style="display: ${isExpanded ? 'block' : 'none'}; margin-top: 8px; font-size: 12px; background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px; overflow-x: auto; color: var(--text-main);">
              ${expandedOutputs[log.log_id] || ''}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ── helper: attach 'View Output Data' click handlers ────────────────────────
function attachOutputBtnListeners() {
  document.querySelectorAll('.view-output-btn').forEach(btn => {
    // Prevent double-binding
    const el = btn as HTMLButtonElement;
    if (el.dataset.bound) return;
    el.dataset.bound = '1';

    el.addEventListener('click', async () => {
      const taskId = el.getAttribute('data-task-id');
      const logId = el.getAttribute('data-log-id');
      if (!taskId || !logId) return;

      if (expandedOutputs[logId] !== undefined) {
        delete expandedOutputs[logId];
        el.textContent = 'View Output Data';
        const resDiv = document.getElementById(`output-${logId}`);
        if (resDiv) resDiv.style.display = 'none';
        return;
      }

      expandedOutputs[logId] = 'Loading...';
      el.textContent = 'Hide Output Data';
      const resDiv = document.getElementById(`output-${logId}`);
      if (resDiv) { resDiv.style.display = 'block'; resDiv.innerHTML = 'Loading...'; }

      try {
        const result = await ApiService.getTaskResult(taskId);
        let data = result?.output_data;

        if (data && data.content_id && !data.body && currentCompanyId) {
          try {
            const content = await ApiService.getSingleContent(currentCompanyId, data.content_id);
            if (content) data = content;
          } catch (e) {
            console.warn('Failed to enrich content from NoSQL:', e);
          }
        }

        expandedOutputs[logId] = data ? formatContentData(data) : `<span style="color: var(--warning);">No output data found.</span>`;
      } catch (err: any) {
        expandedOutputs[logId] = `<span style="color: var(--error);">Error: ${err.message}</span>`;
      }

      const div = document.getElementById(`output-${logId}`);
      if (div) div.innerHTML = expandedOutputs[logId];
    });
  });
}

function renderLogs() {
  // Tear down any existing realtime channel
  if (logRealtimeChannel) {
    supabase.removeChannel(logRealtimeChannel);
    logRealtimeChannel = null;
  }

  if (!currentCompanyId) {
    viewContainer.innerHTML = `<div class="empty-state">Please onboard a company first.</div>`;
    return;
  }

  viewContainer.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Live Agent Activity</h2>
        <div class="status-badge active" style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--success); display: inline-block; animation: pulse 1.5s infinite;"></span>
          Realtime
        </div>
      </div>
    </div>
    <div id="logs-container" class="log-stream"></div>
  `;

  // ── 1. Load existing logs via REST ───────────────────────────────────────
  ApiService.getTaskLogs(currentCompanyId!).then(data => {
    const container = document.getElementById('logs-container');
    if (!container) return;

    if (data.total === 0) {
      container.innerHTML = `<div class="empty-state">No activity yet — waiting for the agents to wake up.</div>`;
    } else {
      container.innerHTML = data.logs.map(renderLogEntry).join('');
      attachOutputBtnListeners();
    }
  }).catch(err => console.error('Failed to load initial logs:', err));

  // ── 2. Subscribe to realtime INSERTs on task_logs ────────────────────────
  logRealtimeChannel = supabase
    .channel(`task_logs:${currentCompanyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_logs',
        filter: `company_id=eq.${currentCompanyId}`,
      },
      (payload) => {
        const newLog = payload.new as TaskLog;
        const container = document.getElementById('logs-container');
        if (!container) return;

        // Replace empty-state placeholder if still showing
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        // Prepend the new entry (newest first)
        const div = document.createElement('div');
        div.innerHTML = renderLogEntry(newLog).trim();
        const entry = div.firstElementChild as HTMLElement;
        container.insertBefore(entry, container.firstChild);

        // Bind output button if it appeared
        attachOutputBtnListeners();
      }
    )
    .subscribe((status) => {
      console.log('[Realtime] task_logs subscription status:', status);
    });
}

// Custom route change cleanup — remove realtime channel on navigate away
const originalNavigateTo = navigateTo;
// @ts-ignore
window.navigateTo = function (route: string) {
  if (logRealtimeChannel) {
    supabase.removeChannel(logRealtimeChannel);
    logRealtimeChannel = null;
  }
  originalNavigateTo(route);
};

init();


