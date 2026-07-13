import { useRef, useState } from "react";

const PARSE_LINES = [
  "Reading your resume...",
  "Parsing skills...",
  "Matching roles...",
];

export default function DropZone({ onParsed, onFileSelected }) {
  const [state, setState] = useState("idle"); // idle | over | parsing
  const [lineIndex, setLineIndex] = useState(0);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const startParse = async (file) => {
  setFileName(file.name);
  setState("parsing");
  setLineIndex(0);
  const timer = setInterval(() => {
    setLineIndex((i) => (i + 1) % PARSE_LINES.length);
  }, 700);
  try {
    await onFileSelected(file);   // real upload + poll, owned by the page
    clearInterval(timer);
    onParsed?.(file);
  } catch (err) {
    clearInterval(timer);
    setState("error");
  }
};


  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) startParse(file);
    else setState("idle");
  };

  if (state === "error") {
  return (
    <div
      onClick={() => setState("idle")}
      className="cursor-pointer rounded-2xl border-2 border-dashed border-red-300 bg-red-50 p-10 text-center"
    >
      <p className="text-lg font-semibold text-red-600">Upload failed</p>
      <p className="microtype mt-2 text-muted">Tap to try again</p>
    </div>
  );
}
  if (state === "parsing") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-8">
        <div className="scanline pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-tint-blue/60 to-transparent" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ps-gold/20 text-xl">
            📄
          </div>
          <div>
            <p className="font-semibold">{fileName}</p>
            <p className="microtype mt-1 text-ps-blue">{PARSE_LINES[lineIndex]}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setState("over");
      }}
      onDragLeave={() => setState("idle")}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={
        "cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors " +
        (state === "over"
          ? "border-ps-blue bg-tint-blue"
          : "border-line bg-white hover:border-ps-blue/50 hover:bg-tint-blue/40")
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && startParse(e.target.files[0])}
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-ps-gold/20 text-2xl">
        📄
      </div>
      <p className="mt-4 text-lg font-semibold">
        Drag your resume here or <span className="text-ps-blue underline">browse</span>
      </p>
      <p className="microtype mt-2 text-muted">
        PDF · Max 5MB · 2 pages recommended
      </p>
    </div>
  );
}