import { Handshake } from "lucide-react";

export function Brand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Serveo">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${inverse ? "bg-white/15 text-white" : "bg-[#F97316] text-white"}`}
      >
        <Handshake size={22} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span
          className={`text-2xl font-extrabold tracking-[-.04em] ${inverse ? "text-white" : "text-[#17233B]"}`}
        >
          Serveo<span className="text-[#FFB15A]">.</span>
        </span>
      )}
    </span>
  );
}
