import { useSearchParams } from 'react-router-dom';

export function useTenant() {
  const [searchParams] = useSearchParams();
  
  const userId = searchParams.get('userId') || '';
  const brandLogo = searchParams.get('brandLogo') || null;
  const brandName = searchParams.get('brandName') || null;

  /** Current search string (e.g. "?userId=abc&brandName=Acme") to append on internal navigation */
  const searchString = searchParams.toString();

  return { userId, brandLogo, brandName, searchString };
}
