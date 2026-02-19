import {
    Accessibility,
    Code,
    Gauge,
    Globe,
    Monitor,
    Network,
    Repeat,
    Rocket,
    Server,
    ShieldCheck,
    Sliders,
    Wrench,
} from "@lucide/astro";

export const featureIcons = {
    mission: [ShieldCheck, Code, Accessibility],
    products: [Globe],
    webLabWhatWeDo: [Monitor, Network, Gauge, Sliders],
    webLabCooperation: [Rocket, Server, Wrench, Repeat],
};
