export interface Persistence {
  initialize(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}
