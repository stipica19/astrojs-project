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
    SlidersHorizontal,
    Wrench,
} from "@lucide/astro";

export const featureIcons = {
    services: [Monitor, Wrench, Network],
    mission: [ShieldCheck, Code, Accessibility],
    products: [Globe],
    webLabWhatWeDo: [Monitor, Network, Gauge, SlidersHorizontal],
    webLabCooperation: [Rocket, Server, Wrench, Repeat],
};
