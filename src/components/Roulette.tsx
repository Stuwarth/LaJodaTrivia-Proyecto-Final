import React, { memo, useCallback, useMemo } from 'react';
import { View, Animated } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
// Icons
// @ts-ignore - svg transformer provides a React component
import MusicIcon from '../../assets/icons/music.svg';
// @ts-ignore
import DeportesIcon from '../../assets/icons/deportes.svg';
// @ts-ignore
import ComidasIcon from '../../assets/icons/comidas.svg';
// @ts-ignore
import FiestaIcon from '../../assets/icons/fiesta.svg';

type Props = {
  size: number;
  categories: string[];
  angle: Animated.AnimatedInterpolation<string> | Animated.Value;
  colors?: string[];
  light?: boolean; // simplified rendering when true
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  // sweep-flag = 1 for clockwise arcs (aligns with RN rotate positive)
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function Roulette({ size, categories, angle, colors, light }: Props) {
  const radius = size / 2;
  const seg = 360 / Math.max(categories.length, 1);
  const palette = useMemo(
    () => (colors && colors.length > 0 ? colors : ['#FFD166', '#06D6A0', '#EF476F', '#118AB2', '#073B4C']),
    [colors]
  );
  const offset = seg / 2; // center each sector at the top pointer
  const rimW = Math.max(8, Math.floor(size * 0.06));

  const normalize = useCallback((name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  const IconForCategory = useCallback((name: string) => {
    const n = normalize(name);
    if (n.includes('musica') || n.includes('music')) return MusicIcon as any;
    if (
      n.includes('deporte') ||
      n.includes('deportes') ||
      n.includes('sport') ||
      n.includes('sports')
    )
      return DeportesIcon as any;
    if (n.includes('comida') || n.includes('comidas') || n.includes('food'))
      return ComidasIcon as any;
    if (n.includes('fiesta') || n.includes('party') || n.includes('fiestas'))
      return FiestaIcon as any;
    return null;
  }, [normalize]);

  const sectors = useMemo(() => {
    const rInner = radius - rimW * 1.2;
    const iconSize = Math.max(30, size * 0.24);
    return categories.map((c, i) => {
      const start = seg * i - offset;
      const end = start + seg;
      const d = arcPath(radius, radius, rInner, start, end);
      const fill = palette[i % palette.length];
      const mid = start + seg / 2;
      const ncat = normalize(c);
      const isDeportes = (
        ncat.includes('deporte') || ncat.includes('deportes') || ncat.includes('sport') || ncat.includes('sports')
      );
      const isComidas = (
        ncat.includes('comida') || ncat.includes('comidas') || ncat.includes('food')
      );
      const isFiesta = (
        ncat.includes('fiesta') || ncat.includes('fiestas') || ncat.includes('party')
      );
      const scale = isDeportes ? 0.60 : isComidas ? 0.90 : isFiesta ? 0.65 : 1;
      const lightScale = light ? 0.92 : 1; // slightly smaller while spinning to reduce overdraw
      const w = iconSize * scale * lightScale;
      const h = iconSize * scale * lightScale;
      // Tiny inward adjustment for better centering
      const iconR = Math.max(rInner * 0.62, rInner - iconSize * 0.80);
      const pos = polarToCartesian(radius, radius, iconR, mid);
      const IconComp = IconForCategory(c);
      return { key: `${c}-${i}`, d, fill, IconComp, pos, w, h };
    });
  }, [categories, palette, radius, rimW, seg, offset, size, normalize, IconForCategory]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          transform: [
            typeof angle === 'object' && 'interpolate' in angle
              ? { rotate: angle as Animated.AnimatedInterpolation<string> }
              : { rotate: (angle as any) },
          ],
        }}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      >
        <Svg width={size} height={size} pointerEvents="none" focusable={false as any}>
          {/* Thick dual-tone rim */}
          <Circle cx={radius} cy={radius} r={radius - (light ? rimW * 0.32 : rimW) / 2} stroke="#6B7280" strokeWidth={light ? rimW * 0.32 : rimW} fill="#C7CBD1" />
          {!light && (
            <Circle cx={radius} cy={radius} r={radius - rimW - 2} stroke="#E5E7EB" strokeWidth={Math.max(4, Math.floor(rimW * 0.55))} fill="none" />
          )}
          <G>
            {sectors.map(({ key, d, fill, IconComp, pos, w, h }) => (
              <G key={key}>
                <Path d={d} fill={fill} stroke={light ? 'none' : '#ffffff'} strokeWidth={light ? 0 : 2} />
                {IconComp ? (
                  <G x={pos.x - w / 2} y={pos.y - h / 2}>
                    {/* @ts-ignore */}
                    <IconComp width={w} height={h} />
                  </G>
                ) : null}
              </G>
            ))}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

export default memo(Roulette);
