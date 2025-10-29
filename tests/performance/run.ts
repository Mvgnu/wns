// meta: module=performance.runner purpose="Entry point for executing performance scenarios"
import { runHomepageScenario } from './scenarios/homepage';

type Summary = {
  readonly endpoint: string;
  readonly requests: number;
  readonly averageMs: number;
  readonly p95Ms: number;
};

async function main() {
  const summaries: Summary[] = [];
  const homepageResults = await runHomepageScenario();
  summaries.push(...homepageResults);

  if (summaries.length === 0) {
    console.warn('No performance scenarios executed.');
    return;
  }

  console.table(summaries);
}

main().catch((error) => {
  console.error('Performance suite failed', error);
  process.exitCode = 1;
});
