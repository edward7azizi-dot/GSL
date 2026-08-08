import { useCallback, useEffect, useRef, useState } from "react";

// Playoff splash screen — bracket resolves 8 -> 4 -> 2 -> 1, the champion turns
// gold and becomes the trophy, then the GSL identity locks up.
//
// Ported from the Claude Design export in /playoffs. Gated by PLAYOFFS_MODE in
// src/config/season.js; the regular SplashScreen is left untouched.

const TOTAL_MS = 3760; // last frame of the exit wipe
const REDUCED_MS = 1100;

const CSS = `
@keyframes gslPop{from{opacity:0;transform:scale(.25)}to{opacity:1;transform:scale(1)}}
@keyframes gslGhost{to{opacity:.16}}
@keyframes gslTravel{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}
@keyframes gslDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes gslRing{from{opacity:.95;transform:scale(.85)}to{opacity:0;transform:scale(2.6)}}
@keyframes gslHit{0%{opacity:0}12%{opacity:1}100%{opacity:0}}
@keyframes gslBloom{from{opacity:1;transform:scale(.2)}to{opacity:0;transform:scale(5)}}
@keyframes gslScreenFlash{0%{opacity:0}8%{opacity:.55}100%{opacity:0}}
@keyframes gslOut{to{opacity:0}}
@keyframes gslMorphOut{to{opacity:0;transform:scale(1.6)}}
@keyframes gslTrophyIn{from{opacity:0;transform:scale(.35)}to{opacity:1;transform:scale(1)}}
@keyframes gslTrophyOut{to{opacity:0;transform:scale(1.25)}}
@keyframes gslSnapIn{from{opacity:0;transform:translateY(10px) scale(.94)}to{opacity:1;transform:none}}
@keyframes gslTrack{from{opacity:0;letter-spacing:.02em}to{opacity:1;letter-spacing:.34em}}
@keyframes gslHero{from{opacity:0;letter-spacing:-.04em;transform:scaleY(1.06)}to{opacity:1;letter-spacing:.1em;transform:none}}
@keyframes gslRule{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes gslWipe{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 100% 0)}}
`;

// Bracket connectors, drawn round by round.
const ROUND_1_LINES = [
  [108, 80, 200, 80], [108, 220, 200, 220], [200, 80, 200, 220], [200, 150, 232, 150],
  [108, 400, 200, 400], [108, 540, 200, 540], [200, 400, 200, 540], [200, 470, 232, 470],
  [892, 80, 800, 80], [892, 220, 800, 220], [800, 80, 800, 220], [800, 150, 768, 150],
  [892, 400, 800, 400], [892, 540, 800, 540], [800, 400, 800, 540], [800, 470, 768, 470],
];
const ROUND_2_LINES = [
  [268, 150, 345, 150], [268, 470, 345, 470], [345, 150, 345, 470], [345, 310, 377, 310],
  [732, 150, 655, 150], [732, 470, 655, 470], [655, 150, 655, 470], [655, 310, 623, 310],
];
const FINAL_LINE = [[413, 310, 587, 310]];

const SEMI_NODES = [[250, 150], [250, 470], [750, 150], [750, 470]];
const FINAL_NODES = [[395, 310], [605, 310]];

const lineGroup = (lines, delay, dur) => (
  <g
    fill="none"
    stroke="#fff"
    strokeWidth="1.6"
    vectorEffect="non-scaling-stroke"
    opacity=".6"
    strokeDasharray="1"
    style={{ animation: `gslDraw ${dur}ms cubic-bezier(.3,0,.2,1) ${delay}ms both` }}
  >
    {lines.map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" vectorEffect="non-scaling-stroke" />
    ))}
  </g>
);

// A circle that survives a round travels inward; wrap it in a translating <g>.
const travel = (dx, dy, delay, dur, children) => (
  <g style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animation: `gslTravel ${dur}ms cubic-bezier(.7,0,.2,1) ${delay}ms both` }}>
    {children}
  </g>
);

