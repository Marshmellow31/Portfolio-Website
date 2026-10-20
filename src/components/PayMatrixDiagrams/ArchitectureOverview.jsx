import { FiArrowRight, FiArrowDown } from 'react-icons/fi';

export default function ArchitectureOverview() {
  return (
    <div className="architecture-overview" aria-label="paymatrix architecture overview">
      <div className="architecture-overview-grid">
        <section className="architecture-layer">
          <h4>Browser / PWA</h4>
          <p>React interface</p><FiArrowDown aria-hidden="true" />
          <p>Redux state + local persistence</p><FiArrowDown aria-hidden="true" />
          <p>Service layer</p><FiArrowDown aria-hidden="true" />
          <p>Local split &amp; balance engine</p>
          <span>Financial calculations run on the client.</span>
        </section>
        <section className="architecture-layer">
          <h4>Firebase</h4>
          <p>Auth <span>Identity &amp; custom claims</span></p>
          <p>Firestore <span>Shared ledger &amp; security rules</span></p>
          <p>Cloud Functions <span>Privileged operations &amp; notification triggers</span></p>
          <p>Cloud Messaging <span>Push delivery to the client</span></p>
        </section>
        <section className="architecture-layer">
          <h4>Receipt processing</h4>
          <p>Receipt images from the client</p><FiArrowDown aria-hidden="true" />
          <p>Vercel function <span>/api/scan-bill</span></p><FiArrowDown aria-hidden="true" />
          <p>Google Gemini API</p>
          <span>The API key stays on the server.</span>
        </section>
      </div>
      <div className="architecture-connections" aria-label="Connections between services">
        <p>Client <FiArrowRight aria-hidden="true" /> Firestore <span>SDK reads and writes checked by security rules</span></p>
        <p>Client <FiArrowRight aria-hidden="true" /> Cloud Functions <span>Callable privileged operations</span></p>
        <p>Firestore <FiArrowRight aria-hidden="true" /> Functions <FiArrowRight aria-hidden="true" /> Messaging <span>Notification trigger and push delivery</span></p>
      </div>
    </div>
  );
}
