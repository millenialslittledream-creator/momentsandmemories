interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <p className="font-display text-[10px] tracking-[0.32em] uppercase text-[#9cb092]/70">
      Step {current} of {total}
    </p>
  );
}
