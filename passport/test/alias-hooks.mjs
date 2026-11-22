// Mirror Vite for node --test, no dependency:
// - resolve the aliases @design and @tables (read-only folders);
// - let bare `import x from './file.json'` load as JSON (Vite allows it; Node needs the attribute).
const MAP = {
  '@design/': new URL('../../design/', import.meta.url).href,
  '@tables/': new URL('../../tables/', import.meta.url).href,
};
export async function resolve(specifier, context, next) {
  for (const [prefix, target] of Object.entries(MAP)) {
    if (specifier.startsWith(prefix)) specifier = target + specifier.slice(prefix.length);
  }
  const resolved = await next(specifier, context);
  if (resolved.url.endsWith('.json')) {
    return { ...resolved, importAttributes: { ...resolved.importAttributes, type: 'json' } };
  }
  return resolved;
}
