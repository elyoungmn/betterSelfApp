// src/components/HabitItem.js
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function HabitItem({
  title,
  count = 0,
  perDay = 1,
  onPress,
  onLongPress,
  onTitlePress,
  size = 44,
  tint = '#22e37a',   // verde más agradable
  track = '#1e293b',  // pista gris oscuro
}) {
  const goal = Math.max(1, perDay || 1);
  const fraction = Math.max(0, Math.min(1, count / goal));

  // Animación 0→1 del progreso
  const anim = useRef(new Animated.Value(0)).current;

  const cfg = useMemo(() => {
    const strokeWidth = Math.max(4, Math.round(size * 0.12));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    return { strokeWidth, radius, circumference };
  }, [size]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: fraction,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fraction]);

  // offset = longitud que “falta”; al inicio = circunferencia (vacío), al final = 0 (lleno)
  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [cfg.circumference, 0],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        backgroundColor: '#0e1a24',
        borderColor: '#1f2937',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Título a la IZQUIERDA (solo texto abre el editor) */}
      <Pressable style={{ flex: 1, paddingRight: 12 }} onPress={onTitlePress}>
        <Text numberOfLines={1} style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '600' }}>
          {title}
        </Text>
      </Pressable>

      {/* Indicador circular a la DERECHA */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: '-90deg' }] }} // empieza arriba y gira horario
        >
          {/* pista */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={cfg.radius}
            stroke={track}
            strokeWidth={cfg.strokeWidth}
            fill="none"
          />
          {/* progreso */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={cfg.radius}
            stroke={tint}
            strokeWidth={cfg.strokeWidth}
            fill="none"
            strokeDasharray={`${cfg.circumference} ${cfg.circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* centro con contador */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#e5e7eb', fontWeight: '700', fontSize: 12 }}>
            {Math.min(count, goal)}/{goal}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Circulo animado con Animated
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
