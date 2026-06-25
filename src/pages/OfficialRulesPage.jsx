import { MessagesSquare } from 'lucide-react'
import PageHero from '../components/common/PageHero'
import Seo from '../components/Seo'
import Button from '../components/ui/Button'

const DISCORD_URL = 'https://discord.gg/GJw3XRuCXr'

const rules = [
  {
    title: 'Free to enter',
    body: 'All GripCafe challenges are free-to-enter. No purchase is required to join any event, and no entry fee is charged.',
  },
  {
    title: 'Skill-based scoring',
    body: 'Results are determined by skill-based performance — fastest lap time, highest drift score, best photo entry, or other objective metrics defined per event. Outcomes do not depend on chance.',
  },
  {
    title: 'Proof required',
    body: 'Every submission must include a screenshot or video clip as proof. Submissions without proof will not be accepted.',
  },
  {
    title: 'One entry per event',
    body: 'Each participant may submit one entry per event unless the event rules explicitly allow additional attempts. Only one approved submission counts toward the leaderboard.',
  },
  {
    title: 'Steward review required',
    body: 'All submissions are reviewed by a club steward or organizer before appearing on the verified leaderboard. Entries are checked for accuracy, rule compliance, and proof integrity.',
  },
  {
    title: 'Proof may be rejected',
    body: 'Organizers may reject submissions that contain edited, unverifiable, or rule-breaking proof. Decisions by the reviewing steward are final for that event.',
  },
  {
    title: 'Community rewards',
    body: 'Sponsored events may offer a community reward such as a gift card. Rewards are subject to eligibility, verification, and event rules. No cash payout is offered.',
  },
  {
    title: 'Void where prohibited',
    body: 'Participation is void where prohibited by law. It is the participant\'s responsibility to ensure compliance with local regulations.',
  },
]

export default function OfficialRulesPage() {
  return (
    <div>
      <Seo
        title="Official Rules"
        description="Official rules for GripCafe free-to-enter sim racing challenges. Proof requirements, steward review, and community reward terms."
        path="/official-rules"
      />
      <PageHero
        eyebrow="Rules"
        title="Official Rules"
        description="The basics for every free-to-enter challenge on GripCafe. Individual events may add specific rules."
      />
      <div className="container-page py-10">
        <div className="mx-auto max-w-2xl space-y-5">
          {rules.map((r, i) => (
            <div key={r.title} className="card-readable rounded-xl p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] font-num text-sm font-bold text-brand-400">
                  {i + 1}
                </span>
                <div>
                  <h2 className="font-semibold text-white">{r.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{r.body}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="card-readable rounded-xl p-5 text-center">
            <h2 className="font-semibold text-white">Questions?</h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              Reach out on Discord if you have questions about rules or an event.
            </p>
            <div className="mt-4">
              <Button href={DISCORD_URL} variant="secondary">
                <MessagesSquare className="h-4 w-4" />
                Join Discord
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-600">
            These rules are provided for community clarity and are not legal advice. GripCafe is an unofficial, fan-made project.
          </p>
        </div>
      </div>
    </div>
  )
}
