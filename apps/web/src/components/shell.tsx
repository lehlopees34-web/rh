import { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  description: string;
};

type HeaderAction = {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
};

export function AppSidebar({
  title,
  subtitle,
  eyebrow,
  items,
  activeId,
  onSelect,
  footer,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  footer: ReactNode;
}) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">AR</div>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={item.id === activeId ? "nav-item active" : "nav-item"}
            onClick={() => onSelect(item.id)}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer-panel">{footer}</div>
    </aside>
  );
}

export function Topbar({
  eyebrow,
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  breadcrumb: string;
  actions?: HeaderAction[];
}) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        <p className="eyebrow">{eyebrow}</p>
        <div className="topbar-title-row">
          <h2>{title}</h2>
          <span className="topbar-breadcrumb">{breadcrumb}</span>
        </div>
        <p>{subtitle}</p>
      </div>

      {actions?.length ? (
        <div className="topbar-actions">
          {actions.map((action) => (
            <button
              key={action.id}
              className={`app-button ${action.variant ?? "secondary"}`}
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function GlassPanel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel ${className}`.trim()}>
      {title || subtitle || action ? (
        <div className="panel-header">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action ? <div className="panel-header-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

export function HeroBanner({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside: ReactNode;
}) {
  return (
    <section className="hero-banner">
      <div className="hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="hero-aside">{aside}</div>
    </section>
  );
}

export function DataToolbar({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="data-toolbar">{children}</div>;
}
