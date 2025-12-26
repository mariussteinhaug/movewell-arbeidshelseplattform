import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Heart, Shield, TrendingUp } from 'lucide-react';

const feedbackMessages = [
  { icon: Heart, text: "Takk for at du deler!", color: "text-emerald-600" },
  { icon: CheckCircle2, text: "Bra! Dette hjelper oss å forstå bedre.", color: "text-blue-600" },
  { icon: Shield, text: "Ditt svar er lagret trygt.", color: "text-purple-600" },
  { icon: TrendingUp, text: "Vi jobber for å gjøre det bedre for deg.", color: "text-amber-600" }
];

export default function QuestionFeedback({ show, onComplete }) {
  const [currentFeedback] = React.useState(
    feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]
  );

  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <currentFeedback.icon className={`h-4 w-4 ${currentFeedback.color}`} />
          <span className="text-slate-700">{currentFeedback.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}