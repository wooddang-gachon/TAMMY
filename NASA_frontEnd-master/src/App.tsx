import { useState } from 'react';
import { FuelProvider } from './hooks/useFuel';
import { AffinityProvider } from './hooks/useAffinity';
import { AuthProvider } from './hooks/useAuth';
import { BottomNav, type Tab } from './components/layout/BottomNav';
import { ArrivalOverlay, RewardToast } from './components/space';
import { ActivityScreen } from './screens/Activity';
import { HomeScreen } from './screens/Home';
import { ChatScreen } from './screens/Chat';
import { GrowthScreen } from './screens/Growth';
import { DiaryScreen } from './screens/Diary';
import { PlanetReportScreen } from './screens/PlanetReport';
import { FoodScreen } from './screens/Food';
import { ExerciseScreen } from './screens/Exercise';
import { ReportScreen } from './screens/Report';
import { TravelScreen } from './screens/Travel';
import { MyScreen } from './screens/My';

type Screen = Tab | 'exercise' | 'report' | 'chat' | 'growth' | 'diary' | 'planetReport';

/** TAMMY v4 bottom-nav 활성 탭 매핑: report/planetReport→travel, growth/chat/exercise→home */
function activeTab(screen: Screen): Tab {
  if (screen === 'report' || screen === 'planetReport') return 'travel';
  if (screen === 'growth' || screen === 'chat' || screen === 'exercise' || screen === 'diary') return 'home';
  return screen;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [planetReportId, setPlanetReportId] = useState<string>('meal');
  const [planetTravelResultId, setPlanetTravelResultId] = useState<string | number | undefined>(undefined);
  const tab = activeTab(screen);

  const openPlanetReport = (planetId: string, travelResultId?: string | number) => {
    setPlanetReportId(planetId);
    setPlanetTravelResultId(travelResultId);
    setScreen('planetReport');
  };

  return (
    <AuthProvider>
    <FuelProvider>
    <AffinityProvider>
      {/* 모바일 우선: 최대 430px 프레임, safe-area 대응 */}
      <div className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-cream pt-[env(safe-area-inset-top)]">
        <div className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {screen === 'home' && (
              <HomeScreen
                onOpenChat={() => setScreen('chat')}
                onOpenFood={() => setScreen('food')}
                onOpenReport={() => setScreen('report')}
                onOpenDiary={() => setScreen('diary')}
                onOpenTravel={() => setScreen('travel')}
                onOpenGrowth={() => setScreen('growth')}
              />
            )}
            {screen === 'chat' && <ChatScreen />}
            {screen === 'growth' && <GrowthScreen onBack={() => setScreen('home')} />}
            {screen === 'diary' && <DiaryScreen onBack={() => setScreen('home')} />}
            {screen === 'activities' && <ActivityScreen />}
            {screen === 'food' && <FoodScreen onBack={() => setScreen('home')} />}
            {screen === 'exercise' && <ExerciseScreen onBack={() => setScreen('home')} />}
            {screen === 'travel' && (
              <TravelScreen
                onGoHome={() => setScreen('home')}
                onGoReport={() => setScreen('report')}
                onOpenPlanetReport={openPlanetReport}
              />
            )}
            {screen === 'report' && <ReportScreen onBack={() => setScreen('travel')} />}
            {screen === 'planetReport' && <PlanetReportScreen planetId={planetReportId} travelResultId={planetTravelResultId} onBack={() => setScreen('travel')} />}
            {screen === 'my' && <MyScreen />}
          </div>
          <RewardToast />
          <ArrivalOverlay />
          <BottomNav tab={tab} onChange={(t) => setScreen(t)} />
        </div>
      </div>
    </AffinityProvider>
    </FuelProvider>
    </AuthProvider>
  );
}
