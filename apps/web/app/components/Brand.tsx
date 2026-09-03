/* eslint-disable @next/next/no-img-element -- a marca usa os arquivos oficiais do projeto */

export function Brand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  const source = compact
    ? "/img/logofixsi-icon-tight.png"
    : inverse
      ? "/img/logofixsi-white-tight.png"
      : "/img/logofixsi-horizontal-tight.png";

  return (
    <span className="inline-flex items-center" aria-label="Fixsi">
      <img
        src={source}
        alt="Fixsi"
        className={
          compact ? "h-10 w-10 object-contain" : "h-14 w-auto object-contain"
        }
      />
    </span>
  );
}
