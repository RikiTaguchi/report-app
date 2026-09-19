export type IconProps = {
  className?: string;
};

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15 14c2.4 0 4.5 1.7 5 4" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.5 6.5h10" />
      <path d="M9.5 12h10" />
      <path d="M9.5 17.5h10" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 3.5h8l3 3v14h-11z" />
      <path d="M14.5 3.5v3h3" />
      <path d="M9 12h6" />
      <path d="M9 15.5h6" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5.5h16v10.2H10.8L6 19.2v-3.5H4z" />
      <path d="M8 9.3h8" />
      <path d="M8 12.3h5" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.8v2.4M12 17.8v2.4M4.6 7l2 1.2M17.4 15.8l2 1.2M4.6 17l2-1.2M17.4 8.2l2-1.2M3.8 12h2.4M17.8 12h2.4" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 3.5H5.5v17H9" />
      <path d="M20.5 12h-11" />
      <path d="M16 7.5 20.5 12 16 16.5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
}

export function HeartIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg
      {...base}
      fill={filled ? "currentColor" : "none"}
      strokeWidth={filled ? 0 : base.strokeWidth}
      className={className}
    >
      <path d="M12 20.2s-7.5-4.6-9.8-9.2C1 8.1 2.3 4.9 5.4 4c2.3-.7 4.6.3 6.6 2.6C14 4.3 16.3 3.3 18.6 4c3.1.9 4.4 4.1 3.2 7-2.3 4.6-9.8 9.2-9.8 9.2z" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.3l2.4 2.4 5-5.4" />
    </svg>
  );
}

export function EllipsisIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FireIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21c-4 0-6.8-2.6-6.8-6.3 0-2.6 1.4-4.3 2.6-5.9-.2 1.6.4 2.6 1.2 3-0.3-3 1-5.4 3.4-7.3.4 2 1 3.2 2.4 4.6 1.6 1.6 2.8 3.2 2.8 5.6 0 3.7-2.6 6.3-5.6 6.3z" />
      <path d="M12 21c-1.6 0-2.8-1.1-2.8-2.7 0-1.3.8-2.1 1.4-2.9 0 .8.4 1.3.9 1.5-.1-1.3.5-2.3 1.5-3 .1 1 .4 1.6 1 2.2.7.7 1.2 1.4 1.2 2.3 0 1.6-1.4 2.6-3.2 2.6z" />
    </svg>
  );
}

export function AlertCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v6" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.6 2.1" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </svg>
  );
}
