"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "../../lib/analytics/useAnalytics";

export function ProductViewTracker({ productId }: { productId: string | number }) {
  const { trackEvent } = useAnalytics();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackEvent(productId, "view");
  }, [productId, trackEvent]);

  return null;
}
