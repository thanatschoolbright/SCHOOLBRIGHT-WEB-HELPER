export type LoadTestStage = {
  duration: number;
  target: number;
};

export type LoadTestThreshold = {
  metric: string;
  condition: string;
  value: number;
};

export type LoadTestProfile = {
  name: string;
  description: string;
  vus: number;
  duration: number;
  stages?: LoadTestStage[];
  rps?: number;
  iterations?: number;
};

export type LoadTestConfig = {
  script: string;
  baseURL: string;
  request: number;
  second: number;
  stages?: LoadTestStage[];
  thresholds?: Record<string, string[]>;
  headers?: Record<string, string>;
  timeout?: number;
  maxRedirects?: number;
  thinkTime?: number;
  rps?: number;
  iterations?: number;
  noConnectionReuse?: boolean;
  noVUConnectionReuse?: boolean;
  minIterationDuration?: number;
  maxDuration?: number;
  gracefulStop?: number;
  setupTimeout?: number;
  teardownTimeout?: number;
  tags?: Record<string, string>;
};
