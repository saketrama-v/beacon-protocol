export const calculateUrgency = (signalData: any): string => {
  if (signalData.urgency) {
    return signalData.urgency;
  }

  const { confidence_score, trigger_type, timeout_seconds, metadata } = signalData;

  if (confidence_score !== undefined && confidence_score < 0.3) {
    return 'CRITICAL';
  }

  if (metadata?.estimated_value_at_risk && metadata.estimated_value_at_risk > 10000) {
    return 'CRITICAL';
  }

  let isHigh = false;

  if (confidence_score !== undefined && confidence_score >= 0.3 && confidence_score <= 0.5) {
    isHigh = true;
  }

  if (trigger_type === 'IRREVERSIBLE_ACTION') {
    isHigh = true;
  }

  if (timeout_seconds !== undefined && timeout_seconds < 60) {
    isHigh = true;
  }

  if (metadata?.tags && (metadata.tags.includes('pii') || metadata.tags.includes('financial'))) {
    isHigh = true;
  }

  if (isHigh) {
    return 'HIGH';
  }

  return 'MEDIUM'; // Default fallback
};
