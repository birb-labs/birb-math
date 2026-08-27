// Type declaration for Cloudflare D1Database
declare interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

declare interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  first<T = any>(col?: string): Promise<T | undefined>;
  all<T = any>(): Promise<D1Result<T[]>>;
  raw<T = any>(options?: { columnNames: boolean }): Promise<T[]>;
}

declare interface D1Result<T = any[]> {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number | string;
    served_by: string;
    duration: number;
  };
  results?: T;
  error?: string;
}
