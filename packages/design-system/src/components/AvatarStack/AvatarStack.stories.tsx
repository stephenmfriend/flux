import { h } from 'preact'
import { AvatarStack } from './AvatarStack'

export default {
  title: 'Atoms/AvatarStack',
  component: AvatarStack,
}

export const SingleAvatar = () => (
  <div style={{ display: 'flex', padding: '20px' }}>
    <AvatarStack avatars={[{ initials: 'A', color: '#5c6b7f' }]} />
  </div>
)

export const TwoAvatars = () => (
  <div style={{ display: 'flex', padding: '20px' }}>
    <AvatarStack avatars={[
      { initials: 'A', color: '#5c6b7f' },
      { initials: 'M', color: '#d97706' }
    ]} />
  </div>
)

export const ThreeAvatars = () => (
  <div style={{ display: 'flex', padding: '20px' }}>
    <AvatarStack avatars={[
      { initials: 'M', color: '#d97706' },
      { initials: 'S', color: '#5c6b7f' },
      { initials: 'J', color: '#059669' }
    ]} />
  </div>
)

export const DifferentColors = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
    <div style={{ display: 'flex' }}>
      <AvatarStack avatars={[{ initials: 'S', color: '#5c6b7f' }]} />
    </div>
    <div style={{ display: 'flex' }}>
      <AvatarStack avatars={[{ initials: 'J', color: '#059669' }]} />
    </div>
    <div style={{ display: 'flex' }}>
      <AvatarStack avatars={[
        { initials: 'A', color: '#5c6b7f' },
        { initials: 'M', color: '#d97706' }
      ]} />
    </div>
  </div>
)
