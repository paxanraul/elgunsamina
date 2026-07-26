import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  MapPin,
  Volume2,
  VolumeX,
} from "lucide-react";
import portrait from "../assets/images/portrait.webp";
import stairs from "../assets/images/stairs.webp";
import fullLeaf from "../assets/full-leaf.png";
import invitationLeafTop from "../assets/invitation-leaf-top.png";
import invitationLeafBottom from "../assets/invitation-leaf-bottom.png";
import calendarIcon from "../assets/icons/calendar.png";
import clockIcon from "../assets/icons/clock.png";
import glassesIcon from "../assets/icons/glasses.png";
import locationIcon from "../assets/icons/location.png";
import weddingTrack from "../assets/audio/sene-baxim.mp3";
import styles from "./App.module.css";

const mapUrl =
  "https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D1%83%D0%BB.%20%D0%93%D0%B0%D1%80%D0%B8%D0%B1%D0%B0%D0%BB%D1%8C%D0%B4%D0%B8%2C%201%D0%90";
const weddingDate = new Date("2026-09-16T17:00:00+03:00");

type RevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
  label?: string;
};

function RevealSection({
  children,
  className = "",
  id,
  labelledBy,
  label,
}: RevealProps) {
  return (
    <motion.section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={label}
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function Intro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.intro}
          aria-hidden="true"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
        >
          <motion.div
            className={styles.introTop}
            exit={{ y: "-100%" }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className={styles.introBottom}
            exit={{ y: "100%" }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="relative z-10 grid justify-items-center text-[#332c20]"
            exit={{ opacity: 0, y: -18 }}
          >
            <div className={styles.introRing}>
              <span className="font-script text-[40px] whitespace-nowrap">
                E &amp; S
              </span>
            </div>
            <motion.div
              className="mt-5 mb-3.5 h-px w-[86px] bg-[#756544]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <p className="font-sans text-[9px] tracking-[0.33em] uppercase">
              Свадебное приглашение
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SoundControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrame = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const fadeTo = (target: number, duration: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    window.cancelAnimationFrame(fadeFrame.current);
    const initialVolume = audio.volume;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = initialVolume + (target - initialVolume) * progress;
      if (progress < 1) fadeFrame.current = window.requestAnimationFrame(step);
    };
    fadeFrame.current = window.requestAnimationFrame(step);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let active = true;

    const removeUnlockListeners = () => {
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

    const startAudio = async () => {
      if (!active || !audio.paused) return;

      audio.volume = 0;
      try {
        await audio.play();
        if (!active) return;
        setPlaying(true);
        setHintVisible(false);
        fadeTo(0.55, 1100);
        removeUnlockListeners();
      } catch {
        // Unmuted autoplay is blocked by some mobile browsers. In that case,
        // the first interaction anywhere on the invitation unlocks the track.
      }
    };

    const unlockAudio = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-sound-control]")
      ) {
        return;
      }
      void startAudio();
    };

    void startAudio();
    document.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      active = false;
      removeUnlockListeners();
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setHintVisible(false);

    if (audio.paused) {
      audio.volume = 0;
      try {
        await audio.play();
        setPlaying(true);
        fadeTo(0.55, 900);
      } catch {
        setPlaying(false);
      }
      return;
    }

    setPlaying(false);
    fadeTo(0, 420);
    window.setTimeout(() => {
      if (audio.volume < 0.04) audio.pause();
    }, 450);
  };

  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (document.hidden && audio && !audio.paused) audio.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.cancelAnimationFrame(fadeFrame.current);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {hintVisible && (
          <motion.p
            className={styles.soundHint}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ delay: 1.45, duration: 0.7 }}
          >
            включите звук
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        data-sound-control
        className={`${styles.soundButton} ${playing ? styles.soundPlaying : ""}`}
        aria-label={playing ? "Выключить звук" : "Включить звук"}
        aria-pressed={playing}
        initial={{ opacity: 0, y: -7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.25, duration: 0.7 }}
        whileTap={{ scale: 0.96 }}
        onClick={toggle}
      >
        {playing ? <Volume2 size={15} strokeWidth={2.2} /> : <VolumeX size={15} strokeWidth={2.2} />}
        <span className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase">
          {playing ? "Выключить" : "Включить"}
        </span>
      </motion.button>
      <audio ref={audioRef} src={weddingTrack} preload="auto" autoPlay loop />
    </>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 28,
    mass: 0.3,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 z-[70] h-0.5 w-full origin-left bg-gold"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  return (
    <section
      ref={sectionRef}
      id="welcome"
      aria-labelledby="hero-title"
      className="relative isolate grid min-h-svh items-end justify-items-center overflow-hidden text-white"
    >
      <motion.img
        className={styles.heroPhoto}
        src={portrait}
        width={1280}
        height={1920}
        alt="Эльгун и Самина"
        fetchPriority="high"
        style={{ y: photoY }}
      />
      <div className={styles.heroShade} />
      <img className={styles.heroLeafTop} src={fullLeaf} alt="" aria-hidden="true" />
      <img className={styles.heroLeafBottom} src={fullLeaf} alt="" aria-hidden="true" />
      <motion.div
        className="relative z-10 w-full px-[30px] pb-[52px] text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.65, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-[13px] font-serif text-[clamp(26px,6.6vw,37px)] tracking-[0.01em]">
          Wedding day
        </p>
        <h1
          id="hero-title"
          className="m-0 grid justify-items-center gap-[21px] font-serif text-[clamp(63px,17.2vw,94px)] leading-[0.76] tracking-[-0.035em]"
        >
          <span>Elgun</span>
          <span className="block w-full translate-y-[8px] text-center text-[0.65em] leading-[0.76]">&amp;</span>
          <span>Samina</span>
        </h1>
        <p className="mt-[29px] font-serif text-[clamp(24px,6.5vw,35px)] tracking-[0.02em]">
          16.09.2026
        </p>
      </motion.div>
      <a
        className="absolute right-6 bottom-[22px] z-20 grid h-10 w-6 place-items-center rounded-full border border-[#b98e2e]/70 bg-[#fff7e6]/95 text-[#8a6827] shadow-[0_5px_16px_-6px_rgba(0,0,0,0.45)]"
        href="#invitation"
        aria-label="Перейти к приглашению"
      >
        <ChevronDown size={14} strokeWidth={1.8} className="animate-bounce" />
      </a>
    </section>
  );
}

