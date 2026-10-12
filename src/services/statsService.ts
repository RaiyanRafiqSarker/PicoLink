import { pool } from '../db/pool.js';

export interface StatsResponse {
  short_code: string;
  original_url: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  total_clicks: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  country_breakdown: Array<{ country_code: string; count: number }>;
  clicks_over_time: Array<{ date: string; count: number }>;
  recent_clicks: Array<{
    clicked_at: string;
    referrer: string | null;
    country_code: string | null;
    user_agent: string | null;
  }>;
}

export class StatsService {
  async getStatsForCode(code: string): Promise<StatsResponse | null> {
    // 1. Verify existence of the short code
    const urlRes = await pool.query(
      `SELECT short_code, original_url, created_at, expires_at, is_active
       FROM urls
       WHERE short_code = $1 LIMIT 1;`,
      [code]
    );

    if (urlRes.rows.length === 0) {
      return null;
    }

    const urlRow = urlRes.rows[0];

    // 2. Query total clicks
    const totalClicksRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM link_clicks WHERE short_code = $1;`,
      [code]
    );
    const totalClicks = totalClicksRes.rows[0]?.total || 0;

    // 3. Query top referrers
    const referrersRes = await pool.query(
      `SELECT COALESCE(NULLIF(referrer, ''), 'Direct / None') AS referrer, COUNT(*)::int AS count
       FROM link_clicks
       WHERE short_code = $1
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 10;`,
      [code]
    );

    // 4. Query country breakdown
    const countryRes = await pool.query(
      `SELECT COALESCE(NULLIF(country_code, ''), 'Unknown') AS country_code, COUNT(*)::int AS count
       FROM link_clicks
       WHERE short_code = $1
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 15;`,
      [code]
    );

    // 5. Query clicks over time (last 14 days)
    const timeRes = await pool.query(
      `SELECT TO_CHAR(clicked_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
       FROM link_clicks
       WHERE short_code = $1 AND clicked_at >= NOW() - INTERVAL '14 days'
       GROUP BY 1
       ORDER BY date ASC;`,
      [code]
    );

    // 6. Query recent clicks stream (last 15 clicks)
    const recentClicksRes = await pool.query(
      `SELECT clicked_at, referrer, country_code, user_agent
       FROM link_clicks
       WHERE short_code = $1
       ORDER BY clicked_at DESC
       LIMIT 15;`,
      [code]
    );

    return {
      short_code: urlRow.short_code,
      original_url: urlRow.original_url,
      created_at: urlRow.created_at.toISOString(),
      expires_at: urlRow.expires_at ? urlRow.expires_at.toISOString() : null,
      is_active: urlRow.is_active,
      total_clicks: totalClicks,
      top_referrers: referrersRes.rows,
      country_breakdown: countryRes.rows,
      clicks_over_time: timeRes.rows,
      recent_clicks: recentClicksRes.rows.map((r: any) => ({
        clicked_at: r.clicked_at.toISOString(),
        referrer: r.referrer,
        country_code: r.country_code,
        user_agent: r.user_agent,
      })),
    };
  }
}

export const statsService = new StatsService();
