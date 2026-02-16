// Augment provided context per docs: https://vitest.dev/config/provide.html
declare module 'vitest' {
  export interface ProvidedContext {
    dbConfig: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };
  }
}

export {};
