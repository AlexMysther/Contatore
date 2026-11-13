import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, LayoutAnimation, Platform, Pressable, UIManager,
  type PressableProps, type StyleProp, type ViewStyle,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animazioni leggere, tutte legate a un'azione dell'utente.
// Se il sistema chiede "riduci movimento" diventano istantanee.

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (alive) setReduce(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduce;
}

/** Fa scorrere con dolcezza il layout al prossimo render (espansioni, riordini, rimozioni). */
export function smoothLayout() {
  LayoutAnimation.configureNext({
    duration: 240,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pulsante che si "preme" con una piccola molla. */
export function PressScale({
  style, scaleTo = 0.96, onPressIn, onPressOut, ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => {
    if (reduce) return;
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={e => { to(scaleTo); onPressIn?.(e); }}
      onPressOut={e => { to(1); onPressOut?.(e); }}
      style={[style, { transform: [{ scale }] }]}
    />
  );
}

/** Piccolo "pop" ogni volta che `trigger` cambia (spunta completata, numero aggiornato). */
export function Pop({
  trigger, style, amount = 1.18, children,
}: { trigger: unknown; style?: StyleProp<ViewStyle>; amount?: number; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduce) return;
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: amount, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  }, [trigger]);
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

type Tone = { bg: string; border: string };

/** Contenitore che sfuma tra due colori di sfondo/bordo quando `active` cambia. */
export function ColorFade({
  active, off, on, style, children,
}: { active: boolean; off: Tone; on: Tone; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const t = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { t.setValue(active ? 1 : 0); return; }
    Animated.timing(t, { toValue: active ? 1 : 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [active, reduce]);
  const backgroundColor = t.interpolate({ inputRange: [0, 1], outputRange: [off.bg, on.bg] });
  const borderColor     = t.interpolate({ inputRange: [0, 1], outputRange: [off.border, on.border] });
  return <Animated.View style={[style, { backgroundColor, borderColor }]}>{children}</Animated.View>;
}

/** Riempimento di una barra di progresso (0–1) che scorre invece di saltare. */
export function ProgressFill({ progress, style }: { progress: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const p = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    if (reduce) { p.setValue(progress); return; }
    Animated.timing(p, { toValue: progress, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, reduce]);
  const width = p.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return <Animated.View style={[style, { width }]} />;
}

/**
 * Entrata al primo render: dissolvenza + piccolo scorrimento/scala.
 * `delay` serve per l'effetto a cascata, `bouncy` usa una molla (logo).
 */
export function Enter({
  style, children, delay = 0, fromY = 14, fromScale = 1, bouncy = false,
}: {
  style?: StyleProp<ViewStyle>; children: React.ReactNode;
  delay?: number; fromY?: number; fromScale?: number; bouncy?: boolean;
}) {
  const reduce = useReduceMotion();
  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    running.current = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      bouncy
        ? Animated.spring(move, { toValue: 1, delay, speed: 8, bounciness: 10, useNativeDriver: true })
        : Animated.timing(move, { toValue: 1, duration: 340, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    running.current.start();
    return () => running.current?.stop();
  }, []);
  useEffect(() => {
    if (!reduce) return;
    running.current?.stop();
    fade.setValue(1);
    move.setValue(1);
  }, [reduce]);
  const translateY = move.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] });
  const scale      = move.interpolate({ inputRange: [0, 1], outputRange: [fromScale, 1] });
  return <Animated.View style={[style, { opacity: fade, transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>;
}

/** Respiro lento e continuo per gli stati di attesa (si ferma con "riduci movimento"). */
export function Pulse({
  style, children, amount = 1.07,
}: { style?: StyleProp<ViewStyle>; children: React.ReactNode; amount?: number }) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduce) { scale.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: amount, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce]);
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

/** Entra dal basso con dissolvenza quando compare (es. barra "Invia modifiche"). */
export function EnterUp({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const t = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return <Animated.View style={[style, { opacity: t, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
