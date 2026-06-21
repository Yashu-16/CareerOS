/**
 * A deliberately explicit list rather than a fuzzy NLP classifier — for an
 * ATS location string, exact/substring matching against known Indian cities
 * is more reliable than trying to be clever, and it's auditable.
 */
export const INDIAN_CITIES = [
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Delhi',
  'New Delhi',
  'Gurugram',
  'Gurgaon',
  'Noida',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Nagpur',
  'Indore',
  'Surat',
  'Chandigarh',
  'Kochi',
  'Cochin',
  'Lucknow',
  'Coimbatore',
  'Vadodara',
  'Visakhapatnam',
  'Bhopal',
  'Thiruvananthapuram',
  'Trivandrum',
  'Mysuru',
  'Mysore',
];

const NCR_ALIASES = ['Gurugram', 'Gurgaon', 'Noida', 'New Delhi', 'Delhi'];

export function detectIndianCity(locationRaw: string | null | undefined): string | null {
  if (!locationRaw) return null;
  const haystack = locationRaw.toLowerCase();

  for (const city of INDIAN_CITIES) {
    if (haystack.includes(city.toLowerCase())) {
      if (NCR_ALIASES.includes(city)) return 'Delhi NCR';
      if (city === 'Bangalore') return 'Bengaluru';
      if (city === 'Cochin') return 'Kochi';
      if (city === 'Trivandrum') return 'Thiruvananthapuram';
      if (city === 'Mysore') return 'Mysuru';
      return city;
    }
  }

  if (haystack.includes('india') && !haystack.includes('indianapolis')) {
    return 'India (Other)';
  }

  return null;
}

export function isIndiaRelevant(locationRaw: string | null | undefined, remoteAllowed: boolean): boolean {
  if (detectIndianCity(locationRaw)) return true;
  if (!locationRaw) return false;
  const haystack = locationRaw.toLowerCase();
  if (remoteAllowed && haystack.includes('remote') && (haystack.includes('india') || haystack === 'remote')) {
    return true;
  }
  return false;
}
