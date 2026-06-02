// PostgREST enforces a server-side max-rows cap (1000 on this project), which
// silently overrides any `.limit()` larger than that. To read a full table we
// have to page through with `.range()` until a short page signals the end.
//
// Usage:
//   const protocols = await fetchAllRows((from, to) =>
//     supabase.from('protocols').select('*').eq('omit_record', false).range(from, to)
//   )
// The callback must apply `.range(from, to)` to the query it builds so each page
// keeps the same filters and ordering.

const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return rows
}
