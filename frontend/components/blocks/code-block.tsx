import { CodeBlock } from "@/types/content";
import { motion } from "framer-motion";

type Props = CodeBlock["data"];

export function CodeComponent({ content, language }: Props) {
  return (
    // Will be using Shiki code highlighter later, right now rendering my design
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
    >
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          agent_config.py
        </span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
        </div>
      </div>
      <div className="p-6 overflow-x-auto bg-neutral-950">
        <pre className="font-mono text-sm text-neutral-300 leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    </motion.div>
  );
}
