// Number of travel days between two ISO dates, inclusive (Dec 20 -> Dec 22 = 3 days).
export const tripLength = (start, end) => {
  if (!start || !end) return 0;
  return Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
};
