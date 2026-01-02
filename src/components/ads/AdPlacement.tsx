import { useEffect, useRef } from 'react';

interface AdPlacementProps {
  provider: 'adsense' | 'exoclick' | 'propeller';
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

const AdPlacement = ({ provider, slot, format = 'auto', className = '' }: AdPlacementProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load ad script based on provider
    if (provider === 'adsense' && adRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [provider]);

  if (provider === 'adsense') {
    return (
      <div className={`ad-placement ${className}`} ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slot || '0000000000'}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (provider === 'exoclick') {
    return (
      <div className={`ad-placement ${className}`} ref={adRef}>
        {/* Exoclick ad zone */}
        <div id={`exo-zone-${slot || 'default'}`} />
      </div>
    );
  }

  if (provider === 'propeller') {
    return (
      <div className={`ad-placement ${className}`} ref={adRef}>
        {/* Propeller Ads zone */}
        <div id={`propeller-zone-${slot || 'default'}`} />
      </div>
    );
  }

  // Fallback placeholder
  return (
    <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center ${className}`}>
      <p className="text-sm text-gray-500 font-medium">Advertisement</p>
      <p className="text-xs text-gray-400 mt-1">{provider.toUpperCase()}</p>
    </div>
  );
};

export default AdPlacement;
