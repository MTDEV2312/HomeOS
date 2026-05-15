import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrDataUrl = await QRCodeLib.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setDataUrl(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    if (value) {
      generateQR();
    }
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div 
        className={`bg-surface-container-lowest animate-pulse ${className}`} 
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={dataUrl}
      alt="Código QR"
      className={className}
      width={size}
      height={size}
      unoptimized
    />
  );
}