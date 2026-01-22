import { h } from 'preact'
import { BetControlStrip } from './BetControlStrip'

export default {
  title: 'Molecules/BetControlStrip',
  component: BetControlStrip,
}

export const Default = () => (
  <BetControlStrip
    betScope="Migrate auth to Supabase."
    scopeCutBadges={['No UI redesign.', 'No role model changes.']}
    appetite="4 weeks"
    currentDay={8}
    totalDays={20}
    hillState={35}
    scopeCutsCount={3}
    onHistoryClick={() => console.log('History clicked')}
    onCutScopeClick={() => console.log('Cut scope clicked')}
    onEditBetClick={() => console.log('Edit bet clicked')}
  />
)

export const EarlyStage = () => (
  <BetControlStrip
    betScope="Build user onboarding flow."
    scopeCutBadges={['Skip email verification for MVP.']}
    appetite="2 weeks"
    currentDay={2}
    totalDays={10}
    hillState={15}
    scopeCutsCount={1}
    onHistoryClick={() => {}}
    onCutScopeClick={() => {}}
    onEditBetClick={() => {}}
  />
)

export const LateStage = () => (
  <BetControlStrip
    betScope="Implement payment processing."
    scopeCutBadges={[]}
    appetite="6 weeks"
    currentDay={38}
    totalDays={42}
    hillState={85}
    scopeCutsCount={0}
    onHistoryClick={() => {}}
    onCutScopeClick={() => {}}
    onEditBetClick={() => {}}
  />
)

export const NoScopeCuts = () => (
  <BetControlStrip
    betScope="Add dark mode support to all pages."
    appetite="1 week"
    currentDay={3}
    totalDays={7}
    hillState={50}
    scopeCutsCount={0}
    onHistoryClick={() => {}}
    onCutScopeClick={() => {}}
    onEditBetClick={() => {}}
  />
)

export const ManyScopeCuts = () => (
  <BetControlStrip
    betScope="Build comprehensive admin dashboard."
    scopeCutBadges={[
      'No advanced analytics.',
      'No CSV export.',
      'No custom themes.',
      'No realtime updates.'
    ]}
    appetite="8 weeks"
    currentDay={45}
    totalDays={56}
    hillState={70}
    scopeCutsCount={4}
    onHistoryClick={() => {}}
    onCutScopeClick={() => {}}
    onEditBetClick={() => {}}
  />
)

export const JustStarted = () => (
  <BetControlStrip
    betScope="Create API documentation site."
    appetite="3 weeks"
    currentDay={1}
    totalDays={21}
    hillState={5}
    scopeCutsCount={0}
    onHistoryClick={() => {}}
    onCutScopeClick={() => {}}
    onEditBetClick={() => {}}
  />
)
