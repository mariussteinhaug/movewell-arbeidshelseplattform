import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function toBool(v) {
  // shadcn Checkbox kan gi true/false/"indeterminate"
  return v === true;
}

export default function QuestionRenderer({ question, answer, onAnswer }) {
  const [localAnswer, setLocalAnswer] = React.useState(answer ?? "");
  const [multiAnswers, setMultiAnswers] = React.useState(
    Array.isArray(answer) ? answer : answer ? [answer] : []
  );

  // Sync når enten spørsmål eller answer endrer seg
  React.useEffect(() => {
    setLocalAnswer(answer ?? "");
    setMultiAnswers(Array.isArray(answer) ? answer : answer ? [answer] : []);
  }, [question?.question_id, answer]);

  const handleSingleChange = (value) => {
    setLocalAnswer(value);
    onAnswer?.(value === "" ? null : value);
  };

  const handleMultiChange = (option, checked) => {
    const isChecked = toBool(checked);
    const newAnswers = isChecked
      ? Array.from(new Set([...multiAnswers, option]))
      : multiAnswers.filter((a) => a !== option);

    setMultiAnswers(newAnswers);
    onAnswer?.(newAnswers.length > 0 ? newAnswers : null);
  };

  // SCALE (supports question.scale)
  if (question?.answer_type === "scale") {
    const min = Number(question?.scale?.min ?? 1);
    const max = Number(question?.scale?.max ?? 5);
    const step = Number(question?.scale?.step ?? 1);

    const minLabel = question?.scale?.min_label ?? "Lav";
    const maxLabel = question?.scale?.max_label ?? "Høy";

    const scaleValues = [];
    for (let v = min; v <= max; v += step) scaleValues.push(v);

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {scaleValues.map((val) => {
            const selected = String(localAnswer) === String(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleSingleChange(String(val))}
                className={cn(
                  "flex-1 min-w-[44px] py-3 rounded-2xl text-sm font-semibold transition",
                  "border",
                  selected
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
                aria-pressed={selected}
              >
                {val}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between text-xs text-slate-500 px-1">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    );
  }

  // CHOICE (Radio)
  if (question?.answer_type === "choice") {
    return (
      <div className="space-y-2">
        <RadioGroup value={localAnswer} onValueChange={handleSingleChange}>
          {question?.answer_options?.map((option, idx) => {
            const id = `${question.question_id}-opt-${idx}`;
            const selected = localAnswer === option;

            return (
              <div
                key={option}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-2xl border transition",
                  selected ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200 hover:bg-slate-50"
                )}
                onClick={() => handleSingleChange(option)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSingleChange(option);
                }}
              >
                <RadioGroupItem value={option} id={id} />
                <Label htmlFor={id} className="flex-1 cursor-pointer text-slate-800">
                  {option}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    );
  }

  // MULTICHOICE (Checkbox)
  if (question?.answer_type === "multichoice") {
    return (
      <div className="space-y-2">
        {question?.answer_options?.map((option, idx) => {
          const id = `${question.question_id}-multi-${idx}`;
          const checked = multiAnswers.includes(option);

          return (
            <div
              key={option}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-2xl border transition",
                checked ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200 hover:bg-slate-50"
              )}
              onClick={() => handleMultiChange(option, !checked)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleMultiChange(option, !checked);
              }}
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(v) => handleMultiChange(option, v)}
              />
              <Label htmlFor={id} className="flex-1 cursor-pointer text-slate-800">
                {option}
              </Label>
            </div>
          );
        })}
      </div>
    );
  }

  // NUMBER
  if (question?.answer_type === "number") {
    return (
      <Input
        type="number"
        value={localAnswer}
        onChange={(e) => handleSingleChange(e.target.value)}
        placeholder={question?.placeholder ?? "Skriv tall..."}
        className="text-base"
        inputMode="numeric"
      />
    );
  }

  // TEXT
  return (
    <Textarea
      value={localAnswer}
      onChange={(e) => handleSingleChange(e.target.value)}
      placeholder={question?.placeholder ?? "Skriv ditt svar her..."}
      rows={4}
      className="text-base"
    />
  );
}
