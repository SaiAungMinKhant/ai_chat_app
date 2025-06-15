import { useRef, useEffect, useCallback, useState } from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const {
      scrollTop: currentScrollTop,
      scrollHeight,
      clientHeight,
    } = container;
    const maxScroll = scrollHeight - clientHeight;

    setScrollTop(currentScrollTop);
    setCanScrollUp(currentScrollTop < -50);

    console.log("Scroll position:", {
      scrollTop: currentScrollTop,
      scrollHeight,
      clientHeight,
      maxScroll,
      canScrollUp: currentScrollTop > 50,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    // Initial check
    checkScrollPosition();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkScrollPosition]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    console.log("Scrolling to top...");
    const container = containerRef.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior,
      });

      setTimeout(
        () => {
          setScrollTop(0);
          setCanScrollUp(false);
        },
        behavior === "smooth" ? 200 : 0,
      );
    }
  }, []);

  const scrollToNewMessage = useCallback(() => {
    scrollToTop("smooth");
  }, [scrollToTop]);

  return {
    containerRef,
    endRef,
    scrollTop,
    canScrollUp,
    scrollToTop,
    scrollToNewMessage,
    checkScrollPosition,
  };
}
