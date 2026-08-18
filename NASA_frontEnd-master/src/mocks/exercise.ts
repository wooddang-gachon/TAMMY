import type { ExercisePlan } from '../types';

export const mockPlan: ExercisePlan = {
  title: '하체 운동',
  emoji: '💪',
  totalMinutes: 30,
  totalCalories: 320,
  difficulty: 3,
  exercises: [
    {
      id: 'squat', name: '스쿼트', emoji: '🏋️', bodyPart: '허벅지 · 엉덩이',
      reps: '15회', sets: 3, seconds: 45, calories: 90,
      howTo: ['다리를 어깨너비로 벌리고 바르게 서요', '무릎이 발끝을 넘지 않게 천천히 앉아요', '허벅지가 바닥과 평행해지면 일어나요'],
      caution: '허리를 곧게 펴고, 무릎이 안쪽으로 모이지 않게 주의해요.',
    },
    {
      id: 'lunge', name: '런지', emoji: '🦵', bodyPart: '허벅지 · 코어',
      reps: '12회', sets: 3, seconds: 40, calories: 80,
      howTo: ['한 발을 크게 앞으로 내딛어요', '뒷무릎이 바닥에 닿기 직전까지 내려가요', '앞발 뒤꿈치로 밀며 일어나요'],
      caution: '상체가 앞으로 기울지 않게 코어에 힘을 줘요.',
    },
    {
      id: 'legraise', name: '레그레이즈', emoji: '🧘', bodyPart: '복근 · 하복부',
      reps: '15회', sets: 3, seconds: 40, calories: 70,
      howTo: ['바닥에 누워 손을 엉덩이 옆에 둬요', '다리를 곧게 편 채 90도까지 올려요', '바닥에 닿기 직전까지 천천히 내려요'],
      caution: '허리가 뜨지 않게 복부에 힘을 유지해요.',
    },
    {
      id: 'plank', name: '플랭크', emoji: '🧱', bodyPart: '코어 전체',
      reps: '60초', sets: 3, seconds: 60, calories: 80,
      howTo: ['팔꿈치를 어깨 아래에 두고 엎드려요', '머리부터 발끝까지 일직선을 만들어요', '배와 엉덩이에 힘을 주고 버텨요'],
      caution: '엉덩이가 올라가거나 처지지 않게 해요.',
    },
  ],
};
