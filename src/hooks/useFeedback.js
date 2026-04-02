import { useRef, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";

export default function useFeedback() {
  const { trigger, isSupported } = useWebHaptics();

  const clickSound = useRef(
    // typeof Audio !== "undefined" ? new Audio("/click.wav") : null,
    typeof Audio !== "undefined" ? new Audio("/mouse.wav") : null,
  );

  useEffect(() => {
    if (clickSound.current) clickSound.current.load();
  }, []);

  const fire = ({ haptic = "medium", sound = true } = {}) => {
    if (isSupported) {
      trigger(haptic);
    }
    if (sound && clickSound.current) {
      try {
        clickSound.current.currentTime = 0;
        clickSound.current.play();
      } catch (err) {
        // Audio play may be blocked by browser
        // Optionally log or ignore
      }
    }
  };

  return { fire };
}
