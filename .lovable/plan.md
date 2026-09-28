## Goal

On the Khmer Traditional cover, reduce the guest name on the gold plate by another 30% and let the plate's height shrink to fit the name with just a little vertical padding.

## Changes — `src/components/templates/KhmerTraditionalCover.tsx`

1. **Smaller name**
   - In the auto-fit `useEffect`, change the final scale multiplier from `* 0.7` to `* 0.49` (70% of the current 0.7 = ~0.49).
   - Keep the existing fit-to-width and minimum-scale logic.

2. **Plate hugs the name**
   - Remove the fixed `minHeight: 90` on the plate wrapper so it can shrink.
   - Reduce vertical padding from `14px 44px` to roughly `6px 44px` so there is just a small breathing space above/below the name.
   - Keep `backgroundSize: "100% 100%"` so the gold plate graphic stretches to the new, shorter height (the plate art is a 9-slice-style frame and visually tolerates a shorter aspect ratio).
   - Reduce the inline `lineHeight` on the name span from `1.65` to `1.2` and trim its vertical padding (`0.14em 0 0.18em` → `0`) so the measured text box is tight and the plate can actually become shorter.

3. **No other visual changes**
   - Background, name graphic, "សូមគោរពអញ្ជើញ" caption, and the "បើកធៀប" button stay exactly as they are.

## Notes

- The auto-fit logic already re-runs on resize and after Khmer fonts load, so the smaller text will still be re-fitted correctly on iOS/Android.
- If, after seeing it live, the plate looks too squished vertically for short names, we can bump the vertical padding back up by 2-4px — easy follow-up tweak.
