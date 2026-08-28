/**
 * Shared brand palette and type stack — matches the wireframe exactly (same values used in the
 * model-driven app's genpage dashboard and Dataverse theme this session).
 */
export const BRAND_NAVY = '#181059';
export const BRAND_RED = '#D42A41';
export const GOLD = '#F5B128';
export const GREEN = '#34C759';
export const PERIWINKLE = '#7A81BE';
export const SUBMITTED_BLUE = '#5B63A8';
export const GREY_BLUE = '#B9BCD0';

// "Tier spectrum" stage palette — one hue per phase, per the updated process-flow diagram:
// amber for requester-driven steps, blue for automated/routing/fulfillment steps, green for
// the Approved milestone. Rejected uses BRAND_RED above.
export const STAGE_AMBER = GOLD;
export const STAGE_AMBER_PALE = '#FDF3DC';
export const STAGE_AMBER_TEXT = '#8A6100';
export const STAGE_BLUE = '#3E8EDE';
export const STAGE_BLUE_PALE = '#E8F1FC';
export const STAGE_BLUE_TEXT = '#1D5DA6';
export const STAGE_GREEN_PALE = '#E8F8ED';
export const STAGE_GREEN_TEXT = '#1F9D45';

export const SURFACE_MUTED = '#F3F4F6';
export const BORDER = '#D9D9D9';
export const TEXT_PRIMARY = '#353A40';
export const TEXT_MUTED = '#757575';
export const WHITE = '#FFFFFF';

// Body copy, labels, and values throughout the wireframe are set in Open Sans; primary
// call-to-action buttons (Submit for approval, Approve, Reject) use the heavier Nunito Sans.
export const FONT_BODY = "'Open Sans', Segoe UI, system-ui, sans-serif";
export const FONT_DISPLAY = "'Nunito Sans', 'Open Sans', Segoe UI, system-ui, sans-serif";
