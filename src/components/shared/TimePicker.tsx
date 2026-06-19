"use client";

interface TimeGroup {
  label: string;
  slots: string[];
}

interface TimePickerProps {
  selectedTime: string;
  onSelectedTimeChange: (time: string) => void;
  busySlots?: Set<string>;
  timeGroups?: TimeGroup[];
}

const DEFAULT_TIME_GROUPS: TimeGroup[] = [
  { label: "Утро", slots: ["09:00", "10:00", "11:00", "12:00"] },
  { label: "День", slots: ["13:00", "14:00", "15:00", "16:00"] },
  { label: "Вечер", slots: ["17:00", "18:00", "19:00", "20:00"] },
];

const DEFAULT_BUSY_SLOTS = new Set(["10:00", "15:00"]);

export default function TimePicker({
  selectedTime,
  onSelectedTimeChange,
  busySlots = DEFAULT_BUSY_SLOTS,
  timeGroups = DEFAULT_TIME_GROUPS,
}: TimePickerProps) {
  return (
    <div>
      <h2 className="text-[18px] font-bold mb-4 text-[var(--text-primary)]">Выбрать время</h2>
      <div className="flex flex-col gap-5">
        {timeGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-[15px] font-bold mb-[10px] text-[var(--text-primary)]">{group.label}</h3>
            <div className="flex flex-wrap gap-[10px]">
              {group.slots.map((slot) => {
                const busy = busySlots.has(slot);
                const selected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={busy}
                    className={`min-w-[72px] px-4 py-[10px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[14px] font-semibold text-[var(--text-primary)] transition-all duration-200
                      ${busy ? "opacity-40 cursor-not-allowed" : "hover:border-[#0a6af7]"}
                      ${selected ? "!bg-[#0a6af7] !border-[#0a6af7] !text-white hover:!bg-[#0856c6]" : ""}
                    `}
                    onClick={() => onSelectedTimeChange(slot)}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
