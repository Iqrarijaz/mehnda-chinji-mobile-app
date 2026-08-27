export const Layout = {
    borderRadius: 12,
    headerBorderRadius: 20,
    cardBorderRadius: 16,
    spacing: 18,
    padding: 18,
    modalBorderRadius: 20,

    // Button sizing.
    //
    // One height per button class, so controls line up wherever they appear
    // and no screen invents its own measurement. Buttons carry no border:
    // emphasis comes from fill and text colour, which also keeps the box the
    // same size in every state (a border toggled on selection would otherwise
    // shift the content inside it).
    buttonHeight: 48,     // full-width and primary actions
    pillHeight: 36,       // segmented controls, filter pills, toggles
    iconButtonSize: 36,   // square icon touch targets
};
