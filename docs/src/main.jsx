import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startNodeNetwork } from './backgrounds/nodeNetwork.js'

// ── Inject base CSS ────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  body { background: #060e0c; margin: 0; }

  body::before {
    content: '';
    position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background-image: radial-gradient(circle, rgba(0,255,160,0.05) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  body::after {
    content: '';
    position: fixed; inset: 0; z-index: 998; pointer-events: none;
    background: radial-gradient(ellipse 120% 120% at 50% 50%,
      transparent 38%, rgba(4,10,9,0.92) 100%);
  }

  #scanlines {
    position: fixed; inset: 0; z-index: 999; pointer-events: none;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
    );
  }
`;
document.head.appendChild(style);

const scanlines = document.createElement('div');
scanlines.id = 'scanlines';
document.body.prepend(scanlines);

startNodeNetwork();

// ── React app ─────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#ef4444', padding: 40, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <b>Runtime error:</b>{'\n'}{this.state.error?.message}{'\n\n'}{this.state.error?.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
)
