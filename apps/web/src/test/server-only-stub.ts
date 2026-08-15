// Vitest runs in Node without the "react-server" export condition, so the real
// `server-only` package throws on import. Aliased to this no-op so repository /
// service modules that do `import "server-only"` can be unit-tested.
export {};
