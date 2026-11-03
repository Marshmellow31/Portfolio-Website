import androidScreen from '../../assets/paymatrix/screens/android-mobile.webp';
import './PayMatrixPreview.css';

export default function PayMatrixPreview({ priority = false }) {
  return (
    <figure className="paymatrix-preview">
      <img
        src={androidScreen}
        alt="paymatrix dashboard showing a fictional overall balance, bill scanner shortcut, and people to settle up with"
        width={250}
        height={555}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      <figcaption>paymatrix for Android · Fictional demo data</figcaption>
    </figure>
  );
}
