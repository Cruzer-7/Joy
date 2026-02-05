"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import Image from "next/image";

// Pre-generate random positions for decorative elements
const generateRandomPositions = (count: number) =>
  Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 3,
  }));

type AvatarMood =
  | "happy"      // Initial hopeful state
  | "nervous"    // When mouse approaches No button
  | "shocked"    // First popup - surprised
  | "pouty"      // Second popup - determined/pouty
  | "hacker"     // Hacking sequence - mischievous
  | "scary"      // Scary reveal
  | "love";      // Success - super happy with hearts

type GameState =
  | "initial"
  | "mobilePopup1"
  | "mobilePopup2"
  | "hacking"
  | "scary"
  | "success";

const AVATAR_MESSAGES: Record<AvatarMood, string> = {
  happy: "Will you be my Valentine~? ♡",
  nervous: "H-hey! Don't even think about it!",
  shocked: "EH?! You can't be serious!",
  pouty: "Hmph! You don't have a choice, you know!",
  hacker: "Hehe~ Time to hack your heart!",
  scary: "BOO! ...? Tehehe~",
  love: "YIIIIPPPPPEEEEEE~! I love you so much! ♡♡♡",
};

export default function ValentinePage() {
  const [gameState, setGameState] = useState<GameState>("initial");
  const [isNervous, setIsNervous] = useState(false); // For desktop hover near No button
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [showScaryImage, setShowScaryImage] = useState(false);
  
  // Derive avatar mood from game state
  const avatarMood: AvatarMood = (() => {
    if (gameState === "success") return "love";
    if (gameState === "scary") return "scary";
    if (gameState === "hacking") return "hacker";
    if (gameState === "mobilePopup2") return "pouty";
    if (gameState === "mobilePopup1") return "shocked";
    if (isNervous) return "nervous";
    return "happy";
  })();

  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Pre-generated random positions for decorative elements
  const heartPositions = useMemo(() => generateRandomPositions(30), []);
  const sparklePositions = useMemo(() => generateRandomPositions(20), []);
  const matrixPositions = useMemo(() => generateRandomPositions(15), []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Avatar entrance animation
  useEffect(() => {
    if (avatarRef.current) {
      gsap.fromTo(
        avatarRef.current,
        { scale: 0, rotation: -10 },
        { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, []);

  // Hacking countdown
  useEffect(() => {
    if (gameState !== "hacking") return;

    if (avatarRef.current) {
      gsap.to(avatarRef.current, {
        x: "random(-5, 5)",
        y: "random(-5, 5)",
        duration: 0.1,
        repeat: -1,
        yoyo: true,
      });
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowScaryImage(true);
          setTimeout(() => setGameState("scary"), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const avatarElement = avatarRef.current;
    return () => {
      clearInterval(interval);
      gsap.killTweensOf(avatarElement);
    };
  }, [gameState]);

  // Success animation
  useEffect(() => {
    if (gameState !== "success") return;

    // Confetti explosion with purple/pink colors
    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#9333ea", "#7c3aed", "#a855f7", "#c084fc"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#9333ea", "#7c3aed", "#a855f7", "#c084fc"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Heart confetti burst
    confetti({
      particleCount: 100,
      spread: 180,
      origin: { y: 0.6 },
      colors: ["#9333ea", "#7c3aed", "#a855f7", "#6b21a8"],
      shapes: ["circle"],
      scalar: 1.5,
    });

    // Bounce animation for avatar
    if (avatarRef.current) {
      gsap.to(avatarRef.current, {
        y: -20,
        duration: 0.3,
        repeat: 5,
        yoyo: true,
        ease: "power2.out",
      });
    }
  }, [gameState]);

  // Desktop: Move No button away from mouse and change avatar mood
  const handleNoMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || !noButtonRef.current || gameState !== "initial") return;

      const button = noButtonRef.current;
      const rect = button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(e.clientX - buttonCenterX, 2) +
          Math.pow(e.clientY - buttonCenterY, 2)
      );

      // Change mood when getting close to No button
      if (distance < 200 && !isNervous) {
        setIsNervous(true);
        if (avatarRef.current) {
          gsap.to(avatarRef.current, {
            x: 5,
            duration: 0.1,
            repeat: 3,
            yoyo: true,
          });
        }
      } else if (distance >= 200 && isNervous) {
        setIsNervous(false);
      }

      if (distance < 150) {
        const padding = 100;
        let newX: number, newY: number;
        let attempts = 0;

        do {
          newX = padding + Math.random() * (window.innerWidth - rect.width - padding * 2);
          newY = padding + Math.random() * (window.innerHeight - rect.height - padding * 2);
          attempts++;
        } while (
          Math.sqrt(Math.pow(e.clientX - newX, 2) + Math.pow(e.clientY - newY, 2)) < 200 &&
          attempts < 10
        );

        gsap.to(button, {
          left: newX,
          top: newY,
          duration: 0.3,
          ease: "power2.out",
        });

        setNoButtonPosition({ x: newX, y: newY });
      }
    },
    [isMobile, isNervous, gameState]
  );

  // Mobile: Handle No button click
  const handleNoClick = () => {
    if (!isMobile) return;
    if (gameState === "initial") {
      setGameState("mobilePopup1");
    }
  };

  // Handle Yes button click
  const handleYesClick = () => {
    setGameState("success");
  };

  // Mobile popup handlers
  const handlePopup1Yes = () => {
    setGameState("mobilePopup2");
  };

  const handlePopup1No = () => {
    setGameState("hacking");
  };

  const handlePopup2Yes = () => {
    setGameState("hacking");
  };

  const handlePopup2No = () => {
    setGameState("hacking");
  };

  const handleHackingYes = () => {
    setGameState("success");
  };

  // Avatar component
  const renderAvatar = (size: "normal" | "large" = "normal") => {
    const sizeClasses = size === "large" ? "w-72 h-72 md:w-96 md:h-96" : "w-48 h-48 md:w-64 md:h-64";

    const moodStyles: Record<AvatarMood, string> = {
      happy: "animate-bounce-slow",
      nervous: "animate-shake",
      shocked: "",
      pouty: "",
      hacker: "animate-glitch",
      scary: "animate-glitch",
      love: "animate-float",
    };

    return (
      <div ref={avatarRef} className={`relative ${sizeClasses} ${moodStyles[avatarMood]}`}>
        {/* Glow effect behind avatar */}
        <div className="absolute inset-0 bg-purple-600/40 rounded-full blur-3xl scale-110" />

        {/* Avatar image container */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-purple-500/60 bg-black/80">
          <Image
            src={`/avatar-${avatarMood}.png`}
            alt="Anime Avatar"
            fill
            className="object-cover"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          {/* Fallback emoji based on mood */}
          <div className="absolute inset-0 flex items-center justify-center text-6xl md:text-8xl">
            {avatarMood === "happy" && (
              <img
                src="https://media.tenor.com/f1xnRxTRxLAAAAAj/bears-with-kisses-bg.gif"
                alt="Happy bear"
                className="w-full h-full object-contain"
              />
            )}
            {avatarMood === "nervous" && "😰"}
            {avatarMood === "shocked" && "😱"}
            {avatarMood === "pouty" && "😤"}
            {avatarMood === "hacker" && "😈"}
            {avatarMood === "scary" && "👻"}
            {avatarMood === "love" && (
              <img
                src="https://media.tenor.com/-nt9Dj8Ei14AAAAM/tap-that.gif"
                alt="Tap that"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Floating hearts for love mood */}
        {avatarMood === "love" && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-heartbeat"
                style={{
                  left: `${20 + i * 12}%`,
                  top: `-${10 + (i % 3) * 10}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                💜
              </div>
            ))}
          </>
        )}

        {/* Sparkles for happy/love moods */}
        {(avatarMood === "happy" || avatarMood === "love") && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute text-xl animate-sparkle"
                style={{
                  left: `${10 + i * 25}%`,
                  top: `${5 + (i % 2) * 15}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                ✨
              </div>
            ))}
          </>
        )}

        {/* Sweat drops for nervous mood */}
        {avatarMood === "nervous" && (
          <div className="absolute -right-2 top-1/4 text-2xl animate-bounce-slow">
            💧
          </div>
        )}
      </div>
    );
  };

  // Speech bubble component
  const renderSpeechBubble = () => (
    <div
      key={avatarMood}
      ref={messageRef}
      className="speech-bubble max-w-sm text-center text-lg md:text-xl font-medium animate-speech-pop"
    >
      {AVATAR_MESSAGES[avatarMood]}
    </div>
  );

  // Success screen
  if (gameState === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-black via-[#0d0015] to-black relative overflow-hidden">
        {/* Background hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {heartPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-float opacity-40"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animationDelay: `${pos.delay}s`,
              }}
            >
              💜
            </div>
          ))}
        </div>

        <div className="text-center z-10 flex flex-col items-center gap-6">
          {renderSpeechBubble()}

          <div className="my-4">
            {renderAvatar("large")}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse">
            We&apos;re Official! 💜
          </h1>

          {/* Cake and Chocolate */}
          <div className="flex flex-row gap-6 items-center justify-center mt-6">
            <div className="relative w-32 h-32 md:w-48 md:h-48 animate-float">
              <div className="absolute inset-0 bg-purple-600/30 rounded-2xl blur-xl" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-purple-500/60 bg-black/70 flex items-center justify-center">
                <Image
                  src="/cake.png"
                  alt="Cake"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-5xl md:text-7xl">🎂</span>
              </div>
            </div>

            <div className="relative w-32 h-32 md:w-48 md:h-48 animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="absolute inset-0 bg-purple-600/30 rounded-2xl blur-xl" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-purple-500/60 bg-black/70 flex items-center justify-center">
                <Image
                  src="/chocolate.png"
                  alt="Chocolate"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-5xl md:text-7xl">🍫</span>
              </div>
            </div>
          </div>

          <p className="text-lg md:text-xl text-purple-300 mt-4">
            Here&apos;s some treats for my Valentine~! ♡
          </p>
        </div>
      </div>
    );
  }

  // Hacking screen
  if (gameState === "hacking" || gameState === "scary") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-black relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none scanline opacity-50" />

        {/* Glitch overlay */}
        <div className="absolute inset-0 bg-green-500/5 animate-flicker pointer-events-none" />

        <div className="text-center z-10 flex flex-col items-center gap-4">
          {renderSpeechBubble()}

          <div className="my-4">
            {renderAvatar()}
          </div>

          {showScaryImage ? (
            <div className="animate-glitch">
              <div className="relative w-64 h-64 mx-auto mb-6 rounded-lg overflow-hidden border-4 border-green-500/50">
                <Image
                  src="/scary.png"
                  alt="Scary"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-8xl bg-black/50">
                  👻
                </div>
              </div>
              <button
                onClick={handleHackingYes}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xl font-bold rounded-2xl transition-all animate-pulse-glow"
              >
                Yes, I&apos;ll be your Valentine! 💜
              </button>
            </div>
          ) : (
            <>
              <div className="text-green-500 font-mono text-sm mb-4 opacity-70">
                <p className="animate-typing">{"> "}INITIATING_HACK.exe...</p>
                <p>{"> "}BYPASSING_HEART_FIREWALL...</p>
                <p>{"> "}ACCESSING_LOVE.dll...</p>
              </div>

              <h2 className="text-2xl md:text-4xl font-mono text-red-500 animate-glitch">
                ⚠️ WARNING ⚠️
              </h2>

              <p className="text-lg md:text-xl text-green-400 font-mono">
                Hacking your phone in...
              </p>

              <p className="text-5xl md:text-7xl font-bold text-red-500 font-mono animate-pulse my-4">
                T-{countdown}
              </p>

              <p className="text-base md:text-lg text-green-400 font-mono mb-4">
                Click YES to stop the hack!
              </p>

              <button
                onClick={handleHackingYes}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-black text-lg font-bold font-mono rounded-lg transition-all animate-pulse"
              >
                {">>>"} YES! STOP IT! {"<<<"}
              </button>
            </>
          )}
        </div>

        {/* Matrix-style characters */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {matrixPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-green-500 font-mono text-xs"
              style={{
                left: `${i * 7}%`,
                top: `${pos.top}%`,
                writingMode: "vertical-rl",
              }}
            >
              {"ァィゥェォカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main screen
  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-black via-[#0d0015] to-black relative overflow-hidden"
      onMouseMove={handleNoMouseMove}
    >
      {/* Background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {sparklePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute text-xl animate-sparkle opacity-60"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${pos.delay}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-700/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="text-center z-10 flex flex-col items-center gap-6">
        {renderSpeechBubble()}

        <div className="my-4">
          {renderAvatar("large")}
        </div>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center relative mt-4">
          <button
            onClick={handleYesClick}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xl md:text-2xl font-bold rounded-2xl transform hover:scale-110 transition-all duration-300 animate-pulse-glow shadow-2xl"
          >
            Yes! 💜
          </button>

          <button
            ref={noButtonRef}
            onClick={handleNoClick}
            className={`px-10 py-5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xl md:text-2xl font-bold rounded-2xl transition-all duration-300 ${
              !isMobile ? "md:absolute" : ""
            }`}
            style={
              !isMobile && noButtonPosition.x
                ? {
                    position: "fixed",
                    left: noButtonPosition.x,
                    top: noButtonPosition.y,
                  }
                : {}
            }
          >
            No
          </button>
        </div>
      </div>

      {/* Mobile Popup 1 */}
      {gameState === "mobilePopup1" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="anime-panel p-6 md:p-8 max-w-md w-full text-center">
            <div className="mb-4">
              {renderAvatar()}
            </div>
            <div className="speech-bubble mb-6">
              <span className="text-lg md:text-xl font-medium">
                {AVATAR_MESSAGES.shocked}
              </span>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePopup1Yes}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
              >
                Yes, I&apos;m sure
              </button>
              <button
                onClick={handlePopup1No}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
              >
                No, wait...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Popup 2 */}
      {gameState === "mobilePopup2" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="anime-panel p-6 md:p-8 max-w-md w-full text-center">
            <div className="mb-4">
              {renderAvatar()}
            </div>
            <div className="speech-bubble mb-6">
              <span className="text-lg md:text-xl font-medium">
                {AVATAR_MESSAGES.pouty}
              </span>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePopup2Yes}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
              >
                I&apos;m stubborn!
              </button>
              <button
                onClick={handlePopup2No}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
              >
                Fine...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
