import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import * as zod from 'zod'

function loadModule(path, globals = {}, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const module = { exports: {} }
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`)
      return imports[name]
    },
    AbortSignal,
    Buffer,
    ...globals,
  })
  return module.exports
}

for (const missingIndex of [false, true]) {
  test(`deployed history authenticates sync and search (new index: ${missingIndex})`, async () => {
    const { default: config } = loadModule('../nuxt.config.ts', {
      defineNuxtConfig: (value) => value,
    })
    const runtime = { ...config.runtimeConfig }
    // Nuxt runtime environment overrides require matching declared config keys.
    const overrides = {
      elasticsearchUrl: 'https://elastic.example',
      elasticsearchAuthorization: 'ApiKey deployment-test',
      elasticsearchServerless: true,
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (Object.hasOwn(runtime, key)) runtime[key] = value
    }
    const activity = {
      _id: 'demo-activity',
      id: 'demo-activity',
      userId: 'reviewer1-id',
      username: 'reviewer1',
      module: 'STAR',
      createdAt: '2026-11-16T00:00:00.000Z',
      changes: [],
    }
    const requests = []
    let marked = false
    let indexExists = !missingIndex
    const outbox = {
      find: () => ({ sort: () => ({ limit: () => ({ toArray: async () => [activity] }) }) }),
      updateMany: async () => {
        marked = true
      },
    }
    const { readActivity } = loadModule(
      '../server/utils/elasticsearch.ts',
      {
        useRuntimeConfig: () => runtime,
        createError: (details) => Object.assign(new Error(details.statusMessage), details),
        fetch: async (url, options) => {
          requests.push({ url, ...options })
          if (options.headers.Authorization !== 'ApiKey deployment-test') {
            return new Response('{}', { status: 401 })
          }
          if (options.method === 'GET' && !indexExists) {
            return new Response('{}', { status: 404 })
          }
          if (options.method === 'PUT') {
            assert.equal(JSON.parse(options.body).settings, undefined)
            indexExists = true
          }
          if (url.endsWith('/_search')) {
            const query = JSON.parse(options.body)
            assert.equal(query.query.term.userId, 'reviewer1-id')
            return Response.json({
              hits: { hits: [{ _source: activity, sort: [0, activity.id] }] },
            })
          }
          return Response.json({ errors: false })
        },
      },
      { zod, './db.ts': { getDatabase: async () => ({ collection: () => outbox }) } },
    )

    const page = await readActivity('reviewer1-id')
    assert.equal(page.items.length, 1)
    assert.equal(page.items[0].username, 'reviewer1')
    assert.equal(page.nextCursor, null)
    assert.equal(marked, true)
    assert.equal(
      requests.some((request) => request.url.includes('/_bulk?')),
      true,
    )
    assert.equal(
      requests.some((request) => request.url.endsWith('/_search')),
      true,
    )
    if (missingIndex)
      assert.equal(
        requests.some((request) => request.method === 'PUT'),
        true,
      )
  })
}
