/**
 * Quiz Page - 8 question personality test
 * After completion, computes personality and navigates to result.
 */
import { QUIZ_QUESTIONS, computePersonality } from '../../constants/quiz'
import { store } from '../../utils/store'
import { gameApi } from '../../utils/api'
import { MISSION_XP } from '../../utils/config'
import type { PlanetXTraitKey, PlanetXPersonalityType } from '../../types/index'

Page({
  data: {
    step: 0,
    total: QUIZ_QUESTIONS.length,
    currentQuestion: QUIZ_QUESTIONS[0],
    progress: [] as boolean[],
  },

  traitCounts: {} as Partial<Record<PlanetXTraitKey, number>>,

  onLoad() {
    this.setData({
      progress: new Array(QUIZ_QUESTIONS.length).fill(false),
    })
    this.traitCounts = {}
    store.set('quizStep', 0)
    store.set('quizTraitCounts', {})
  },

  onAnswer(e: any) {
    const idx = e.currentTarget.dataset.index
    const option = this.data.currentQuestion.options[idx]
    const trait = option.trait as PlanetXTraitKey

    this.traitCounts[trait] = (this.traitCounts[trait] || 0) + 1

    const progress = [...this.data.progress]
    progress[this.data.step] = true
    this.setData({ progress })

    const nextStep = this.data.step + 1
    if (nextStep >= QUIZ_QUESTIONS.length) {
      void this.finishQuiz()
    } else {
      setTimeout(() => {
        this.setData({
          step: nextStep,
          currentQuestion: QUIZ_QUESTIONS[nextStep],
        })
      }, 300)
    }
  },

  async finishQuiz() {
    const personality = computePersonality(this.traitCounts)

    // 1. 立即更新本地状态（用户无需等待网络也能看到结果页）
    store.set('personalityType', personality as any)
    store.set('quizTraitCounts', this.traitCounts)
    store.completeMission('personality')
    store.setAchievement({
      title: '🔮 星际人格觉醒！',
      desc: `你被认证为「${personality.name}」`,
    })

    const xpReward = MISSION_XP.personality

    // 2. 同步人格结果到后端（失败不阻塞，已持久化本地状态）
    try {
      await gameApi.syncProfile({
        personality_type: personality.name,
        personality_detail: JSON.stringify(personality),
      })
    } catch {
      // 后端同步失败时，本地已完成状态仍保留
    }

    // 3. 完成后端 mission-complete，并用返回值校准 XP/等级
    try {
      const data: any = await gameApi.completeMission('personality', xpReward)
      if (data?.total_xp != null) {
        store.applyGameProfile({
          xp: data.total_xp,
          level: data.level,
          missions_completed: store.get('missionsCompleted'),
        })
      }
    } catch {
      // 后端失败不影响本地已完成状态
    }

    // 4. 跳转到结果页
    wx.redirectTo({ url: '/pages/result/index' })
  },
})
