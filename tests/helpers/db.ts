/**
 * Creates a chainable Drizzle-like query builder that resolves to `result`.
 * Supports: .from() .where() .set() .values() .limit() .returning() and await.
 */
export function createQueryChain(result: unknown[]) {
  const chain: Record<string, unknown> = {}
  for (const m of ['from', 'where', 'set', 'values', 'limit', 'innerJoin', '$dynamic', 'orderBy', 'offset']) {
    chain[m] = () => chain
  }
  chain.returning = () => Promise.resolve(result)
  chain.then = (
    onFulfilled: (v: unknown[]) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected)
  return chain
}

/**
 * Creates a mock db for handlers that use db.transaction().
 * Pass the full query result sequence — each select/update/delete/insert call
 * consumes the next item from the queue in order.
 */
export function createTransactionDb(txSequence: unknown[][]) {
  return {
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      const queue = [...txSequence]
      const next = () => queue.shift() ?? []
      const tx = {
        select: () => createQueryChain(next()),
        update: () => createQueryChain(next()),
        delete: () => createQueryChain(next()),
        insert: () => createQueryChain(next()),
      }
      return cb(tx)
    },
  }
}

/**
 * Creates a mock db for handlers that query directly (no transaction).
 * Each select/update/delete/insert call consumes the next item from the queue.
 */
export function createDirectDb(sequence: unknown[][]) {
  const queue = [...sequence]
  const next = () => queue.shift() ?? []
  return {
    select: () => createQueryChain(next()),
    update: () => createQueryChain(next()),
    delete: () => createQueryChain(next()),
    insert: () => createQueryChain(next()),
  }
}
