/**
 * Semantic color tokens for the Simsim dashboard.
 *
 * All color values map to Tailwind CSS classes — never use raw hex or hsl() in
 * component files. Reference these constants instead.
 *
 * Usage:
 *   import { colors } from '@/lib/colors';
 *   <div className={colors.status.approved} />
 */

/** Tailwind background + text class pairs for approval/scan/request statuses */
export const statusColors = {
  // Membership approval
  approved: 'bg-green-50 text-green-700',
  pending:  'bg-yellow-50 text-yellow-700',
  rejected: 'bg-red-50 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',

  // Scan result
  granted: 'bg-green-50 text-green-700',
  denied:  'bg-red-50 text-red-600',

  // Service request
  open:        'bg-blue-50 text-blue-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  resolved:    'bg-green-50 text-green-700',
  closed:      'bg-gray-100 text-gray-500',

  // User status
  active:   'bg-green-50 text-green-700',
  invited:  'bg-yellow-50 text-yellow-700',
} as const;

/** Badge variant mapping from status string to CVA variant name */
export const statusVariant = {
  approved:    'success',
  granted:     'success',
  active:      'success',
  resolved:    'success',
  pending:     'warning',
  invited:     'warning',
  in_progress: 'warning',
  open:        'default',
  rejected:    'error',
  denied:      'error',
  suspended:   'muted',
  closed:      'muted',
} as const satisfies Record<string, 'success' | 'warning' | 'error' | 'default' | 'muted'>;

/** Brand palette (maps to tailwind.config brand.* keys) */
export const brand = {
  bg:         'bg-brand-500',
  bgLight:    'bg-brand-50',
  text:       'text-brand-700',
  textDark:   'text-brand-900',
  border:     'border-brand-500',
  ring:       'ring-brand-500',
  hoverBg:    'hover:bg-brand-50',
} as const;

/** Neutral surface colors */
export const surface = {
  page:    'bg-gray-50',
  card:    'bg-white border border-gray-200',
  sidebar: 'bg-white border-r border-gray-200',
  header:  'bg-gray-50 border-b border-gray-200',
} as const;