function Invitation() {
  return (
    <RevealSection
      id="invitation"
      labelledBy="invitation-title"
      className="relative isolate grid min-h-0 place-items-center overflow-hidden bg-paper/95 px-[23px] py-[124px] text-center"
    >
      <img className={styles.invitationLeafTop} src={invitationLeafTop} alt="" aria-hidden="true" />
      <div className="relative z-10">
        <h2
          id="invitation-title"
          className="mb-[27px] font-serif text-[clamp(29px,7.5vw,41px)] leading-[0.87] uppercase"
        >
          Дорогие
          <br />
          <strong className="text-[1.3em] font-medium">
            родные
            <br />и друзья!
          </strong>
        </h2>
        <p className="font-serif text-[clamp(17px,4.7vw,24px)] leading-[1.13]">
          Совсем скоро в нашей жизни
          <br />наступит день, который навсегда
          <br />останется в наших сердцах.
          <br />Мы будем счастливы разделить
          <br />этот особенный момент именно с вами.
          <br />Ваше присутствие станет самым ценным
          <br />подарком для нас.
          <br />С любовью ждем встречи
          <br />в день нашей свадьбы!
        </p>
        <span className="my-[25px] block font-script text-[56px] leading-[0.2] text-gold" aria-hidden="true">
          ~
        </span>
        <h3 className="mb-5 font-sans text-[clamp(24px,6.8vw,34px)] leading-none">
          Əziz ailəmiz
          <br />və dostlarımız!
        </h3>
        <p className="font-sans text-[clamp(14px,4vw,20px)] leading-[1.24]">
          Həyatımızın ən gözəl gününü sizinlə
          <br />birlikdə qeyd etmək bizim üçün
          <br />böyük xoşbəxtlik olacaq.
          <br />Bu özəl gündə sizi aramızda
          <br />görməkdən məmnun olarıq.
        </p>
      </div>
      <img className={styles.invitationLeafBottom} src={invitationLeafBottom} alt="" aria-hidden="true" />
    </RevealSection>
  );
}

