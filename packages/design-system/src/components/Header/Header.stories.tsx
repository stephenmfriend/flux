import { h } from 'preact'
import { Header } from './Header'

export default {
  title: 'Organisms/Header',
  component: Header,
}

export const Simple = () => (
  <Header
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Flux' }
    ]}
    onFeedbackClick={() => console.log('Feedback clicked')}
    onAvatarClick={() => console.log('Avatar clicked')}
  />
)

export const WithBadge = () => (
  <Header
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Flux' },
      { label: 'Q3 Migration', badge: { text: 'EPIC-2023', color: 'green' } }
    ]}
    onFeedbackClick={() => console.log('Feedback clicked')}
    onAvatarClick={() => console.log('Avatar clicked')}
  />
)

export const DeepNesting = () => (
  <Header
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Flux' },
      { label: 'Backend', badge: { text: 'EPIC-100', color: 'green' } },
      { label: 'API Refactor' }
    ]}
    onFeedbackClick={() => console.log('Feedback clicked')}
    onAvatarClick={() => console.log('Avatar clicked')}
  />
)

export const WithGrayBadge = () => (
  <Header
    breadcrumbs={[
      { label: 'Projects' },
      { label: 'Archive', badge: { text: 'CLOSED', color: 'gray' } }
    ]}
    onFeedbackClick={() => console.log('Feedback clicked')}
    onAvatarClick={() => console.log('Avatar clicked')}
  />
)
