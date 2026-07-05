import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center rounded-full bg-[#1a1a1c] hover:bg-[#2a2a2e] transition-colors border border-white/5"
      style={{
        width: 'clamp(32px, 3.5vw, 48px)',
        height: 'clamp(32px, 3.5vw, 48px)',
        flexShrink: 0
      }}
      aria-label="Copy to clipboard"
      title="Copy email address"
    >
      {copied ? (
        <FiCheck className="text-green-400" style={{ width: '45%', height: '45%' }} />
      ) : (
        <FiCopy className="text-text-dim" style={{ width: '45%', height: '45%' }} />
      )}
    </button>
  );
}