type CountdownValues = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(): CountdownValues {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Countdown() {
  const [values, setValues] = useState(getCountdown);

  useEffect(() => {
    const timer = window.setInterval(() => setValues(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units: Array<[keyof CountdownValues, string]> = [
    ["days", "дней"],
    ["hours", "часов"],
    ["minutes", "минут"],
    ["seconds", "секунд"],
  ];

  return (
    <RevealSection
      label="Обратный отсчет до свадьбы"
      className="relative z-10 bg-white/95 px-5 py-11 text-center"
    >
      <p className="mb-[23px] font-serif text-[29px]">До нашей встречи</p>
      <div className="mx-auto grid max-w-[470px] grid-cols-4" role="timer" aria-live="polite">
        {units.map(([unit, label], index) => (
          <div
            className={`grid gap-[5px] ${index ? "border-l border-[#e2d7bf]" : ""}`}
            key={unit}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.strong
                key={values[unit]}
                className="font-serif text-[clamp(29px,8vw,43px)] leading-[0.9] font-medium text-gold"
                initial={{ opacity: 0.2, y: -7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32 }}
              >
                {String(values[unit]).padStart(2, "0")}
              </motion.strong>
            </AnimatePresence>
            <span className="font-sans text-[9px] leading-none tracking-[0.03em] uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>
    </RevealSection>
  );
}

function Schedule() {
  return (
    <RevealSection
      id="schedule"
      labelledBy="schedule-title"
      className="relative z-10 grid min-h-svh place-items-center bg-paper/95 px-[25px] py-[73px] text-center"
    >
      <div className="w-full max-w-[480px]">
        <div className="mb-12 grid justify-items-center">
          <img className="h-[86px] w-[77px] object-contain" src={calendarIcon} alt="" aria-hidden="true" />
          <time className="mt-5 font-serif text-[clamp(48px,14vw,75px)] leading-[0.8]" dateTime="2026-09-16">
            16.09.2026
          </time>
          <em className="mt-6 font-script text-[44px] leading-[0.8] text-gold">Среда</em>
        </div>
        <ScheduleEvent icon={clockIcon} title="Сбор гостей" time="17:00" headingId="schedule-title" />
        <ScheduleEvent icon={glassesIcon} title="Начало мероприятия" time="18:00" />
        <address className="mt-[38px] not-italic">
          <img className="mx-auto h-[86px] w-[77px] object-contain" src={locationIcon} alt="" aria-hidden="true" />
          <p className="mt-4 mb-0.5 font-serif text-[32px] leading-none">Ресторан</p>
          <strong className="block font-serif text-[clamp(46px,13vw,62px)] leading-[0.98] font-medium">
            «Наполеон»
          </strong>
          <a
            className="mt-2 inline-block border-b border-gold/55 font-serif text-[clamp(22px,6.3vw,31px)] leading-none"
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            г.Москва, Ул. Гарибальди, 1А
          </a>
          <motion.a
            className="mx-auto mt-6 flex h-[45px] w-[min(260px,82%)] items-center justify-between rounded-full border border-gold/60 px-[18px] font-sans text-[10px] font-medium tracking-[0.12em] uppercase"
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -2, backgroundColor: "#b98e2e", color: "#fff" }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} />
              Открыть на карте
            </span>
            <ArrowRight size={15} />
          </motion.a>
        </address>
      </div>
    </RevealSection>
  );
}

function ScheduleEvent({
  icon,
  title,
  time,
  headingId,
}: {
  icon: string;
  title: string;
  time: string;
  headingId?: string;
}) {
  return (
    <div className="mt-[39px]">
      <img className="mx-auto h-[86px] w-[77px] object-contain" src={icon} alt="" aria-hidden="true" />
      <h2
        id={headingId}
        className="mt-[15px] mb-[7px] font-serif text-[clamp(37px,10.8vw,55px)] leading-[0.9] font-medium uppercase"
      >
        {title}
      </h2>
      <time className="font-serif text-[clamp(44px,13vw,65px)] leading-none" dateTime={time}>
        {time}
      </time>
    </div>
  );
}

function DressCode() {
  return (
    <RevealSection
      id="dress-code"
      labelledBy="dress-title"
      className="relative z-10 grid min-h-[90svh] place-items-center overflow-hidden bg-paper/95 px-[23px] py-[84px] text-center"
    >
      <img className={styles.dressLeafTop} src={fullLeaf} alt="" aria-hidden="true" />
      <div className="relative z-10">
        <h2 id="dress-title" className="mb-[41px] font-serif text-[clamp(64px,18vw,90px)] leading-[0.8]">
          Dress code
        </h2>
        <p className="font-serif text-[clamp(27px,7.3vw,38px)] leading-[0.98]">
          Нам будет очень приятно,
          <br />если вы поддержите атмосферу
          <br />нашего праздника,
          <br />выбрав элегантный
          <br />вечерний образ.
        </p>
      </div>
      <img className={styles.dressLeafBottom} src={fullLeaf} alt="" aria-hidden="true" />
    </RevealSection>
  );
}

function Farewell() {
  return (
    <RevealSection
      labelledBy="farewell-title"
      className="relative isolate grid min-h-svh place-items-center overflow-hidden text-center text-white"
    >
      <img
        className={styles.farewellPhoto}
        src={stairs}
        width={1280}
        height={1920}
        loading="lazy"
        alt="Эльгун и Самина на мраморной лестнице"
      />
      <div className={styles.farewellShade} />
      <div className="relative z-10 px-5 pt-20 pb-[47px]">
        <p id="farewell-title" className="font-serif text-[clamp(36px,10vw,53px)] leading-[0.94]">
          Любовь становится
          <br />еще прекраснее,
          <br />когда рядом самые
          <br />дорогие люди.
        </p>
        <span className="my-[72px] block font-script text-[56px] leading-[0.2] text-[#e2bf6d]" aria-hidden="true">
          ~
        </span>
        <p className="mb-[42px] font-serif text-[clamp(36px,10vw,52px)]">До встречи!</p>
        <h2 className="grid justify-items-center gap-[18px] font-serif text-[clamp(56px,15vw,79px)] leading-[0.75] tracking-[-0.035em]">
          <span>Elgun</span>
          <span className="block w-full translate-y-[8px] text-center text-[0.65em] leading-[0.75]">&amp;</span>
          <span>Samina</span>
        </h2>
        <time className="mt-[39px] block font-serif text-[clamp(29px,8vw,41px)]" dateTime="2026-09-16">
          16.09.2026
        </time>
      </div>
    </RevealSection>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <ScrollProgress />
      <SoundControl />
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.ambientTop} />
        <span className={styles.ambientBottom} />
      </div>
      <main className="relative z-[2] mx-auto max-w-[530px] overflow-hidden bg-paper shadow-[0_0_42px_rgba(68,54,25,0.13)]">
        <Hero />
        <Invitation />
        <Countdown />
        <Schedule />
        <DressCode />
        <Farewell />
      </main>
    </MotionConfig>
  );
}
