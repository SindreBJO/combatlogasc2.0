export const timeBetweenMsInSeconds = (start, end) => {
  if (!start || !end) return null;
  return end - start;
}