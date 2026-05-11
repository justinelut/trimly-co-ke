/**
 * StepsRail — top breadcrumb showing the five wizard steps and the
 * customer's current position. Pure presentational; no state.
 */
type StepKey = "city" | "service" | "slot" | "address" | "payment";

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: "city", label: "01 City" },
  { key: "service", label: "02 Service" },
  { key: "slot", label: "03 Date" },
  { key: "address", label: "04 Address" },
  { key: "payment", label: "05 Pay" },
];

export function StepsRail({ current }: { current: StepKey }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="t-steps-rail">
      {STEPS.map((s, i) => {
        const cls =
          i < currentIndex
            ? "t-steps-rail__item t-steps-rail__item--done"
            : i === currentIndex
              ? "t-steps-rail__item t-steps-rail__item--active"
              : "t-steps-rail__item";
        return (
          <li key={s.key} className={cls}>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

export type { StepKey };
