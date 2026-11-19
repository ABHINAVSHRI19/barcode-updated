/**
 * Instrument definitions with everyday human-readable names
 * and internal reference rules.
 */
export const INSTRUMENT_TYPES = [
  {
    id: 'shop_scale',
    name: 'Shop Scale',
    internalClass: 'OIML Class III',
    reference: 1000,
    unit: 'grams',
    allowedDiff: 5,
    sampleValues: [998, 1002, 994, 1000, 1004, 991]
  },
  {
    id: 'gold_scale',
    name: 'Gold Scale',
    internalClass: 'OIML Class II',
    reference: 1000,
    unit: 'grams',
    allowedDiff: 0.5,
    sampleValues: [1000.2, 999.8, 1000.0, 1001.2, 998.9]
  },
  {
    id: 'petrol_meter',
    name: 'Petrol Pump Meter',
    internalClass: 'OIML Class I',
    reference: 10.00,
    unit: 'liters',
    allowedDiff: 0.05,
    sampleValues: [9.98, 10.01, 9.91, 10.00, 9.89]
  }
];

export function getInstrumentConfig(typeIdOrName) {
  return INSTRUMENT_TYPES.find(
    inst => inst.id === typeIdOrName || inst.name === typeIdOrName
  ) || INSTRUMENT_TYPES[0];
}

/**
 * Compare scale reading against reference value.
 * Calculates exact deviation amount and allowed range.
 */
export function evaluateReading(instrumentTypeId, numericValue) {
  const config = getInstrumentConfig(instrumentTypeId);
  const rawDiff = numericValue - config.reference;
  const absDiff = Math.abs(rawDiff);
  const isGood = absDiff <= config.allowedDiff;

  const formattedDiff = absDiff.toFixed(config.unit === 'liters' ? 2 : 1);
  const signedSign = rawDiff >= 0 ? '+' : '-';
  const signedDiffText = `${signedSign}${formattedDiff} ${config.unit}`;
  const allowedRangeText = `±${config.allowedDiff} ${config.unit}`;

  let deviationStatusText = '';
  let summaryText = '';
  let shopkeeperGuidance = '';

  if (isGood) {
    deviationStatusText = `Deviation: ${signedDiffText} (Within safe range of ${allowedRangeText})`;
    summaryText = `This scale is accurate and safe for customers to use.`;
    shopkeeperGuidance = `Your scale is working accurately. No calibration needed right now.`;
  } else {
    deviationStatusText = `Deviation: ${signedDiffText} (Exceeds safe limit of ${allowedRangeText})`;
    summaryText = `This scale is off by ${formattedDiff} ${config.unit} and exceeds the safe limit.`;
    shopkeeperGuidance = `Unaware of your scale's condition? Your scale needs re-calibration. Tap 'Find Nearest Office' to get directions to your nearest Legal Metrology center.`;
  }

  return {
    status: isGood ? 'GOOD' : 'NOT OK',
    isGood,
    reading: numericValue,
    reference: config.reference,
    unit: config.unit,
    allowedDiff: config.allowedDiff,
    diff: Number(absDiff.toFixed(2)),
    signedDiffText,
    allowedRangeText,
    deviationStatusText,
    summaryText,
    shopkeeperGuidance,
    instrumentName: config.name
  };
}
