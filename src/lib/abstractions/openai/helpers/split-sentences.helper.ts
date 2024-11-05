export function splitSentences(paragraph: string): string[] {
  if (!paragraph) {
    return []
  }

  // Use a regular expression to split the paragraph at "!", "?", or "." followed by a space or end of string
  const sentences = paragraph.split(/(?<=[.!?])\s+/)

  // Trim each sentence to remove any leading or trailing whitespace
  return sentences.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 0)
}
