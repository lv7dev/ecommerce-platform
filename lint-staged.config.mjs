function quotePath(path) {
  return `"${path.replaceAll('"', '\\"')}"`;
}

function chunkedPrettier(files) {
  const commands = [];
  const chunkSize = 25;

  for (let index = 0; index < files.length; index += chunkSize) {
    const chunk = files.slice(index, index + chunkSize);
    commands.push(`prettier --write ${chunk.map(quotePath).join(' ')}`);
  }

  return commands;
}

export default {
  'apps/api/{src,test}/**/*.ts': () => [
    'pnpm --dir apps/api exec eslint "{src,test}/**/*.ts" --fix',
    'prettier --write apps/api/src apps/api/test',
  ],
  'apps/web/**/*.{js,jsx,ts,tsx}': () => [
    'pnpm --dir apps/web exec eslint . --fix',
    'prettier --write apps/web',
  ],
  '*.{json,md,yml,yaml,css,scss,mjs,cjs}': chunkedPrettier,
};
