import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const DASHBOARD_URL = 'https://nexusflowai.tech';

interface TenantGuardProps {
  children: ReactNode;
}

export function TenantGuard({ children }: TenantGuardProps) {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!userId || userId.trim() === '' || userId === 'default-tenant') {
      setRedirecting(true);
      window.location.replace(DASHBOARD_URL);
    }
  }, [userId]);

  if (!userId || userId.trim() === '' || userId === 'default-tenant' || redirecting) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirigiendo al Dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
