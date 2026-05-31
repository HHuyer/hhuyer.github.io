import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;
    let animId = 0;

    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    function update() {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      followerX += (mouseX - followerX) * 0.1;
      followerY += (mouseY - followerY) * 0.1;

      cursor!.style.left = cursorX + "px";
      cursor!.style.top = cursorY + "px";
      follower!.style.left = followerX - 20 + "px";
      follower!.style.top = followerY - 20 + "px";

      animId = requestAnimationFrame(update);
    }

    const handleEnter = () => {
      cursor.style.width = "40px";
      cursor.style.height = "40px";
      cursor.style.borderColor = "#764ba2";
    };
    const handleLeave = () => {
      cursor.style.width = "20px";
      cursor.style.height = "20px";
      cursor.style.borderColor = "#667eea";
    };

    document.addEventListener("mousemove", handleMove);
    update();

    const btn = document.querySelector(".modern-button");
    btn?.addEventListener("mouseenter", handleEnter);
    btn?.addEventListener("mouseleave", handleLeave);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", handleMove);
      btn?.removeEventListener("mouseenter", handleEnter);
      btn?.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <>
      <div className="custom-cursor" ref={cursorRef} />
      <div className="cursor-follower" ref={followerRef} />
    </>
  );
}
