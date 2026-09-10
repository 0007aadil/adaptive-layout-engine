import { createCanvasMeasurer, createMetricMeasurer, type TextMeasurer } from '../engine'

/**
 * One measurer for the whole app: the canvas cache is what keeps re-layout on
 * every keystroke cheap.
 */
export const measurer: TextMeasurer =
  typeof document === 'undefined' ? createMetricMeasurer() : createCanvasMeasurer()
