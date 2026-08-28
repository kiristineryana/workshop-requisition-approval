import {
  BRAND_RED,
  BORDER,
  TEXT_MUTED,
  WHITE,
  STAGE_AMBER,
  STAGE_AMBER_PALE,
  STAGE_AMBER_TEXT,
  STAGE_BLUE,
  STAGE_BLUE_PALE,
  STAGE_BLUE_TEXT,
  GREEN,
  STAGE_GREEN_PALE,
  STAGE_GREEN_TEXT,
} from '../theme';
import { STAGE_LABELS, getStageIndex } from '../lib/choiceMeta';
import {
  StageDraftIcon,
  StageSubmittedIcon,
  StageInApprovalIcon,
  StageApprovedIcon,
  StageOrderedIcon,
  StageReceivedIcon,
  StageRejectedIcon,
} from './icons';

// One glyph per BPF stage, reused verbatim from wireframe 1a's process-flow diagram — the
// per-stage icon variety that the model-driven app's BPF control couldn't render (its category
// picker tops out at 8 built-in icons) is exactly the ceiling this code app rebuild exists to lift.
const STAGE_ICONS = [StageDraftIcon, StageSubmittedIcon, StageInApprovalIcon, StageApprovedIcon, StageOrderedIcon, StageReceivedIcon];

// "Tier spectrum" hue per stage — amber for requester-driven steps (Draft, Submitted), blue for
// automated/routing/fulfillment steps (In Approval, Ordered, Received), green for Approved.
// Matches the updated end-to-end process-flow figure's "one hue per phase" treatment.
const STAGE_HUES = [
  { fill: STAGE_AMBER, pale: STAGE_AMBER_PALE, text: STAGE_AMBER_TEXT, onFill: '#4A3300' },
  { fill: STAGE_AMBER, pale: STAGE_AMBER_PALE, text: STAGE_AMBER_TEXT, onFill: '#4A3300' },
  { fill: STAGE_BLUE, pale: STAGE_BLUE_PALE, text: STAGE_BLUE_TEXT, onFill: WHITE },
  { fill: GREEN, pale: STAGE_GREEN_PALE, text: STAGE_GREEN_TEXT, onFill: WHITE },
  { fill: STAGE_BLUE, pale: STAGE_BLUE_PALE, text: STAGE_BLUE_TEXT, onFill: WHITE },
  { fill: STAGE_BLUE, pale: STAGE_BLUE_PALE, text: STAGE_BLUE_TEXT, onFill: WHITE },
];

export function StageTracker({ status }: { status: number | undefined }) {
  const currentIndex = getStageIndex(status);
  const isRejected = status === 100000004;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 6, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
      {STAGE_LABELS.map((label, i) => {
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const rejectedHere = isRejected && isCurrent;
        const StageIcon = STAGE_ICONS[i];
        const hue = STAGE_HUES[i];

        let background = '#F9F9FB';
        let color = '#B0B0B0';
        let circleBorder = '1.5px solid #DDD';
        let circleBg = 'transparent';
        let circleColor = '#B0B0B0';

        if (rejectedHere) {
          background = '#FFF4F5';
          color = BRAND_RED;
          circleBorder = `1.5px solid ${BRAND_RED}`;
          circleBg = BRAND_RED;
          circleColor = '#fff';
        } else if (isCurrent) {
          background = hue.fill;
          color = hue.onFill;
          circleBorder = `1.5px solid ${hue.onFill === WHITE ? 'rgba(255,255,255,.4)' : 'rgba(74,51,0,.35)'}`;
          circleBg = hue.onFill === WHITE ? 'rgba(255,255,255,.25)' : 'rgba(74,51,0,.15)';
          circleColor = hue.onFill;
        } else if (isPast) {
          background = hue.pale;
          color = hue.text;
          circleBorder = `1.5px solid ${hue.fill}`;
          circleBg = 'transparent';
          circleColor = hue.text;
        }

        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 20px',
              height: 46,
              background,
              color,
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: circleBorder,
                background: circleBg,
                color: circleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {rejectedHere ? <StageRejectedIcon size={15} color={circleColor} /> : <StageIcon size={15} color={circleColor} />}
            </span>
            {rejectedHere ? 'Rejected' : label}
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 13, color: TEXT_MUTED, background: '#fff' }}>
        {isRejected ? 'Process ended' : `Stage ${currentIndex + 1} of ${STAGE_LABELS.length}`}
      </div>
    </div>
  );
}
