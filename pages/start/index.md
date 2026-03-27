---
title: 开始
---

The world is not beautiful. Therefore, it is. -《奇诺之旅》

## 播放音符测试

### 单个音符
<PlayNote notes="C4" />

### 多个音符
<PlayNote notes="A0 B0 " />

<PlayNote notes="C1 D1 E1 F1 G1 A1 B1" />

<PlayNote notes="C2 D2 E2 F2 G2 A2 B2" />

<PlayNote notes="C3 D3 E3 F3 G3 A3 B3" />

<PlayNote notes="C4 D4 E4 F4 G4 A4 B4" />

<PlayNote notes="C5 D5 E5 F5 G5 A5 B5" />

<PlayNote notes="C6 D6 E6 F6 G6 A6 B6" />

<PlayNote notes="C7 D7 E7 F7 G7 A7 B7" />

<PlayNote notes="C8" />

### 带升降号的音符
<PlayNote notes="C4 D#4 Eb4 F#4" />


### 显示五线谱
<PlayNote notes="C4 D4 E4 F4 | G4 A4 B4 c4" :show-sheet-music="true" />

### 简单旋律
<PlayNote notes="G4 G4 A4 A4 | G42 G42 E4 E4" :show-sheet-music="true" />

### 控制标题显示
<PlayNote notes="C4 D4 E4 F4 | G4 A4 B4 C4" :show-sheet-music="true"  :show-title="true"  />

### 自定义标题
<PlayNote notes="C4 D4 E4 F4  F4 |  F4 | G4 A4 B4 c4" :show-sheet-music="true"  :show-title="true" :conversion-options="{ title: '我的旋律' }" />

### 小节线测试
<PlayNote notes="C4 D4 | E4 F4 | G4 A4 | B4 c4" :show-sheet-music="true" />

### 双小节线
<PlayNote notes="C4 D4 E4 F4 || G4 A4 B4 c4" :show-sheet-music="true" />

### 反复记号
<PlayNote notes="|: C4 D4 E4 F4 :| G4 A4" :show-sheet-music="true" />
