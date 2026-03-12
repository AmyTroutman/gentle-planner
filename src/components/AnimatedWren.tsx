import { useEffect, useState } from 'react'

// Wren animation states
type WrenMood = 'idle' | 'alert' | 'bobbing'

export default function AnimatedWren({ size = 48 }: { size?: number }) {
    const [blinkOpen, setBlinkOpen] = useState(true)
    const [tailUp, setTailUp] = useState(false)
    const [mood, setMood] = useState<WrenMood>('idle')

    // Blink every 3-6 seconds
    useEffect(() => {
        function scheduleBlink() {
            const delay = 3000 + Math.random() * 3000
            return setTimeout(() => {
                setBlinkOpen(false)
                setTimeout(() => {
                    setBlinkOpen(true)
                    scheduleBlink()  // won't actually recurse — captured in closure
                }, 120)
            }, delay)
        }

        let t1 = scheduleBlink()
        // Re-schedule properly via interval-like chaining
        // Using a ref-style approach via closure
        return () => clearTimeout(t1)
    }, [])

    // Proper recurring blink
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>

        function blink() {
            setBlinkOpen(false)
            setTimeout(() => setBlinkOpen(true), 120)
            timeout = setTimeout(blink, 3000 + Math.random() * 4000)
        }

        timeout = setTimeout(blink, 2000 + Math.random() * 2000)
        return () => clearTimeout(timeout)
    }, [])

    // Tail flick every 4-8 seconds
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>

        function flick() {
            setTailUp(true)
            setTimeout(() => setTailUp(false), 350)
            timeout = setTimeout(flick, 4000 + Math.random() * 4000)
        }

        timeout = setTimeout(flick, 1500 + Math.random() * 2000)
        return () => clearTimeout(timeout)
    }, [])

    // Random alert pose
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>

        function maybeAlert() {
            const r = Math.random()
            if (r < 0.3) {
                setMood('alert')
                setTimeout(() => setMood('idle'), 800 + Math.random() * 600)
            }
            timeout = setTimeout(maybeAlert, 5000 + Math.random() * 5000)
        }

        timeout = setTimeout(maybeAlert, 3000)
        return () => clearTimeout(timeout)
    }, [])

    // Tail rotation: wrens hold tail upright naturally, flick goes even higher
    const tailRotation = tailUp ? -70 : -50

    // Alert: head tilts slightly
    const headTilt = mood === 'alert' ? -8 : 0

    return (
        <div
            style={{
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
            }}
        >
            <style>{`
                @keyframes wren-bob {
                    0%   { transform: translateY(0px); }
                    25%  { transform: translateY(-2px); }
                    50%  { transform: translateY(0px); }
                    75%  { transform: translateY(-1px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes wren-breathe {
                    0%, 100% { transform: scaleY(1); }
                    50%       { transform: scaleY(1.04); }
                }
            `}</style>

            <svg
                width={size}
                height={size}
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* ── Feet — static, never bob ─────────────────── */}
                <line x1="26" y1="43" x2="24" y2="48.5" stroke="#8B7355" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="24" y1="48.5" x2="20.5" y2="49" stroke="#8B7355" strokeWidth="1" strokeLinecap="round" />
                <line x1="24" y1="48.5" x2="24.5" y2="51" stroke="#8B7355" strokeWidth="1" strokeLinecap="round" />
                <line x1="32" y1="43" x2="31" y2="48.5" stroke="#8B7355" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="31" y1="48.5" x2="27.5" y2="49" stroke="#8B7355" strokeWidth="1" strokeLinecap="round" />
                <line x1="31" y1="48.5" x2="33" y2="50.5" stroke="#8B7355" strokeWidth="1" strokeLinecap="round" />

                {/* ── Bobbing group — body, tail, head only ────── */}
                <g style={{ animation: 'wren-bob 2.4s ease-in-out infinite' }}>

                    {/* ── Tail ─────────────────────────────────────── */}
                    <g
                        style={{
                            transformOrigin: '22px 34px',
                            transform: `rotate(${tailRotation}deg)`,
                            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    >
                        {/* Main tail feather */}
                        <path
                            d="M22 34 L10 22 L13 20 L24 33"
                            fill="#7B3F1A"
                            stroke="#5C2E0E"
                            strokeWidth="0.5"
                        />
                        {/* Tail barring — subtle stripes */}
                        <line x1="12" y1="22.5" x2="14.5" y2="21" stroke="#5C2E0E" strokeWidth="0.7" opacity="0.6" />
                        <line x1="14.5" y1="25" x2="17" y2="23" stroke="#5C2E0E" strokeWidth="0.7" opacity="0.6" />
                        <line x1="17" y1="27.5" x2="19.5" y2="26" stroke="#5C2E0E" strokeWidth="0.7" opacity="0.6" />
                    </g>

                    {/* ── Body ─────────────────────────────────────── */}
                    <g style={{ animation: 'wren-breathe 3.2s ease-in-out infinite', transformOrigin: '30px 33px' }}>
                        {/* Main body — warm brown back */}
                        <ellipse cx="31" cy="33" rx="11" ry="9" fill="#8B4513" />

                        {/* Wing detail — barred brown */}
                        <ellipse cx="31" cy="32" rx="9" ry="7" fill="#A0522D" />

                        {/* Wing barring */}
                        <path d="M23 31 Q28 29 37 31" stroke="#6B3410" strokeWidth="0.8" fill="none" opacity="0.7" />
                        <path d="M23 33 Q28 31 37 33" stroke="#6B3410" strokeWidth="0.8" fill="none" opacity="0.7" />
                        <path d="M24 35 Q29 33 36 35" stroke="#6B3410" strokeWidth="0.8" fill="none" opacity="0.5" />

                        {/* Buff/cream belly */}
                        <ellipse cx="30" cy="35" rx="7" ry="5.5" fill="#E8C97A" />
                        <ellipse cx="30" cy="36" rx="5" ry="4" fill="#F0D896" />
                    </g>

                    {/* ── Head ─────────────────────────────────────── */}
                    <g
                        style={{
                            transformOrigin: '33px 25px',
                            transform: `rotate(${headTilt}deg)`,
                            transition: 'transform 0.3s ease',
                        }}
                    >
                        {/* Head — rich brown */}
                        <ellipse cx="34" cy="24" rx="8" ry="7" fill="#7B3F1A" />
                        {/* Crown — slightly darker */}
                        <ellipse cx="34" cy="20" rx="5" ry="3.5" fill="#6B3010" />

                        {/* White supercilium (eyebrow stripe) */}
                        <path
                            d="M27 21 Q31 18.5 38 20"
                            stroke="white"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            opacity="0.9"
                        />

                        {/* Cheek — pale buff */}
                        <ellipse cx="33" cy="25" rx="4" ry="3" fill="#D4A574" opacity="0.6" />

                        {/* Eye */}
                        <circle cx="35" cy="22" r="2.2" fill="#1A0A00" />
                        <circle cx="35" cy="22" r="1.8" fill="#2C1810" />
                        {/* Eye shine */}
                        <circle cx="35.7" cy="21.3" r="0.6" fill="white" opacity="0.9" />

                        {/* Blink — eyelid that closes down */}
                        {!blinkOpen && (
                            <ellipse cx="35" cy="22" rx="2.2" ry="1.1" fill="#7B3F1A" />
                        )}

                        {/* Beak — thin, slightly curved */}
                        <path
                            d="M41 23 L45 22.5 L41.5 24.5 Z"
                            fill="#8B7355"
                            stroke="#6B5A3E"
                            strokeWidth="0.3"
                        />
                        {/* Beak lower mandible hint */}
                        <path d="M41 23.5 L44 23.5" stroke="#6B5A3E" strokeWidth="0.4" opacity="0.5" />
                    </g>

                </g>{/* end bob group */}
            </svg>
        </div>
    )
}