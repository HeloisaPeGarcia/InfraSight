export function Metric({ label, value, helper, tone = 'neutral' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  )
}

export function PanelHeader({ title, meta, tooltip }) {
  return (
    <div className="panelHeader">
      <div className="panelTitle">
        <h2>{title}</h2>
        {tooltip && <Tooltip label={tooltip}>?</Tooltip>}
      </div>
      <span>{meta}</span>
    </div>
  )
}

const providerClass = {
  AWS: 'providerAws',
  GCP: 'providerGcp',
  Azure: 'providerAzure',
  Other: 'providerOther',
}

export function ProviderPill({ provider, children }) {
  return <span className={`providerPill ${providerClass[provider] || 'providerOther'}`}>{children || provider}</span>
}

export function Toasts({ toasts }) {
  return (
    <div className="toastStack">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export function Tooltip({ label, children }) {
  return (
    <span className="tooltip" tabIndex="0">
      {children}
      <span className="tooltipBubble" role="tooltip">{label}</span>
    </span>
  )
}
