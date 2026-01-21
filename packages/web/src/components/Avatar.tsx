import { ComponentChildren } from 'preact'
import './Avatar.css'

export interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'small' | 'medium' | 'large' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
  className?: string
}

export function Avatar({
  src,
  alt = '',
  initials,
  size = 'medium',
  status,
  className = '',
}: AvatarProps) {
  const avatarClass = [
    'avatar',
    `avatar-${size}`,
    status ? 'avatar-with-status' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={avatarClass}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <span>{initials || alt.charAt(0).toUpperCase()}</span>
      )}
      {status && <span className={`avatar-status avatar-status-${status}`} />}
    </div>
  )
}

export interface AvatarGroupProps {
  children: ComponentChildren
  className?: string
}

export function AvatarGroup({
  children,
  className = '',
}: AvatarGroupProps) {
  return <div className={`avatar-group ${className}`}>{children}</div>
}
