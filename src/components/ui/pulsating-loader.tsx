import { motion } from "framer-motion";

export function PulsatingDots() {
    return (
        <div className="flex items-center justify-center">
            <div className="flex space-x-2">
                <motion.div
                    className="h-3 w-3 rounded-full bg-primary"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                    }}
                />
                <motion.div
                    className="h-3 w-3 rounded-full bg-primary"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                        delay: 0.3,
                    }}
                />
                <motion.div
                    className="h-3 w-3 rounded-full bg-primary"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                        delay: 0.6,
                    }}
                />
            </div>
        </div>
    );
}

const BARS = Array.from({ length: 7 }, (_, i) => ({
    id: `bar-${i}`,
    delay: i * 0.1,
}));

export function RippleWaveLoader() {
    return (
        <div className="flex items-center justify-center space-x-1">
            {BARS.map((bar) => (
                <motion.div
                    key={bar.id}
                    className="h-8 w-2 rounded-full bg-primary"
                    animate={{
                        scaleY: [0.5, 1.5, 0.5],
                        scaleX: [1, 0.8, 1],
                        translateY: ["0%", "-15%", "0%"],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: bar.delay,
                    }}
                />
            ))}
        </div>
    );
}
