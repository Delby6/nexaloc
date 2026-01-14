import { motion } from "framer-motion";

export default function DashboardHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}) {
  return (
    <div className="space-y-4">

      {/* Optional breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span>{crumb}</span>
              {idx < breadcrumbs.length - 1 && (
                <span className="text-slate-600">/</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Main header content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Section */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-100"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Section – buttons */}
        {actions && (
          <div className="flex items-center gap-3">{actions}</div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-800"></div>
    </div>
  );
}
