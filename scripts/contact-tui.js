/**
 * ============================================================================
 * CONTACT-TUI.JS - Arrow-key navigation for the contact menu
 * ============================================================================
 *
 * Progressive enhancement only. Without this file the rows are still ordinary
 * links: Tab reaches them, Enter follows them, hover and focus still highlight
 * them. This adds the part that makes it behave like an actual TUI - Up/Down
 * moving a cursor - so the keybind hints in the markup are truthful.
 *
 * Implemented as a roving tabindex, the standard pattern for a composite
 * widget: the list is one Tab stop, and arrows move within it. That is fewer
 * tab stops than before, not more.
 *
 * Arrow keys are only intercepted while focus is inside the list, so page
 * scrolling is never hijacked.
 *
 * TO REMOVE: drop the <script> tag. Nothing else references this.
 * ============================================================================
 */

function initContactTui() {
    const list = document.querySelector('.tui-list');
    if (!list) return;

    const rows = Array.from(list.querySelectorAll('.tui-row'));
    if (rows.length === 0) return;

    const counter = document.getElementById('tui-index');
    let index = 0;

    /**
     * Move the cursor to a row: update the highlight, the position readout,
     * and which row is the list's single tab stop.
     * @param {number} next - Row index to select
     * @param {boolean} focus - Whether to also move DOM focus there
     */
    function select(next, focus) {
        index = (next + rows.length) % rows.length;

        rows.forEach((row, i) => {
            const isSelected = i === index;
            row.classList.toggle('is-selected', isSelected);
            row.tabIndex = isSelected ? 0 : -1;
        });

        if (counter) counter.textContent = index + 1;
        if (focus) rows[index].focus();
    }

    list.addEventListener('keydown', (e) => {
        // Let modified keys through: Ctrl+Home, browser shortcuts, etc.
        if (e.altKey || e.ctrlKey || e.metaKey) return;

        let next = null;
        // j/k as well as the arrows, since this is a terminal after all
        if (e.key === 'ArrowDown' || e.key === 'j') next = index + 1;
        else if (e.key === 'ArrowUp' || e.key === 'k') next = index - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = rows.length - 1;
        else return;

        // Only now do we own the key, so ordinary scrolling is untouched
        e.preventDefault();
        select(next, true);
    });

    // Pointer and Tab focus move the cursor too, so the highlight and the
    // position readout can never disagree with where focus actually is.
    rows.forEach((row, i) => {
        row.addEventListener('focus', () => select(i, false));
        row.addEventListener('mouseenter', () => select(i, false));
    });

    select(0, false);
}

document.addEventListener('DOMContentLoaded', initContactTui);
