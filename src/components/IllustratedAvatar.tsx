import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface IllustratedAvatarProps {
  type: number;
  size?: number;
  backgroundColor: string;
}

const IllustratedAvatar: React.FC<IllustratedAvatarProps> = ({ type, size = 80, backgroundColor }) => {
  const avatarSvg = useMemo(() => {
    const avatarSeeds = [
      'Lily',
      'Grace',
      'Sophia',
      'Emma',
      'Charlotte',
      'Isabella',
      'James',
      'William',
      'Michael',
      'Daniel',
      'Henry',
      'Alexander',
    ];
    const seed = avatarSeeds[type - 1] || avatarSeeds[0];
    const avatar = createAvatar(avataaars, { 
      seed,
      size: size,
      radius: 50,
    });
    return avatar.toString();
  }, [type, size]);

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <View style={styles.avatarWrapper}>
        <SvgXml xml={avatarSvg} width={size * 0.7} height={size * 0.7} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 1000,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IllustratedAvatar;
