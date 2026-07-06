<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const hours = ref('')
const minutes = ref('')
const date = ref('')
let timer: ReturnType<typeof setInterval>

const updateTime = () => {
  const now = new Date()
  hours.value = now.getHours().toString().padStart(2, '0')
  minutes.value = now.getMinutes().toString().padStart(2, '0')
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const
  date.value = `${t(`time.days.${dayKeys[now.getDay()]}`)}, ${t(`time.months.${monthKeys[now.getMonth()]}`)} ${now.getDate()}`
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="time-display">
    <div class="date">{{ date }}</div>
    <div class="time">
      <span class="digit">{{ hours }}</span>
      <span class="colon">:</span>
      <span class="digit">{{ minutes }}</span>
    </div>
  </div>
</template>

<style scoped>
.time-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.6s ease;
}

.date {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 0.3px;
}

.time {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.digit {
  font-size: 96px;
  font-weight: 200;
  color: var(--color-text);
  letter-spacing: -4px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  min-width: 0.6em;
  text-align: center;
}

.colon {
  font-size: 80px;
  font-weight: 200;
  color: var(--color-text-tertiary);
  animation: pulse 2s ease-in-out infinite;
  margin: 0 4px;
}

@media (max-width: 380px) {
  .digit {
    font-size: 72px;
    letter-spacing: -3px;
  }
  .colon {
    font-size: 60px;
  }
  .date {
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .digit {
    font-size: 120px;
    letter-spacing: -5px;
  }
  .colon {
    font-size: 100px;
  }
  .date {
    font-size: 20px;
  }
}
</style>
