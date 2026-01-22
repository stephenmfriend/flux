import { h } from 'preact'
import { Tag } from './Tag'

export default {
  title: 'Atoms/Tag',
  component: Tag,
}

export const Purple = () => <Tag color="purple">UX</Tag>
export const Blue = () => <Tag color="blue">Auth</Tag>
export const Orange = () => <Tag color="orange">Research</Tag>
export const Green = () => <Tag color="green">Frontend</Tag>
export const Red = () => <Tag color="red">Bug</Tag>

export const AllColors = () => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '20px' }}>
    <Tag color="purple">UX</Tag>
    <Tag color="blue">Auth</Tag>
    <Tag color="orange">Research</Tag>
    <Tag color="green">Frontend</Tag>
    <Tag color="red">Bug</Tag>
  </div>
)

export const InGroup = () => (
  <div className="task-tags" style={{ display: 'flex', gap: '6px', padding: '20px' }}>
    <Tag color="purple">Design</Tag>
    <Tag color="orange">Setup</Tag>
    <Tag color="green">Backend</Tag>
  </div>
)
