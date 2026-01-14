export function extractAIInsights(reviews) {
  if (!reviews || reviews.length === 0) return null;

  const positiveWords = [];
  const negativeWords = [];

  reviews.forEach((r) => {
    if (!r.comment) return;

    const words = r.comment.toLowerCase().split(/\W+/);

    words.forEach((w) => {
      if (w.length < 4) return;

      if (["good", "great", "clean", "nice", "friendly", "cheap"].includes(w))
        positiveWords.push(w);

      if (["bad", "slow", "dirty", "expensive"].includes(w))
        negativeWords.push(w);
    });
  });

  const topPos = [...new Set(positiveWords)].slice(0, 3);
  const topNeg = [...new Set(negativeWords)].slice(0, 2);

  return {
    positive: topPos,
    negative: topNeg,
  };
}
