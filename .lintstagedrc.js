module.exports = {
  'apps/web/**/*.{ts,tsx}': () => 'pnpm --filter @agent-irc/web lint',
  'apps/api/**/*.ts': () => 'pnpm --filter @agent-irc/api lint',
  'packages/shared/**/*.ts': () => 'pnpm --filter @agent-irc/shared lint',
};

