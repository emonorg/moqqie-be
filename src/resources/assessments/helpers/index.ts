export function findSentenceEndIndex(responseChunks: string): number {
  const indexOfDot = responseChunks.indexOf('.')
  const indexOfQuestion = responseChunks.indexOf('?')
  return Math.min(indexOfDot === -1 ? Infinity : indexOfDot, indexOfQuestion === -1 ? Infinity : indexOfQuestion) + 1
}
