import { ExerciseLibraryItem } from '../types';

export const exerciseLibraryData: ExerciseLibraryItem[] = [
  {
    id: "ex-1",
    name: "杠铃卧推",
    en: "Barbell Bench Press",
    pinyin: "glwt",
    muscle: "胸部",
    secondaryMuscles: ["三头肌", "前束三角肌"],
    type: "力量",
    equipment: "杠铃",
    difficulty: 3,
    has3D: true,
    image: "https://images.unsplash.com/photo-1690731033723-ad718c6e585a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "平躺在卧推凳上，双脚踩实地面以保持稳定。握距略宽于肩，收紧肩胛骨，背部微微反弓。",
      execution: "缓慢下放杠铃至胸部下沿，停留一秒后向上推起，直至手臂伸直但不锁死关节。",
      breathing: "推起时呼气，下放时吸气。"
    },
    tips: ["肩胛骨全程保持收紧后收下沉", "手腕保持中立位，不要过度后伸"],
    mistakes: ["臀部离开凳面借力", "杠铃下放位置过高（落到脖子处）", "手肘外展角度过大"]
  },
  {
    id: "ex-2",
    name: "哑铃卧推",
    en: "Dumbbell Bench Press",
    pinyin: "ylwt",
    muscle: "胸部",
    secondaryMuscles: ["三头肌", "前束三角肌"],
    type: "力量",
    equipment: "哑铃",
    difficulty: 2,
    has3D: true,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "双手持哑铃仰卧在平板凳上，将哑铃置于胸前，掌心朝前。",
      execution: "向上推举哑铃至双臂伸直，顶点时两哑铃不要相撞。随后缓慢下放哑铃至胸部外侧。",
      breathing: "推起时呼气，下放时吸气。"
    },
    tips: ["感受胸大肌的拉伸和收缩", "哑铃下落轨迹应呈微弧线"],
    mistakes: ["哑铃在最高点相撞失去张力", "手腕不稳定导致哑铃晃动"]
  },
  {
    id: "ex-3",
    name: "上斜卧推",
    en: "Incline Bench Press",
    pinyin: "sxwt",
    muscle: "胸部",
    secondaryMuscles: ["前束三角肌", "三头肌"],
    type: "力量",
    equipment: "杠铃",
    difficulty: 3,
    has3D: true,
    image: "https://images.unsplash.com/photo-1584466977763-5e4be4c36565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "将卧推凳调节至上斜30-45度，双脚踩实地面。握距略宽于肩，收紧肩胛骨。",
      execution: "缓慢下放杠铃至上胸部锁骨下方，停留一秒后向上推起。",
      breathing: "推起时呼气，下放时吸气。"
    },
    tips: ["上胸部是受力重点", "注意肩关节的稳定"],
    mistakes: ["背部过度反弓导致变成平板卧推", "手肘过度外展压迫肩关节"]
  },
  {
    id: "ex-4",
    name: "绳索夹胸",
    en: "Cable Crossover",
    pinyin: "ssjx",
    muscle: "胸部",
    type: "力量",
    equipment: "绳索",
    difficulty: 2,
    has3D: true,
    image: "https://images.unsplash.com/photo-1590074121397-dc087f7a7b90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "站在龙门架正中，双手握住高位/中位/低位D型把手，身体前倾15度，膝盖微曲。",
      execution: "手臂微屈固定角度，胸肌发力将把手向胸前抱拢，在顶点交叉或并拢并挤压胸肌。然后缓慢还原至胸肌充分拉伸。",
      breathing: "夹胸时呼气，还原时吸气。"
    },
    tips: ["想象在拥抱一棵大树", "全程肘关节角度保持不变"],
    mistakes: ["变成绳索推胸动作", "含胸驼背导致背部借力"]
  },
  {
    id: "ex-5",
    name: "器械推胸",
    en: "Machine Chest Press",
    pinyin: "qxtx",
    muscle: "胸部",
    type: "力量",
    equipment: "固定器械",
    difficulty: 1,
    image: "https://images.unsplash.com/photo-1694192710453-95a30de8a778?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "坐在推胸器械上，调节座椅高度使把手齐平中胸。收紧肩胛骨，贴紧靠背。",
      execution: "向正前方推起把手至手臂微屈，随后控制重量缓慢还原。",
      breathing: "推起时呼气，还原时吸气。"
    },
    tips: ["始终保持肩胛骨后收下沉", "控制下放速度"],
    mistakes: ["肩部前伸借力", "下放速度过快失去肌肉张力"]
  },
  {
    id: "ex-6",
    name: "俯卧撑",
    en: "Push Up",
    pinyin: "fwc",
    muscle: "胸部",
    secondaryMuscles: ["三头肌", "核心", "前束三角肌"],
    type: "力量",
    equipment: "自重",
    difficulty: 1,
    has3D: true,
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "双手撑地略宽于肩，双脚并拢或分开，身体从头到脚呈一条直线。收紧核心。",
      execution: "屈肘缓慢下降身体，直至胸部几乎贴地。然后快速推起身体至初始位置。",
      breathing: "撑起时呼气，下降时吸气。"
    },
    tips: ["核心始终收紧，避免塌腰", "手肘向后方呈约45度夹角，不要完全打开向两侧"],
    mistakes: ["塌腰撅臀", "脖子前伸", "半程动作"]
  },
  {
    id: "ex-7",
    name: "杠铃深蹲",
    en: "Barbell Squat",
    pinyin: "glsd",
    muscle: "腿部",
    secondaryMuscles: ["臀部", "核心"],
    type: "力量",
    equipment: "杠铃",
    difficulty: 4,
    has3D: true,
    image: "https://images.unsplash.com/photo-1770026136877-8ddf98cd6500?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "将杠铃放在斜方肌上（高杠）或后三角肌上（低杠），双脚与肩同宽或略宽，脚尖外八字。挺胸收腹。",
      execution: "屈髋屈膝下蹲，像要坐椅子一样，下蹲至大腿与地面平行或更低。重心踩在脚掌中部。用力蹬地站起。",
      breathing: "起立时呼气（过顶点后），下蹲前吸气并憋气（瓦式呼吸）。"
    },
    tips: ["保持脊柱中立，不要龟背", "膝盖方向与脚尖方向一致"],
    mistakes: ["膝盖内扣", "先起臀部后起杠铃（早安式深蹲）", "脚跟离地"]
  },
  {
    id: "ex-8",
    name: "传统硬拉",
    en: "Conventional Deadlift",
    pinyin: "ctyl",
    muscle: "背部",
    secondaryMuscles: ["臀部", "大腿后侧", "核心"],
    type: "力量",
    equipment: "杠铃",
    difficulty: 4,
    has3D: true,
    image: "https://images.unsplash.com/photo-1534368270820-9de3d8053204?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "站在杠铃中间，脚距与髋同宽，杠铃位于脚掌正上方。俯身握住杠铃，屈膝直到小腿贴近杠铃。挺胸，背部绷直。",
      execution: "腿部蹬地发力，顺势伸展髋关节将杠铃拉起，直至身体完全直立。随后屈髋屈膝原路下放杠铃至地面。",
      breathing: "拉起时呼气，下放时吸气。"
    },
    tips: ["背部必须保持完全绷直", "杠铃贴着小腿和大腿上下移动"],
    mistakes: ["龟背起重导致腰椎受压", "把硬拉做成了深蹲（臀部放太低）", "杠铃远离身体"]
  },
  {
    id: "ex-9",
    name: "引体向上",
    en: "Pull Up",
    pinyin: "ytxs",
    muscle: "背部",
    secondaryMuscles: ["二头肌", "前臂"],
    type: "力量",
    equipment: "自重",
    difficulty: 4,
    has3D: true,
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "正手握住单杠，握距略宽于肩，身体悬垂，核心收紧。",
      execution: "背阔肌发力，将身体向上拉起，直到下巴超过单杠。控制身体缓慢下放至初始位置。",
      breathing: "拉起时呼气，下放时吸气。"
    },
    tips: ["将胸部往单杠方向挺", "下放要充分伸展背阔肌"],
    mistakes: ["依赖手臂和惯性晃动发力", "没有沉肩导致斜方肌代偿", "半程动作"]
  },
  {
    id: "ex-10",
    name: "哑铃划船",
    en: "Dumbbell Row",
    pinyin: "ylhc",
    muscle: "背部",
    secondaryMuscles: ["二头肌"],
    type: "力量",
    equipment: "哑铃",
    difficulty: 2,
    has3D: true,
    image: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "单膝跪在长凳上，同侧手撑凳，另一侧脚站实地面，手持哑铃。背部保持平直且几乎与地面平行。",
      execution: "背阔肌发力，将哑铃向上拉向腰部。顶峰收缩一秒，缓慢下放至手臂伸直感觉背部拉伸。",
      breathing: "拉起时呼气，下放时吸气。"
    },
    tips: ["想象手肘向后上方提拉，而非手腕用力", "保持身体躯干稳定不翻转"],
    mistakes: ["身体过度旋转借力", "拉向胸部导致二头肌和后束代偿"]
  },
  {
    id: "ex-11",
    name: "哑铃推举",
    en: "Dumbbell Shoulder Press",
    pinyin: "yltj",
    muscle: "肩部",
    secondaryMuscles: ["三头肌", "上胸部"],
    type: "力量",
    equipment: "哑铃",
    difficulty: 2,
    has3D: true,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "坐在靠背直立的训练凳上，双手持哑铃至肩部高度，掌心朝前，手肘微微向前。",
      execution: "垂直向上推举哑铃直到手臂微屈，顶点时两哑铃不要相碰。缓慢下放至初始位置。",
      breathing: "推举时呼气，下放时吸气。"
    },
    tips: ["手腕保持中立直立", "下背部紧贴靠背"],
    mistakes: ["过度反弓借用胸肌推起", "哑铃在最高点相撞", "下放位置过浅"]
  },
  {
    id: "ex-12",
    name: "侧平举",
    en: "Lateral Raise",
    pinyin: "cpj",
    muscle: "肩部",
    type: "力量",
    equipment: "哑铃",
    difficulty: 1,
    has3D: true,
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "站立，双脚与肩同宽，双手各持哑铃置于身体两侧或身前，手肘微屈。",
      execution: "肩膀中束发力，将哑铃向两侧举起，直到与肩同高。顶峰收缩后缓慢下放。",
      breathing: "举起时呼气，下放时吸气。"
    },
    tips: ["倒水姿势：小指略微高于大拇指", "肩部不要耸起"],
    mistakes: ["使用过大重量导致身体晃动借力", "耸肩导致斜方肌代偿", "手臂完全伸直伤肘"]
  },
  {
    id: "ex-13",
    name: "杠铃弯举",
    en: "Barbell Curl",
    pinyin: "glwj",
    muscle: "手臂",
    type: "力量",
    equipment: "杠铃",
    difficulty: 2,
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "站立，双手反握杠铃（掌心朝上），握距与肩同宽。大臂贴紧身体两侧。",
      execution: "以肘关节为支点，二头肌发力向上弯举杠铃至下巴高度。缓慢下放至手臂微屈。",
      breathing: "弯举时呼气，下放时吸气。"
    },
    tips: ["大臂始终紧贴身体两侧，不可前后移动", "下放至肌肉仍有张力的程度即可"],
    mistakes: ["身体前后摇晃借力", "借用肩部三角肌前束抬起杠铃"]
  },
  {
    id: "ex-14",
    name: "绳索下压",
    en: "Triceps Pushdown",
    pinyin: "ssxy",
    muscle: "手臂",
    type: "力量",
    equipment: "绳索",
    difficulty: 1,
    image: "https://images.unsplash.com/photo-1590074121397-dc087f7a7b90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "面向龙门架站立，双手握住高位直杆或V型绳索，大臂贴紧肋骨。核心收紧，身体微前倾。",
      execution: "三头肌发力向下按压绳索直到手臂完全伸直，顶峰收缩停顿。随后控制速度向上退让至大臂水平。",
      breathing: "下压时呼气，还原时吸气。"
    },
    tips: ["大臂始终保持固定不动，只有小臂运动", "在最底端尽力向两侧分开绳子增加收缩感"],
    mistakes: ["利用身体重量向下压", "手腕弯曲导致手腕疼痛", "上放位置过高导致肩膀借力"]
  },
  {
    id: "ex-15",
    name: "卷腹",
    en: "Crunch",
    pinyin: "jf",
    muscle: "核心",
    type: "力量",
    equipment: "自重",
    difficulty: 1,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "仰卧在瑜伽垫上，双膝弯曲，双脚平踩地面。双手轻放于耳后或交叉于胸前。",
      execution: "腹部发力，将上背部卷离地面。下背部保持贴紧地面。顶点停顿后缓慢下降。",
      breathing: "卷起时用力呼气，下放时吸气。"
    },
    tips: ["下巴和胸部之间保持一个拳头的距离", "动作速度要慢，注重腹肌的收缩感"],
    mistakes: ["双手抱头用力拉脖子导致颈椎受伤", "整个背部离���地面��仰卧起坐造成腰椎压力"]
  },
  {
    id: "ex-16",
    name: "平板支撑",
    en: "Plank",
    pinyin: "pbzc",
    muscle: "核心",
    type: "静力",
    equipment: "自重",
    difficulty: 1,
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "俯卧，使用小臂和脚尖撑地。手肘位于肩膀正下方。",
      execution: "收紧腹部和臀部，保持身体从头、肩、臀到脚跟呈一条直线。保持此姿势。",
      breathing: "自然均匀呼吸，不要憋气。"
    },
    tips: ["不仅收紧腹肌，也要夹紧臀大肌和股四头肌", "眼睛看向双手之间的地面，保持颈椎中立"],
    mistakes: ["塌腰撅臀", "低头或仰头", "肩膀缩起没有稳定肩胛"]
  },
  {
    id: "ex-17",
    name: "椭圆机跑",
    en: "Elliptical Machine",
    pinyin: "tyjp",
    muscle: "全身",
    type: "有氧",
    equipment: "固定器械",
    difficulty: 1,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "站上踏板，双手握住活动把手，设定合适的阻力和坡度。",
      execution: "保持上半身直立，手脚配合做跑步状圆周运动。",
      breathing: "根据配速自然有节奏地呼吸。"
    },
    tips: ["全脚掌踩实踏板，不要踮脚尖", "可以向后踩来更多刺激臀大肌"],
    mistakes: ["过度依赖身体重量压踩", "背部弯曲姿态不良"]
  },
  {
    id: "ex-18",
    name: "泡沫轴放松：背阔肌",
    en: "Foam Rolling Lats",
    pinyin: "pmzfsbkj",
    muscle: "背部",
    type: "拉伸",
    equipment: "自重",
    difficulty: 1,
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    instructions: {
      start: "侧躺在瑜伽垫上，将泡沫轴放在腋窝下方的背阔肌位置。下方手臂伸直。",
      execution: "利用身体重量压住泡沫轴，在腋窝到中背部的区间缓慢来回滚动。遇到痛点可停留10-15秒。",
      breathing: "深长呼吸，帮助肌肉放松。"
    },
    tips: ["滚动速度要慢，大约每秒2厘米", "不要滚动到下背部腰椎区域"],
    mistakes: ["滚动速度过快", "屏住呼吸对抗疼痛"]
  }
];