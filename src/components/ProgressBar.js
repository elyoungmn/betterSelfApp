// src/components/ProgressBar.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing } from 'react-native';

export default function ProgressBar({
  progress = 0,          // 0..1
  height = 10,
  trackColor = '#1f2937',
  barColor = '#22c55e',
  radius,                // por defecto = height/2
  duration = 500,
  style,
}) {
  const [w, setW] = useState(0);             // ancho del track
  const anim = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
  const targetPx = w * clamped;

  // 1) Fija el valor inicial sin animar al montar/medir
  useEffect(() => {
    if (w === 0) return;
    if (first.current) {
      anim.setValue(targetPx);
      first.current = false;
    } else {
      Animated.timing(anim, {
        toValue: targetPx,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // animamos width
      }).start();
    }
    // solo cuando cambian w o progress
  }, [w, clamped]);

  const r = radius ?? height / 2;

  return (
    <View
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={[
        { height, backgroundColor: trackColor, borderRadius: r, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          width: anim,                 // << animado en píxeles
          backgroundColor: barColor,
          borderRadius: r,
        }}
      />
    </View>
  );
}
