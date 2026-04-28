export default function DashboardGrid({ children, className = '' }) {
  return (
    <div className={`dashboard-grid ${className}`}>
      {children}
    </div>
  );
}
