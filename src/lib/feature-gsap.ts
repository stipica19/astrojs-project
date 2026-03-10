import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize,orientationchange",
});


const run = () => {
    const cards = gsap.utils.toArray<HTMLElement>(".feature-card");
    const rows = gsap.utils.toArray<HTMLElement>(".feature-row");

    cards.forEach((card) => {
        gsap.set(card, {
            autoAlpha: 0,
            y: 24,
            rotateX: 8,
            transformOrigin: "50% 100%",
        });
        gsap.to(card, {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 80%",
                once: true,
                invalidateOnRefresh: true,
            },
        });
    });

    rows.forEach((row) => {
        gsap.set(row, { autoAlpha: 0, y: 36 });
        gsap.to(row, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
                trigger: row,
                start: "top 80%",
                once: true,
                invalidateOnRefresh: true,
            },
        });
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
} else {
    run();
}

window.addEventListener("load", () => {
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 250);
});