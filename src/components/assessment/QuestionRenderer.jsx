import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function QuestionRenderer({ question, answer, onAnswer }) {
  const [localAnswer, setLocalAnswer] = React.useState(answer || '');
  const [multiAnswers, setMultiAnswers] = React.useState(
    answer ? (Array.isArray(answer) ? answer : [answer]) : []
  );

  React.useEffect(() => {
    setLocalAnswer(answer || '');
    setMultiAnswers(answer ? (Array.isArray(answer) ? answer : [answer]) : []);
  }, [question.question_id]);

  const handleSingleChange = (value) => {
    setLocalAnswer(value);
    onAnswer(value || null);
  };

  const handleMultiChange = (option, checked) => {
    const newAnswers = checked
      ? [...multiAnswers, option]
      : multiAnswers.filter(a => a !== option);
    setMultiAnswers(newAnswers);
    onAnswer(newAnswers.length > 0 ? newAnswers : null);
  };

  if (question.answer_type === 'scale') {
    const scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {scale.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleSingleChange(val.toString())}
              className={cn(
                "flex-1 min-w-[40px] py-3 rounded-xl text-sm font-medium transition-all",
                localAnswer === val.toString()
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {val}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 px-1">
          <span>Lavest</span>
          <span>Høyest</span>
        </div>
      </div>
    );
  }

  if (question.answer_type === 'choice') {
    return (
      <div className="space-y-2">
        <RadioGroup value={localAnswer} onValueChange={handleSingleChange}>
          {question.answer_options?.map((option) => (
            <div key={option} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
              <RadioGroupItem value={option} id={option} />
              <Label htmlFor={option} className="flex-1 cursor-pointer text-slate-700">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  if (question.answer_type === 'multichoice') {
    return (
      <div className="space-y-2">
        {question.answer_options?.map((option) => (
          <div key={option} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
            <Checkbox
              id={option}
              checked={multiAnswers.includes(option)}
              onCheckedChange={(checked) => handleMultiChange(option, checked)}
            />
            <Label htmlFor={option} className="flex-1 cursor-pointer text-slate-700">
              {option}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  if (question.answer_type === 'number') {
    return (
      <Input
        type="number"
        value={localAnswer}
        onChange={(e) => handleSingleChange(e.target.value)}
        placeholder="Skriv tall..."
        className="text-base"
      />
    );
  }

  // text
  return (
    <Textarea
      value={localAnswer}
      onChange={(e) => handleSingleChange(e.target.value)}
      placeholder="Skriv ditt svar her..."
      rows={4}
      className="text-base"
    />
  );
}