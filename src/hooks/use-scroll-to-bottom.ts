import { useRef, useEffect, useCallback, useState } from "react";

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(false);
  const [scrollBehavior, setScrollBehavior] = useState<ScrollFlag>(false);

  useEffect(() => {
    if (scrollBehavior) {
      endRef.current?.scrollIntoView({ behavior: scrollBehavior });
      setScrollBehavior(false);
    }
  }, [scrollBehavior, setScrollBehavior]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      setScrollBehavior(behavior);
    },
    [setScrollBehavior],
  );

  const onViewportEnter = useCallback(() => {
    setIsAtBottom(true);
  }, []);

  const onViewportLeave = useCallback(() => {
    setIsAtBottom(false);
  }, []);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
