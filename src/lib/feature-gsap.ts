console.log("first")

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


const run = () => {
    const cards = document.querySelectorAll('.feature-card');
    const rows = document.querySelectorAll('.feature-row');


    if (cards.length) {
        gsap.set(cards, { autoAlpha: 0, y: 24, rotateX: 8, transformOrigin: "50% 100%" });
        gsap.to(cards, {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
                trigger: '.feature-card',
                start: "top 70%",
                once: true,
            },
        });
    }

    if (rows.length) {
        gsap.set(rows, { autoAlpha: 0, y: 36 });
        gsap.to(rows, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
                trigger: '.feature-row',
                start: "top 70%",
                once: true,
            },
        });
    }
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
} else {
    run();
}