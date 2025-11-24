// src/components/ChecklistRow.js
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Circle } from 'react-native-svg';

export default function ChecklistRow({
  title,
  subtitle,
  icon,             // React element (ej. <Ionicons name="book-outline" .../>)
  done = false,
  countDone = 0,    // 0,1,2...
  countTotal = 1,   // 1 ó 2 (veces requeridas en el día)
  onPress,          // toggle/increment
  onLongPress,      // opcional (decrement)
  onTitlePress,     // 👈 NUEVO: editar perDay
}) {
  const reachedGoal = done || (countTotal > 0 && countDone >= countTotal);
  const clampedDone = Math.max(0, Math.min(countDone, countTotal));
  const fraction = countTotal > 0 ? clampedDone / countTotal : 0;

  const prog = useRef(new Animated.Value(fraction)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef({ fraction, reached: reachedGoal });

  useEffect(() => {
    Animated.timing(prog, { toValue: fraction, duration: 450, useNativeDriver: false }).start();
    if (!prev.current.reached && reachedGoal) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 140, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
    prev.current = { fraction, reached: reachedGoal };
  }, [fraction, reachedGoal, prog, scale]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        backgroundColor: reachedGoal ? '#0f3b2f' : '#0f172a',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#1f2937',
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      {/* Icono izquierdo */}
      <View
        style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: reachedGoal ? '#14532d' : '#111827',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {icon ?? <Ionicons name="checkmark-circle-outline" size={22} color="#e5e7eb" />}
      </View>

      {/* Títulos - propio Touchable para abrir el editor sin activar el toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onTitlePress}
        style={{ flex: 1, paddingRight: 10 }}
      >
        <Text numberOfLines={1} style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700' }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={{ color: '#9ca3af', marginTop: 2 }}>{subtitle}</Text>
        )}
      </TouchableOpacity>

      {/* Anillo de progreso SVG */}
      <RingSVG
        size={56}
        thickness={4}
        trackColor="#374151"
        fillColor="#34d399"
        reached={reachedGoal}
        progress={prog}
        scale={scale}
        labelText={`${clampedDone}/${countTotal}`}
      />
    </TouchableOpacity>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function RingSVG({
  size = 56,
  thickness = 4,
  trackColor = '#374151',
  fillColor = '#34d399',
  progress,        // Animated.Value (0..1)
  reached = false,
  scale,
  labelText = '0/1',
}) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const CIRC = 2 * Math.PI * r;

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });
  const ringOpacity = progress.interpolate({
    inputRange: [0, 0.001, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}
    >
      <Svg width={size} height={size}>
        <G rotation={-90} originX={cx} originY={cy}>
          <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={thickness} fill="none" />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            stroke={fillColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            opacity={ringOpacity}
          />
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center', justifyContent: 'center',
          width: size - thickness * 2 - 6,
          height: size - thickness * 2 - 6,
          borderRadius: 9999,
        }}
      >
        {reached ? (
          <Ionicons name="checkmark" size={22} color={fillColor} />
        ) : (
          <Text style={{ color: '#d1d5db', fontWeight: '900', fontSize: 14 }}>
            {labelText}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
