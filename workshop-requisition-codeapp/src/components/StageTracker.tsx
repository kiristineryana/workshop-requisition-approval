import { BRAND_NAVY, BRAND_RED, BORDER, TEXT_MUTED } from '../theme';
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
          background = BRAND_NAVY;
          color = '#fff';
          circleBorder = '1.5px solid rgba(255,255,255,.4)';
          circleBg = 'rgba(255,255,255,.25)';
          circleColor = '#fff';
        } else if (isPast) {
          background = '#E6E7EF';
          color = '#757575';
          circleBorder = '1.5px solid #B9BCD0';
          circleBg = 'transparent';
          circleColor = '#757575';
        }

        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              height: 34,
              background,
              color,
              fontSize: 11.5,
              fontWeight: 600,
              flex: 1,
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
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
              {rejectedHere ? <StageRejectedIcon size={12} color={circleColor} /> : <StageIcon size={12} color={circleColor} />}
            </span>
            {rejectedHere ? 'Rejected' : label}
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 11, color: TEXT_MUTED, background: '#fff' }}>
        {isRejected ? 'Process ended' : `Stage ${currentIndex + 1} of ${STAGE_LABELS.length}`}
      </div>
    </div>
  );
}
