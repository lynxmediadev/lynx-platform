type Props = {
  index?: number;
  total?: number;
  label?: string;
};

export default function HomeOptionIndicator({ index, total, label }: Props) {
  return (
    <div className="absolute bottom-4 left-4 z-20 border border-border bg-background px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-foreground shadow-sm">
      {label ?? `Home option ${index}/${total}`}
    </div>
  );
}