const seed = (cx, cy, popDelay, ghostDelay) => (
  <circle
    cx={cx}
    cy={cy}
    r="18"
    style={{
      transformBox: "fill-box",
      transformOrigin: "center",
      animation:
        `gslPop 150ms cubic-bezier(.2,0,.1,1) ${popDelay}ms both` +
        (ghostDelay ? `,gslGhost 160ms linear ${ghostDelay}ms forwards` : ""),
    }}
  />
);

export default function PlayoffSplashScreen({ onDone }) {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  // Held in a ref so a parent re-render can't restart the timer mid-animation.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const firedRef = useRef(false);

  const finish = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onDoneRef.current();
  }, []);

  useEffect(() => {
    const done = setTimeout(finish, reduced ? REDUCED_MS : TOTAL_MS);
    window.addEventListener("keydown", finish);
    return () => {
      clearTimeout(done);
      window.removeEventListener("keydown", finish);
    };
  }, [reduced, finish]);

  // Logo + wordmark + PLAYOFFS. Shared by both the full and reduced-motion paths.
  const lockup = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(14px,2.6vh,26px)",
        padding: "6vw 3vw",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "clamp(64px,13vw,104px)",
          height: "clamp(64px,13vw,104px)",
          background: "#0B0B0B",
          border: "1px solid rgba(255,255,255,.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: reduced ? "none" : "gslSnapIn 200ms cubic-bezier(.2,0,.1,1) 2520ms both",
        }}
      >
        <img src="/images/gsl-logo.jpg" alt="GSL" style={{ width: "88%", height: "88%", objectFit: "contain" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(10px,1.8vh,18px)" }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "clamp(8px,2.3vw,17px)",
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: ".34em",
            whiteSpace: "nowrap",
            animation: reduced ? "none" : "gslTrack 240ms cubic-bezier(.2,0,.1,1) 2620ms both",
          }}
        >
          GTA Super League
        </div>
        <div
          style={{
            width: "min(320px,52vw)",
            height: 1,
            background: "rgba(255,255,255,.55)",
            animation: reduced ? "none" : "gslRule 260ms cubic-bezier(.7,0,.2,1) 2660ms both",
          }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: "clamp(34px,12.5vw,150px)",
            lineHeight: ".92",
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: ".1em",
            textIndent: ".1em",
            whiteSpace: "nowrap",
            animation: reduced ? "none" : "gslHero 320ms cubic-bezier(.68,0,.18,1) 2720ms both",
          }}
        >
          Playoffs
        </div>
      </div>
    </div>
  );

  return (
    <div
      onClick={finish}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0b0b0b",
        fontFamily: "Barlow, Inter, Helvetica, sans-serif",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <style>{CSS}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: reduced ? "none" : "gslWipe 360ms cubic-bezier(.76,0,.24,1) 3400ms forwards",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "#EF4444" }} />

        {!reduced && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#fff",
                opacity: 0,
                animation: "gslScreenFlash 260ms linear 1900ms 1 both",
              }}
            />

            {/* Bracket — fades out once the final is decided. */}
            <svg
              viewBox="0 0 1000 620"
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                width: "min(1180px,96vw)",
                height: "auto",
                maxHeight: "88vh",
                overflow: "visible",
                animation: "gslOut 200ms ease-out 2080ms forwards",
              }}
            >
              {lineGroup(ROUND_1_LINES, 430, 220)}
              {lineGroup(ROUND_2_LINES, 1040, 220)}
              {lineGroup(FINAL_LINE, 1470, 200)}

              <g fill="#fff" stroke="none">
                {/* Left champion — advances through all three rounds. */}
                {travel(160, 70, 760, 260, travel(145, 160, 1160, 280, travel(105, 0, 1620, 300, seed(90, 80, 140))))}
                {seed(90, 220, 300, 780)}
                {travel(160, 70, 760, 260, seed(90, 400, 370, 1180))}
                {seed(90, 540, 210, 780)}

                {seed(910, 80, 175, 780)}
                {travel(-160, -70, 760, 260, seed(910, 220, 335, 1180))}
                {seed(910, 400, 405, 780)}
                {/* Right champion. */}
                {travel(-160, -70, 760, 260, travel(-145, -160, 1160, 280, travel(-105, 0, 1620, 300, seed(910, 540, 245))))}
              </g>

              {/* Impact rings + flashes as each round resolves. */}
              <g fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke">
                {SEMI_NODES.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="18" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "gslRing 300ms cubic-bezier(.2,0,.3,1) 1020ms both" }} />
                ))}
                {FINAL_NODES.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="18" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "gslRing 300ms cubic-bezier(.2,0,.3,1) 1440ms both" }} />
                ))}
              </g>
              <g fill="#fff">
                {SEMI_NODES.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="26" style={{ opacity: 0, animation: "gslHit 130ms linear 1020ms both" }} />
                ))}
                {FINAL_NODES.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="26" style={{ opacity: 0, animation: "gslHit 130ms linear 1440ms both" }} />
                ))}
              </g>

              {/* The two finalists meet dead centre. `forwards`, not `both` — a
                  backwards fill would paint the bloom's opaque first keyframe at
                  centre for the whole run-up. */}
              <circle cx="500" cy="310" r="40" fill="#fff" style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center", animation: "gslBloom 420ms cubic-bezier(.2,0,.3,1) 1900ms forwards" }} />
            </svg>

            {/* Champion + trophy — its own layer so the bracket can fade behind it. */}
            <svg
              viewBox="0 0 1000 620"
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                width: "min(1180px,96vw)",
                height: "auto",
                maxHeight: "88vh",
                overflow: "visible",
              }}
            >
              <g style={{ animation: "gslMorphOut 150ms cubic-bezier(.4,0,.2,1) 2090ms forwards" }}>
                <circle cx="500" cy="310" r="46" fill="#FBBF24" opacity=".3" style={{ filter: "blur(22px)", transformBox: "fill-box", transformOrigin: "center", animation: "gslPop 140ms cubic-bezier(.2,0,.1,1) 1930ms both" }} />
                <circle cx="500" cy="310" r="30" fill="#FBBF24" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "gslPop 140ms cubic-bezier(.2,0,.1,1) 1930ms both", filter: "drop-shadow(0 0 26px rgba(251,191,36,.85))" }} />
              </g>

              {/* Outer <g> holds the static scale so it can't fight the animated transform. */}
              <g transform="translate(500,310) scale(1.45) translate(-500,-310)">
                <g
                  style={{
                    transformBox: "view-box",
                    transformOrigin: "500px 310px",
                    filter: "drop-shadow(0 0 26px rgba(251,191,36,.8))",
                    animation:
                      "gslTrophyIn 190ms cubic-bezier(.2,0,.1,1) 2130ms both," +
                      "gslTrophyOut 160ms cubic-bezier(.4,0,.2,1) 2450ms forwards",
                  }}
                >
                  <circle cx="500" cy="310" r="52" fill="#FBBF24" opacity=".28" style={{ filter: "blur(24px)" }} />
                  <g fill="#FBBF24">
                    <path d="M 468 266 L 532 266 L 528 294 Q 524 320 500 320 Q 476 320 472 294 Z" />
                    <path d="M 493 320 L 507 320 L 507 336 L 493 336 Z" />
                    <path d="M 479 336 L 521 336 L 524 346 L 476 346 Z" />
                    <path d="M 470 346 L 530 346 L 530 354 L 470 354 Z" />
                  </g>
                  <g fill="none" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round">
                    <path d="M 468 274 Q 446 274 446 289 Q 446 304 465 308" />
                    <path d="M 532 274 Q 554 274 554 289 Q 554 304 535 308" />
                  </g>
                </g>
              </g>
            </svg>
          </>
        )}

        {lockup}
      </div>
    </div>
  );
}
