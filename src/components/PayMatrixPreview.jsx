import { useState } from 'react';
import webScreen from '../../assets/paymatrix/screens/web-mobile.webp';
import androidScreen from '../../assets/paymatrix/screens/android-mobile.webp';
import './PayMatrixPreview.css';

const screens = [
  { id: 'web', label: 'Mobile web', detail: 'React · Installable PWA', src: webScreen, width: 412, height: 915 },
  { id: 'android', label: 'Native Android', detail: 'Kotlin · Jetpack Compose', src: androidScreen, width: 720, height: 1506 },
];

export default function PayMatrixPreview({ priority = false }) {
  const [active, setActive] = useState('web');
  return (
    <div className="paymatrix-preview">
      <div className="paymatrix-preview-switch" role="group" aria-label="Preview platform">
        {screens.map((screen) => <button key={screen.id} type="button" aria-pressed={active === screen.id} onClick={() => setActive(screen.id)}>{screen.label}</button>)}
      </div>
      <div className="paymatrix-preview-screens">
        {screens.map((screen) => (
          <figure key={screen.id} className={`paymatrix-preview-screen ${active === screen.id ? 'is-active' : ''}`}>
            <figcaption><strong>{screen.label}</strong><span>{screen.detail}</span></figcaption>
            <img src={screen.src} alt={`Current paymatrix ${screen.label.toLowerCase()} dashboard showing fictional Weekend away demo data`} width={screen.width} height={screen.height} loading={priority ? 'eager' : 'lazy'} decoding="async" />
          </figure>
        ))}
      </div>
      <p className="paymatrix-preview-note">Actual app interfaces. Fictional demo data.</p>
    </div>
  );
}
