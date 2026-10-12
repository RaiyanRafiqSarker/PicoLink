/**
 * NanoLink Client-Side Dashboard Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // DOM Elements
  const shortenForm = document.getElementById('shortenForm');
  const originalUrlInput = document.getElementById('originalUrl');
  const customSlugInput = document.getElementById('customSlug');
  const expiresInDaysSelect = document.getElementById('expiresInDays');
  const shortenSubmitBtn = document.getElementById('shortenSubmitBtn');
  const shortenBtnText = document.getElementById('shortenBtnText');
  const pasteBtn = document.getElementById('pasteBtn');

  const resultCard = document.getElementById('resultCard');
  const shortUrlOutput = document.getElementById('shortUrlOutput');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const testRedirectLink = document.getElementById('testRedirectLink');
  const inspectThisStatsBtn = document.getElementById('inspectThisStatsBtn');
  const resultExpiryBadge = document.getElementById('resultExpiryBadge');
  const resultOriginalUrl = document.getElementById('resultOriginalUrl');

  const statsSearchCode = document.getElementById('statsSearchCode');
  const statsSearchBtn = document.getElementById('statsSearchBtn');
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');
  const recentLinksPills = document.getElementById('recentLinksPills');

  const statsEmptyState = document.getElementById('statsEmptyState');
  const statsDataContainer = document.getElementById('statsDataContainer');

  const metricTotalClicks = document.getElementById('metricTotalClicks');
  const metricTopCountry = document.getElementById('metricTopCountry');
  const metricTopCountryClicks = document.getElementById('metricTopCountryClicks');
  const metricTopReferrer = document.getElementById('metricTopReferrer');
  const metricTopReferrerClicks = document.getElementById('metricTopReferrerClicks');
  const metricStatusPill = document.getElementById('metricStatusPill');
  const metricExpiresAt = document.getElementById('metricExpiresAt');

  const countryList = document.getElementById('countryList');
  const referrerList = document.getElementById('referrerList');
  const timelineContainer = document.getElementById('timelineContainer');
  const clickStreamTableBody = document.getElementById('clickStreamTableBody');

  const systemHealthBadge = document.getElementById('systemHealthBadge');
  const healthStatusText = document.getElementById('healthStatusText');
  const toastContainer = document.getElementById('toastContainer');

  let currentInspectingCode = null;

  // --- Helper: Toast Notification ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-slide-in pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
      type === 'success'
        ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
        : type === 'error'
        ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
        : 'bg-slate-900/90 text-slate-200 border-slate-700/60'
    }`;

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  // --- Helper: Local Storage for Recent Links ---
  function getRecentLinks() {
    try {
      const stored = localStorage.getItem('nanolink_recent');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveRecentLink(linkObj) {
    let recent = getRecentLinks();
    recent = recent.filter(item => item.short_code !== linkObj.short_code);
    recent.unshift(linkObj);
    if (recent.length > 8) recent.pop();
    try {
      localStorage.setItem('nanolink_recent', JSON.stringify(recent));
    } catch (e) {
      console.warn('Storage failed', e);
    }
    renderRecentLinks();
  }

  function renderRecentLinks() {
    const recent = getRecentLinks();
    if (recent.length === 0) {
      recentLinksPills.innerHTML = '<span class="text-xs text-slate-600 italic">No links generated yet.</span>';
      return;
    }

    recentLinksPills.innerHTML = recent
      .map(
        item => `
        <button 
          data-code="${item.short_code}" 
          class="recent-pill shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 text-xs font-mono font-medium border border-slate-700/60 transition-colors flex items-center gap-1.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          ${item.short_code}
        </button>
      `
      )
      .join('');

    // Attach click listeners to pills
    document.querySelectorAll('.recent-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        statsSearchCode.value = code;
        fetchAndRenderStats(code);
      });
    });
  }

  // --- Paste Clipboard Helper ---
  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          originalUrlInput.value = text.trim();
          showToast('URL pasted from clipboard', 'info');
        }
      } catch (err) {
        showToast('Clipboard access was not granted', 'error');
      }
    });
  }

  // --- Copy Link Button ---
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const url = shortUrlOutput.value;
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        copyBtnText.textContent = 'Copied!';
        copyBtn.classList.replace('bg-indigo-600', 'bg-emerald-600');
        showToast('Short URL copied to clipboard!', 'success');
        setTimeout(() => {
          copyBtnText.textContent = 'Copy Link';
          copyBtn.classList.replace('bg-emerald-600', 'bg-indigo-600');
        }, 2000);
      } catch {
        showToast('Failed to copy to clipboard', 'error');
      }
    });
  }

  // --- Form Submission: Shorten Link ---
  if (shortenForm) {
    shortenForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const original_url = originalUrlInput.value.trim();
      const custom_slug = customSlugInput.value.trim() || undefined;
      const expires_in_days = expiresInDaysSelect.value ? parseInt(expiresInDaysSelect.value, 10) : undefined;

      if (!original_url) {
        showToast('Please enter a target URL', 'error');
        return;
      }

      // UI Loading state
      shortenSubmitBtn.disabled = true;
      shortenBtnText.textContent = 'Shortening & Caching...';

      try {
        const res = await fetch('/api/v1/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ original_url, custom_slug, expires_in_days }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to shorten URL');
        }

        // Render result
        shortUrlOutput.value = data.short_url;
        testRedirectLink.href = data.short_url;
        resultOriginalUrl.textContent = data.original_url;

        if (data.expires_at) {
          const expDate = new Date(data.expires_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          resultExpiryBadge.textContent = `Expires ${expDate}`;
          resultExpiryBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
        } else {
          resultExpiryBadge.textContent = 'Never Expires';
          resultExpiryBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }

        resultCard.classList.remove('hidden');

        // Save to local history
        saveRecentLink({
          short_code: data.short_code,
          short_url: data.short_url,
          created_at: data.created_at,
        });

        currentInspectingCode = data.short_code;
        showToast(`Short link "${data.short_code}" ready!`, 'success');

        // Setup inspect button action
        inspectThisStatsBtn.onclick = () => {
          statsSearchCode.value = data.short_code;
          fetchAndRenderStats(data.short_code);
          document.getElementById('analyticsSection').scrollIntoView({ behavior: 'smooth' });
        };
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        shortenSubmitBtn.disabled = false;
        shortenBtnText.textContent = 'Shorten URL';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // --- Analytics Search & Inspection ---
  async function fetchAndRenderStats(code) {
    if (!code) return;
    code = code.trim();

    try {
      const res = await fetch(`/api/v1/stats/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Unable to retrieve statistics');
      }

      currentInspectingCode = code;

      // Update KPI cards
      metricTotalClicks.textContent = (data.total_clicks || 0).toLocaleString();

      if (data.country_breakdown && data.country_breakdown.length > 0) {
        metricTopCountry.textContent = data.country_breakdown[0].country_code;
        metricTopCountryClicks.textContent = `${data.country_breakdown[0].count} clicks`;
      } else {
        metricTopCountry.textContent = 'None';
        metricTopCountryClicks.textContent = '0 clicks';
      }

      if (data.top_referrers && data.top_referrers.length > 0) {
        metricTopReferrer.textContent = data.top_referrers[0].referrer;
        metricTopReferrerClicks.textContent = `${data.top_referrers[0].count} clicks`;
      } else {
        metricTopReferrer.textContent = 'Direct / None';
        metricTopReferrerClicks.textContent = '0 clicks';
      }

      if (data.is_active) {
        metricStatusPill.textContent = 'Active';
        metricStatusPill.className = 'inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      } else {
        metricStatusPill.textContent = 'Disabled';
        metricStatusPill.className = 'inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30';
      }

      if (data.expires_at) {
        const isPast = new Date(data.expires_at).getTime() < Date.now();
        const formatted = new Date(data.expires_at).toLocaleDateString();
        metricExpiresAt.textContent = isPast ? `Expired on ${formatted}` : `Expires on ${formatted}`;
        if (isPast) {
          metricStatusPill.textContent = 'Expired (410)';
          metricStatusPill.className = 'inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30';
        }
      } else {
        metricExpiresAt.textContent = 'Permanent (No expiry)';
      }

      // Render Country Breakdown Bars
      const total = data.total_clicks || 1;
      if (data.country_breakdown && data.country_breakdown.length > 0) {
        countryList.innerHTML = data.country_breakdown
          .map(item => {
            const pct = Math.round((item.count / total) * 100);
            return `
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-mono text-slate-300 font-semibold">${item.country_code}</span>
                <span class="text-slate-400">${item.count} clicks (${pct}%)</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div class="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
          })
          .join('');
      } else {
        countryList.innerHTML = '<p class="text-xs text-slate-500">No country events recorded yet.</p>';
      }

      // Render Referrers Breakdown Bars
      if (data.top_referrers && data.top_referrers.length > 0) {
        referrerList.innerHTML = data.top_referrers
          .map(item => {
            const pct = Math.round((item.count / total) * 100);
            return `
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300 truncate max-w-[200px]" title="${item.referrer}">${item.referrer}</span>
                <span class="text-slate-400">${item.count} clicks (${pct}%)</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div class="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
          })
          .join('');
      } else {
        referrerList.innerHTML = '<p class="text-xs text-slate-500">No referrer data recorded yet.</p>';
      }

      // Render Timeline Graph (Daily)
      if (data.clicks_over_time && data.clicks_over_time.length > 0) {
        const maxVal = Math.max(...data.clicks_over_time.map(t => t.count), 1);
        timelineContainer.innerHTML = data.clicks_over_time
          .map(t => {
            const heightPct = Math.max(12, Math.round((t.count / maxVal) * 100));
            return `
            <div class="flex-1 flex flex-col items-center gap-1 min-w-[28px] group">
              <span class="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">${t.count}</span>
              <div class="w-full bg-indigo-500/70 hover:bg-indigo-400 rounded-t transition-all" style="height: ${heightPct}%"></div>
              <span class="text-[9px] text-slate-500 font-mono truncate w-full text-center">${t.date.slice(5)}</span>
            </div>
          `;
          })
          .join('');
      } else {
        timelineContainer.innerHTML = '<div class="w-full text-center text-xs text-slate-500 self-center">No timeline activity in the last 14 days.</div>';
      }

      // Render Live Click Stream Log Table
      if (data.recent_clicks && data.recent_clicks.length > 0) {
        clickStreamTableBody.innerHTML = data.recent_clicks
          .map(c => {
            const time = new Date(c.clicked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="py-2 px-3 text-slate-300">${time}</td>
              <td class="py-2 px-3 text-emerald-400 font-semibold">${c.country_code || '—'}</td>
              <td class="py-2 px-3 text-slate-400 truncate max-w-[150px]">${c.referrer || 'Direct'}</td>
              <td class="py-2 px-3 text-slate-500 truncate max-w-[200px]" title="${c.user_agent || ''}">${c.user_agent || 'Unknown'}</td>
            </tr>
          `;
          })
          .join('');
      } else {
        clickStreamTableBody.innerHTML = `
          <tr>
            <td colspan="4" class="py-4 text-center text-slate-500 font-sans">No clicks recorded yet. Click the test redirect link to see real-time events.</td>
          </tr>
        `;
      }

      // Switch visibility
      statsEmptyState.classList.add('hidden');
      statsDataContainer.classList.remove('hidden');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Search Button handler
  if (statsSearchBtn) {
    statsSearchBtn.addEventListener('click', () => {
      fetchAndRenderStats(statsSearchCode.value);
    });
  }

  // Enter key inside search box
  if (statsSearchCode) {
    statsSearchCode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        fetchAndRenderStats(statsSearchCode.value);
      }
    });
  }

  // Refresh Stats Button handler
  if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener('click', () => {
      if (currentInspectingCode) {
        fetchAndRenderStats(currentInspectingCode);
        showToast('Telemetry refreshed', 'info');
      } else {
        showToast('No active code selected to refresh', 'info');
      }
    });
  }

  // --- Health Check Background Ping ---
  async function checkSystemHealth() {
    try {
      const res = await fetch('/healthz');
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        systemHealthBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium';
        healthStatusText.textContent = 'Postgres & Redis Online';
      } else {
        systemHealthBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium';
        healthStatusText.textContent = 'Degraded Connectivity';
      }
    } catch {
      systemHealthBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium';
      healthStatusText.textContent = 'Service Offline';
    }
  }

  // Initial loads
  renderRecentLinks();
  checkSystemHealth();
  setInterval(checkSystemHealth, 30000);
});
