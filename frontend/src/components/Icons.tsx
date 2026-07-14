interface IconProps {
  size?: number
  color?: string
  style?: React.CSSProperties
}

const d = (size = 16, color = 'currentColor', style?: React.CSSProperties) => ({
  width: size, height: size, display: 'inline-block',
  verticalAlign: 'middle', flexShrink: 0,
  style,
  fill: 'none', stroke: color, strokeWidth: 1.5,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

export const IconUser = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

export const IconList = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
)

export const IconAlert = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

export const IconCheck = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

export const IconX = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export const IconClock = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export const IconCamera = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
)

export const IconBolt = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

export const IconDocument = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

export const IconShield = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export const IconSun = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

export const IconCloud = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
  </svg>
)

export const IconMoon = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)

export const IconChevronUp = ({ size = 12, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
)

export const IconChevronDown = ({ size = 12, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
)

export const IconArrowRight = ({ size = 12, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
)

export const IconArrowLeft = ({ size = 12, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

export const IconLogout = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

export const IconDot = ({ size = 8, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'inline-block', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="6" fill={color} />
  </svg>
)

export const IconExternalLink = ({ size = 12, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
)

export const IconPlus = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

export const IconSearch = ({ size = 14, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

export const IconPdf = ({ size = 16, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...d(size, color)}>
    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

export const IconHexagon = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.5} style={{ display: 'inline-block', flexShrink: 0 }}>
    <path d="M21 16.5L12 21.75 3 16.5v-9L12 2.25l9 5.25v9z" />
  </svg>
)