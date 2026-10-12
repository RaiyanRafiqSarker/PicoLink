export interface UrlRecord {
  id: bigint;
  short_code: string;
  original_url: string;
  created_at: Date;
  expires_at: Date | null;
  is_active: boolean;
}

export interface ClickRecord {
  id: bigint;
  short_code: string;
  clicked_at: Date;
  referrer: string | null;
  user_agent: string | null;
  country_code: string | null;
}

export class MemoryDatabase {
  private urls: Map<string, UrlRecord> = new Map();
  private clicks: ClickRecord[] = [];
  private sequence: bigint = 100000000n;
  private clickSeq: bigint = 1n;

  public isFallbackActive: boolean = false;

  nextval(): bigint {
    const val = this.sequence;
    this.sequence += 1n;
    return val;
  }

  insertUrl(record: Omit<UrlRecord, 'id' | 'created_at' | 'is_active'> & { id?: bigint }): UrlRecord {
    const existing = this.urls.get(record.short_code);
    if (existing) {
      const err: any = new Error(`Key (short_code)=(${record.short_code}) already exists.`);
      err.code = '23505';
      throw err;
    }

    const id = record.id ?? this.nextval();
    const created: UrlRecord = {
      id,
      short_code: record.short_code,
      original_url: record.original_url,
      created_at: new Date(),
      expires_at: record.expires_at,
      is_active: true,
    };

    this.urls.set(record.short_code, created);
    return created;
  }

  getUrl(code: string): UrlRecord | null {
    return this.urls.get(code) || null;
  }

  insertClicks(records: Array<Omit<ClickRecord, 'id'>>): void {
    for (const r of records) {
      this.clicks.push({
        ...r,
        id: this.clickSeq++,
      });
    }
  }

  getClicks(code: string): ClickRecord[] {
    return this.clicks.filter((c) => c.short_code === code);
  }

  async execute(sql: string, values: any[] = []): Promise<{ rows: any[] }> {
    const trimmed = sql.trim();

    // 1. SELECT 1 / Health check
    if (/SELECT\s+1/i.test(trimmed)) {
      return { rows: [{ alive: 1 }] };
    }

    // 2. Schema DDL statements
    if (
      /CREATE\s+TABLE/i.test(trimmed) ||
      /CREATE\s+INDEX/i.test(trimmed) ||
      /BEGIN/i.test(trimmed) ||
      /COMMIT/i.test(trimmed) ||
      /ROLLBACK/i.test(trimmed) ||
      /DO\s+\$\$/i.test(trimmed)
    ) {
      return { rows: [] };
    }

    // 3. Sequence nextval
    if (/nextval/i.test(trimmed)) {
      const nextId = this.nextval();
      return { rows: [{ id: nextId.toString() }] };
    }

    // 4. INSERT INTO urls
    if (/INSERT\s+INTO\s+urls/i.test(trimmed)) {
      if (values.length === 4) {
        // [id, short_code, original_url, expires_at]
        const id = BigInt(values[0]);
        const short_code = values[1];
        const original_url = values[2];
        const expires_at = values[3] ? new Date(values[3]) : null;
        const inserted = this.insertUrl({ id, short_code, original_url, expires_at });
        return { rows: [inserted] };
      } else if (values.length === 3) {
        // [short_code, original_url, expires_at]
        const short_code = values[0];
        const original_url = values[1];
        const expires_at = values[2] ? new Date(values[2]) : null;
        const inserted = this.insertUrl({ short_code, original_url, expires_at });
        return { rows: [inserted] };
      }
    }

    // 5. SELECT FROM urls WHERE short_code = $1
    if (/SELECT.*FROM\s+urls\s+WHERE\s+short_code\s*=\s*\$1/is.test(trimmed)) {
      const code = values[0];
      const found = this.getUrl(code);
      if (!found) return { rows: [] };
      return {
        rows: [
          {
            short_code: found.short_code,
            original_url: found.original_url,
            created_at: found.created_at,
            expires_at: found.expires_at,
            is_active: found.is_active,
          },
        ],
      };
    }

    // 6. Total clicks
    if (/SELECT\s+COUNT\(\*\)::int\s+AS\s+total\s+FROM\s+link_clicks/is.test(trimmed)) {
      const code = values[0];
      const matching = this.getClicks(code);
      return { rows: [{ total: matching.length }] };
    }

    // 7. Top Referrers
    if (/FROM\s+link_clicks\s+WHERE\s+short_code\s*=\s*\$1\s+GROUP\s+BY\s+1\s+ORDER\s+BY\s+count\s+DESC/is.test(trimmed) && /referrer/i.test(trimmed)) {
      const code = values[0];
      const matching = this.getClicks(code);
      const counts: Record<string, number> = {};
      for (const m of matching) {
        const ref = m.referrer && m.referrer.trim() ? m.referrer : 'Direct / None';
        counts[ref] = (counts[ref] || 0) + 1;
      }
      const sorted = Object.entries(counts)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      return { rows: sorted };
    }

    // 8. Country breakdown
    if (/FROM\s+link_clicks\s+WHERE\s+short_code\s*=\s*\$1\s+GROUP\s+BY\s+1\s+ORDER\s+BY\s+count\s+DESC/is.test(trimmed) && /country_code/i.test(trimmed)) {
      const code = values[0];
      const matching = this.getClicks(code);
      const counts: Record<string, number> = {};
      for (const m of matching) {
        const c = m.country_code && m.country_code.trim() ? m.country_code : 'Unknown';
        counts[c] = (counts[c] || 0) + 1;
      }
      const sorted = Object.entries(counts)
        .map(([country_code, count]) => ({ country_code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
      return { rows: sorted };
    }

    // 9. Clicks over time
    if (/SELECT\s+TO_CHAR\(clicked_at/is.test(trimmed)) {
      const code = values[0];
      const matching = this.getClicks(code);
      const daysMap: Record<string, number> = {};
      for (const m of matching) {
        const d = m.clicked_at.toISOString().slice(0, 10);
        daysMap[d] = (daysMap[d] || 0) + 1;
      }
      const sorted = Object.entries(daysMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return { rows: sorted };
    }

    // 10. Recent clicks stream
    if (/SELECT\s+clicked_at,\s*referrer,\s*country_code,\s*user_agent\s+FROM\s+link_clicks/is.test(trimmed)) {
      const code = values[0];
      const matching = this.getClicks(code);
      const recent = matching
        .slice(-15)
        .reverse()
        .map((r) => ({
          clicked_at: r.clicked_at,
          referrer: r.referrer,
          country_code: r.country_code,
          user_agent: r.user_agent,
        }));
      return { rows: recent };
    }

    // 11. Bulk insert link_clicks
    if (/INSERT\s+INTO\s+link_clicks/is.test(trimmed)) {
      // values are in chunks of 5: [short_code, clicked_at, referrer, user_agent, country_code]
      const toAdd: Array<Omit<ClickRecord, 'id'>> = [];
      for (let i = 0; i < values.length; i += 5) {
        toAdd.push({
          short_code: values[i],
          clicked_at: new Date(values[i + 1]),
          referrer: values[i + 2],
          user_agent: values[i + 3],
          country_code: values[i + 4],
        });
      }
      this.insertClicks(toAdd);
      return { rows: [] };
    }

    return { rows: [] };
  }
}

export const memoryDb = new MemoryDatabase();
