import { LoadTestProfile } from "../types/load-test.types";

export const TEST_PROFILES: LoadTestProfile[] = [
  {
    name: "Smoke Test",
    description: "Minimal load to verify system functionality",
    vus: 1,
    duration: 30,
  },
  {
    name: "Load Test",
    description: "Average expected load",
    vus: 50,
    duration: 300,
    stages: [
      { duration: 60, target: 50 },
      { duration: 180, target: 50 },
      { duration: 60, target: 0 },
    ],
  },
  {
    name: "Stress Test",
    description: "Beyond normal capacity",
    vus: 200,
    duration: 600,
    stages: [
      { duration: 120, target: 100 },
      { duration: 240, target: 200 },
      { duration: 120, target: 100 },
      { duration: 120, target: 0 },
    ],
  },
  {
    name: "Spike Test",
    description: "Sudden extreme load",
    vus: 500,
    duration: 180,
    stages: [
      { duration: 10, target: 500 },
      { duration: 60, target: 500 },
      { duration: 10, target: 0 },
    ],
  },
  {
    name: "Soak Test",
    description: "Extended duration test",
    vus: 100,
    duration: 3600,
    stages: [
      { duration: 300, target: 100 },
      { duration: 3000, target: 100 },
      { duration: 300, target: 0 },
    ],
  },
  {
    name: "Breakpoint Test",
    description: "Incrementally increase load until failure",
    vus: 1000,
    duration: 1200,
    stages: [
      { duration: 120, target: 100 },
      { duration: 120, target: 200 },
      { duration: 120, target: 300 },
      { duration: 120, target: 400 },
      { duration: 120, target: 500 },
      { duration: 120, target: 600 },
      { duration: 120, target: 700 },
      { duration: 120, target: 800 },
      { duration: 120, target: 900 },
      { duration: 120, target: 1000 },
    ],
  },
];

export const DEFAULT_THRESHOLDS = {
  http_req_duration: ["p(95)<500", "p(99)<1000"],
  http_req_failed: ["rate<0.01"],
  http_reqs: ["rate>10"],
};
