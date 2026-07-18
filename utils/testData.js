/**
 * 测试题库
 * 三个量表：注意力、亲子依恋、气质类型
 */
const testQuestions = {
  // ===== 注意力测试 (15题) =====
  attention: {
    name: '注意力测试 v1.0',
    description: '通过日常行为评估宝宝注意力水平',
    type: 'attention',
    categories: {
      sustained: { name: '持续性注意', maxScore: 25, questions: [1, 2, 3, 4, 5] },
      selective: { name: '选择性注意', maxScore: 25, questions: [6, 7, 8, 9, 10] },
      shifting: { name: '注意转移', maxScore: 25, questions: [11, 12, 13, 14, 15] }
    },
    questions: [
      {
        id: 1,
        text: '宝宝能专注地玩一个玩具超过5分钟吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 2,
        text: '给宝宝讲故事时，TA能持续注视绘本画面吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 3,
        text: '宝宝能安静地完成简单的拼图或搭积木吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 4,
        text: '听音乐或童谣时，宝宝能保持注意力2分钟以上吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 5,
        text: '宝宝自己吃饭时能从头到尾坐在餐桌旁吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 6,
        text: '在有电视声音的环境中，宝宝仍能专注于自己的游戏吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 7,
        text: '多个玩具放在一起时，宝宝能选中一个并专心玩耍吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 8,
        text: '家人在旁边说话时，宝宝能不受干扰继续手头活动吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 9,
        text: '在热闹的游乐场里，宝宝能专注于一项活动吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 10,
        text: '当有人从旁边走过时，宝宝不会轻易分心回头张望吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 11,
        text: '从一个玩具换到另一个玩具时，宝宝能顺利过渡而不哭闹吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 12,
        text: '叫宝宝名字时，TA能快速从当前活动中回应你吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 13,
        text: '游戏时间结束要开始吃饭时，宝宝能较快转换状态吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 14,
        text: '宝宝能根据大人指令灵活切换不同活动吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 15,
        text: '和小朋友一起玩时，宝宝能在不同游戏间自然切换吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '经常', value: 3 },
          { label: '几乎总是', value: 4 },
          { label: '总是', value: 5 }
        ]
      }
    ]
  },

  // ===== 亲子依恋测试 (10题) =====
  attachment: {
    name: '亲子依恋测试 v1.0',
    description: '评估宝宝与主要照顾者的依恋关系质量',
    type: 'attachment',
    questions: [
      {
        id: 1,
        text: '当您离开宝宝视线时，TA会表现出不安或哭闹吗？',
        options: [
          { label: '完全不会', value: 1 },
          { label: '偶尔会', value: 2 },
          { label: '有时会', value: 3 },
          { label: '经常会', value: 4 },
          { label: '每次都会', value: 5 }
        ]
      },
      {
        id: 2,
        text: '您回来后，宝宝会主动靠近您或要求抱抱吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '有时', value: 3 },
          { label: '经常', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 3,
        text: '在陌生环境中，宝宝会以您为"安全基地"进行探索吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '有时', value: 3 },
          { label: '经常', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 4,
        text: '宝宝受伤或难过时，会首先找您寻求安慰吗？',
        options: [
          { label: '从不', value: 1 },
          { label: '偶尔', value: 2 },
          { label: '有时', value: 3 },
          { label: '经常', value: 4 },
          { label: '总是', value: 5 }
        ]
      },
      {
        id: 5,
        text: '宝宝愿意接受陌生人友好的互动吗（在您在场时）？',
        options: [
          { label: '完全不接受', value: 1 },
          { label: '不太接受', value: 2 },
          { label: '看情况', value: 3 },
          { label: '基本接受', value: 4 },
          { label: '完全接受', value: 5 }
        ]
      },
      {
        id: 6,
        text: '宝宝和您分离后重聚时，容易被安抚和转移注意力吗？',
        options: [
          { label: '很难', value: 1 },
          { label: '需要较长时间', value: 2 },
          { label: '一般', value: 3 },
          { label: '较快', value: 4 },
          { label: '非常快', value: 5 }
        ]
      },
      {
        id: 7,
        text: '宝宝遇到陌生人时会躲到您身后或抱紧您吗？',
        options: [
          { label: '总是躲起来', value: 5 },
          { label: '经常躲起来', value: 4 },
          { label: '有时会', value: 3 },
          { label: '偶尔会', value: 2 },
          { label: '完全不会', value: 1 }
        ]
      },
      {
        id: 8,
        text: '宝宝更愿意和您一起玩耍而不是独自玩耍吗？',
        options: [
          { label: '完全自己玩', value: 1 },
          { label: '多数自己玩', value: 2 },
          { label: '一半一半', value: 3 },
          { label: '多数一起玩', value: 4 },
          { label: '总想一起玩', value: 5 }
        ]
      },
      {
        id: 9,
        text: '当您批评或生气时，宝宝会表现得焦虑不安吗？',
        options: [
          { label: '完全不会', value: 1 },
          { label: '不太会', value: 2 },
          { label: '有一点', value: 3 },
          { label: '比较明显', value: 4 },
          { label: '非常明显', value: 5 }
        ]
      },
      {
        id: 10,
        text: '总体来说，您觉得宝宝和您的情感连接亲密吗？',
        options: [
          { label: '不亲密', value: 1 },
          { label: '不太亲密', value: 2 },
          { label: '一般', value: 3 },
          { label: '比较亲密', value: 4 },
          { label: '非常亲密', value: 5 }
        ]
      }
    ]
  },

  // ===== 气质类型测试 (20题) =====
  temperament: {
    name: '气质类型测试 v1.0',
    description: '基于Thomas & Chess气质九维度理论评估宝宝气质',
    type: 'temperament',
    categories: {
      activity: { name: '活动水平', maxScore: 50, questions: [1, 2] },
      rhythmicity: { name: '节律性', maxScore: 50, questions: [3, 4] },
      approach: { name: '趋避性', maxScore: 50, questions: [5, 6] },
      adaptability: { name: '适应性', maxScore: 50, questions: [7, 8] },
      intensity: { name: '反应强度', maxScore: 50, questions: [9, 10] },
      mood: { name: '情绪本质', maxScore: 50, questions: [11, 12] },
      persistence: { name: '坚持性', maxScore: 50, questions: [13, 14] },
      distractibility: { name: '注意分散度', maxScore: 50, questions: [15, 16] },
      threshold: { name: '反应阈', maxScore: 50, questions: [17, 18, 19, 20] }
    },
    questions: [
      {
        id: 1,
        text: '洗澡、换尿布时，宝宝会不停扭动身体吗？',
        options: [
          { label: '很安静', value: 1 },
          { label: '偶尔动', value: 2 },
          { label: '比较活跃', value: 3 },
          { label: '很活跃', value: 4 },
          { label: '极度活跃', value: 5 }
        ]
      },
      {
        id: 2,
        text: '宝宝平时玩耍时活动量大吗（如跑跳、攀爬）？',
        options: [
          { label: '很小', value: 1 },
          { label: '较小', value: 2 },
          { label: '适中', value: 3 },
          { label: '较大', value: 4 },
          { label: '很大', value: 5 }
        ]
      },
      {
        id: 3,
        text: '宝宝每天吃饭、睡觉的时间有规律吗？',
        options: [
          { label: '毫无规律', value: 1 },
          { label: '不太规律', value: 2 },
          { label: '一般', value: 3 },
          { label: '比较规律', value: 4 },
          { label: '非常规律', value: 5 }
        ]
      },
      {
        id: 4,
        text: '宝宝每天排便的时间大致固定吗？',
        options: [
          { label: '完全不固定', value: 1 },
          { label: '不太固定', value: 2 },
          { label: '一般', value: 3 },
          { label: '比较固定', value: 4 },
          { label: '非常固定', value: 5 }
        ]
      },
      {
        id: 5,
        text: '面对新食物，宝宝会主动尝试吃吗？',
        options: [
          { label: '拒绝尝试', value: 1 },
          { label: '勉强尝试', value: 2 },
          { label: '观望后尝试', value: 3 },
          { label: '较愿尝试', value: 4 },
          { label: '积极尝试', value: 5 }
        ]
      },
      {
        id: 6,
        text: '见到陌生小朋友时，宝宝会主动靠近一起玩吗？',
        options: [
          { label: '退缩回避', value: 1 },
          { label: '需鼓励才接近', value: 2 },
          { label: '观察后接近', value: 3 },
          { label: '较愿接近', value: 4 },
          { label: '主动热情', value: 5 }
        ]
      },
      {
        id: 7,
        text: '日常流程被打乱时（如做客），宝宝需要多久适应？',
        options: [
          { label: '很久（1小时+）', value: 1 },
          { label: '较久', value: 2 },
          { label: '中等', value: 3 },
          { label: '较快', value: 4 },
          { label: '很快就适应', value: 5 }
        ]
      },
      {
        id: 8,
        text: '去新的地方（如新幼儿园），宝宝适应速度快吗？',
        options: [
          { label: '很慢', value: 1 },
          { label: '较慢', value: 2 },
          { label: '一般', value: 3 },
          { label: '较快', value: 4 },
          { label: '很快', value: 5 }
        ]
      },
      {
        id: 9,
        text: '宝宝开心或不满时，情绪表达强烈吗（大笑或大哭）？',
        options: [
          { label: '很温和', value: 1 },
          { label: '较温和', value: 2 },
          { label: '适中', value: 3 },
          { label: '较强烈', value: 4 },
          { label: '非常强烈', value: 5 }
        ]
      },
      {
        id: 10,
        text: '宝宝不高兴时会大声哭闹抗议吗？',
        options: [
          { label: '几乎不哭', value: 1 },
          { label: '小声哼唧', value: 2 },
          { label: '正常哭泣', value: 3 },
          { label: '哭声较大', value: 4 },
          { label: '大声哭闹', value: 5 }
        ]
      },
      {
        id: 11,
        text: '宝宝一天中大部分时间是开心笑的吗？',
        options: [
          { label: '很少笑', value: 1 },
          { label: '偶尔笑', value: 2 },
          { label: '一半一半', value: 3 },
          { label: '多数时候笑', value: 4 },
          { label: '总是很高兴', value: 5 }
        ]
      },
      {
        id: 12,
        text: '宝宝容易因小事就表现出不开心的样子吗？',
        options: [
          { label: '从不会', value: 5 },
          { label: '很少会', value: 4 },
          { label: '有时会', value: 3 },
          { label: '经常会', value: 2 },
          { label: '总是会', value: 1 }
        ]
      },
      {
        id: 13,
        text: '面对困难的拼图或任务，宝宝会坚持尝试多久？',
        options: [
          { label: '立即放弃', value: 1 },
          { label: '尝试一下就停', value: 2 },
          { label: '中等持久', value: 3 },
          { label: '比较持久', value: 4 },
          { label: '非常坚持', value: 5 }
        ]
      },
      {
        id: 14,
        text: '想拿到够不着的玩具时，宝宝会努力想办法吗？',
        options: [
          { label: '马上放弃', value: 1 },
          { label: '稍作尝试', value: 2 },
          { label: '中等努力', value: 3 },
          { label: '较努力', value: 4 },
          { label: '非常努力', value: 5 }
        ]
      },
      {
        id: 15,
        text: '宝宝哭闹时，用新玩具能轻易转移TA的注意力吗？',
        options: [
          { label: '完全不能', value: 1 },
          { label: '较难转移', value: 2 },
          { label: '有时可以', value: 3 },
          { label: '多数可以', value: 4 },
          { label: '很容易转移', value: 5 }
        ]
      },
      {
        id: 16,
        text: '宝宝专注于某事时，叫TA名字会被忽略吗？',
        options: [
          { label: '每次都回应', value: 5 },
          { label: '多数回应', value: 4 },
          { label: '有时回应', value: 3 },
          { label: '偶尔回应', value: 2 },
          { label: '完全不回应', value: 1 }
        ]
      },
      {
        id: 17,
        text: '宝宝对微弱的声音（如远处门铃声）敏感吗？',
        options: [
          { label: '完全不敏感', value: 1 },
          { label: '不太敏感', value: 2 },
          { label: '一般', value: 3 },
          { label: '比较敏感', value: 4 },
          { label: '非常敏感', value: 5 }
        ]
      },
      {
        id: 18,
        text: '衣服上的标签或面料让宝宝感到不舒服吗？',
        options: [
          { label: '从不在意', value: 1 },
          { label: '很少在意', value: 2 },
          { label: '有时在意', value: 3 },
          { label: '经常在意', value: 4 },
          { label: '非常在意', value: 5 }
        ]
      },
      {
        id: 19,
        text: '光线变化时（如开灯、拉开窗帘），宝宝容易察觉吗？',
        options: [
          { label: '完全察觉不到', value: 1 },
          { label: '很少察觉', value: 2 },
          { label: '有时察觉', value: 3 },
          { label: '经常察觉', value: 4 },
          { label: '每次都能察觉', value: 5 }
        ]
      },
      {
        id: 20,
        text: '对食物的温度变化（稍微凉一点或热一点），宝宝敏感吗？',
        options: [
          { label: '完全不敏感', value: 1 },
          { label: '不太敏感', value: 2 },
          { label: '一般', value: 3 },
          { label: '比较敏感', value: 4 },
          { label: '非常敏感', value: 5 }
        ]
      }
    ]
  }
};

module.exports = testQuestions;
