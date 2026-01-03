import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, Heart, Shield, TrendingUp } from "lucide-react";

const feedbackMessages = [
  { icon: Heart, text: "Takk for at du deler.", color: "text-emerald-700" },
  { icon: CheckCircle2, text: "Notert. Dette hjelper oss å forstå bedre.", color: "text-slate-700" },
  { icon: Shield, text: "Svaret ditt er lagret trygt.", color: "text-slate-700" },
  { icon: TrendingUp, text: "Takk. Vi bruker dette til å forbedre arbeidsmiljøet.", color: "text-slate-700" },
];

function pickFeedback(prevText) {
  if (feedbackMessages.length <= 1) return feedbackMessages[0];
  // prøv å unngå samme melding to ganger på rad
  let next = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
  while (next.text === prevText) {
    next = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
  }
  return next;
}

export default function QuestionFeedback({ show, onComplete, duration = 1400 }) {
  const reduceMotion = useReducedMotion();
  const [currentFeedback, setCurrentFeedback] = React.useState(feedbackMessages[0]);

  React.useEffect(() => {
    if (!show) return;

    // Velg ny feedback når den vises
    setCurrentFeedback((prev) => pickFeedback(prev?.text));

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex items-center gap-2 text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          <currentFeedback.icon className={`h-4 w-4 ${currentFeedback.color}`} />
          <span className="text-slate-700">{currentFeedback.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
