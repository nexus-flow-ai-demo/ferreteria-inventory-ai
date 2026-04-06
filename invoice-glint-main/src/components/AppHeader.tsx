import { useTenant } from '@/hooks/useTenant';
import defaultLogo from '@/assets/logo-default.png';

export function AppHeader() {
  const { brandLogo, brandName } = useTenant();

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 bg-card/80 backdrop-blur-md border-b border-border">
      <img
        src={brandLogo || defaultLogo}
        alt={brandName || 'Nexus Flow AI'}
        className="h-8 w-8 rounded-md object-contain"
      />
      <span className="text-sm font-semibold text-foreground">
        {brandName || 'Nexus Flow AI'}
      </span>
    </header>
  );
}
