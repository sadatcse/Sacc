// Finds the same submission made within the last `windowMinutes` (stops double-clicks / spam).
export async function findRecentDuplicate(Model, query, windowMinutes = 10) {
  return Model.findOne({
    ...query,
    createdAt: { $gte: new Date(Date.now() - windowMinutes * 60 * 1000) },
  });
}
