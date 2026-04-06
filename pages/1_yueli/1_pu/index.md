---
title: 四种记谱法
---

## 科学记谱法

科学记谱法是一套给声音“精准定位”的全球标准命名系统，用来彻底消除歧义，明确到底弹的是钢琴上的哪一个键。

一个八度是从 C-B 即 C D E F G A B，后面加上数字，表示在哪个八度中，比如 C4 D4

A4 = 440Hz 为标准音

C4 位于标准88音钢琴的正中间， 88 键钢琴的音域是 A0-C8

![](./spn.png)


## 简谱

简谱是一套简明的记谱方法，因其简单，在中国得到广泛的使用，使用 1-7 以及上下加点来表示音高的不同，而 1=C， 来进行基准音定位。

![](./jianpu.png)



## 五线谱


五线谱就是音乐的“二维坐标系”, X 轴上看音符表示时值，Y 轴上看音符表示音高。

谱表： 五条平行横线的整体

线： 谱表上的那五条实心横线，从下往上数

间： 横线之间的空白区域

上/下加线：五条横线之外的线

上/下加间：上/下加线之间或域上下线的空白区域

高/中音/谱号： 给五条平行线定基准，尽量把所需要的音符固定在五条横线内，减少加线。

![](./staff.png)




## ABC 记谱法

ABC记谱法是一套纯文本的五线谱源代码，通常用来给计算机使用的，可以渲染成五线谱的样式图片，如下的五线谱，就是通过 abcjs 进行渲染而成。

同一段谱子，他们在五线谱中的 高/中/低音谱上表现形式不一样，但是他们的音高是一致的。例如：C4 D4 E4 F4 G4 A4 B4

高音谱号: 第二线为 G4
<YueLiNotes notationType="abc" notes="X:1
M:4/4
L:1/4
Q:60
K:C
C D E F G A B c
" :showSheetMusic="true" :showNotes="true" :showTitle="false"  />


中音谱号: 第三线为 C4
<YueLiNotes notationType="abc" notes="X:1
M:4/4
L:1/4
Q:60
K:C clef=alto
C D E F G A B c
" :showSheetMusic="true" :showNotes="true" :showTitle="false" />



低音谱号: 第四线为 F3
<YueLiNotes notationType="abc" notes="X:1
M:4/4
L:1/4
Q:60
K:C clef=bass
C D E F G A B c
" :showSheetMusic="true" :showNotes="true" :showTitle="false" />



总之，科学音高是“身份证号”，简谱是“口头小名”，五线谱是“高精度彩色照片”，ABC 记谱法是“冲洗照片的底片（胶卷）”。它们记录的是同一个东西，只是用途完全不同



