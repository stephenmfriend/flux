import { h } from 'preact'
import './AvatarStack.css'

export interface Avatar {
  initials: string
  color: string
}

export interface AvatarStackProps {
  avatars: Avatar[]
}

export function AvatarStack({ avatars }: AvatarStackProps) {
  return (
    <>
      {avatars.map((avatar, i) => (
        <div key={i} className="avatar-stack" style={{ background: avatar.color }}>
          {avatar.initials}
        </div>
      ))}
    </>
  )
}
