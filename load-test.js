// load-test.js - 70명 동시 접속 부하 테스트
const firebase = require('firebase/compat/app');
require('firebase/compat/database');

const firebaseConfig = {
    apiKey: "AIzaSyAEqLtREV1qGz61R-Ny6hANB_Y9waeDqvw",
    authDomain: "newyear-event.firebaseapp.com",
    databaseURL: "https://newyear-event-default-rtdb.firebaseio.com",
    projectId: "newyear-event",
    storageBucket: "newyear-event.firebasestorage.app",
    messagingSenderId: "188022742082",
    appId: "1:188022742082:web:b87805729316c62d5121db"
};

// 각 플레이어마다 별도의 Firebase 앱 인스턴스 생성 (연결 독립성 보장)
function createFirebaseApp(index) {
    try {
        // 고유한 앱 이름으로 별도 인스턴스 생성
        const appName = `test-app-${index}`;
        const app = firebase.initializeApp(firebaseConfig, appName);
        return firebase.app(appName).database();
    } catch (error) {
        // 이미 초기화된 경우 기본 앱 사용
        if (error.code === 'app/duplicate-app') {
            const appName = `test-app-${index}`;
            return firebase.app(appName).database();
        }
        throw error;
    }
}

// 70명의 가상 플레이어 생성 (배치로 나누어서 생성하여 부하 분산)
async function simulatePlayers() {
    const totalPlayers = 70;
    const batchSize = 5; // 한 번에 5명씩 생성 (리소스 절약)
    
    console.log(`🚀 ${totalPlayers}명의 가상 플레이어 생성 시작...\n`);
    console.log(`📍 Vercel 주소: https://newyear-gamma-five.vercel.app/\n`);
    
    const playerRefs = [];
    
    for (let batch = 0; batch < totalPlayers / batchSize; batch++) {
        const promises = [];
        
        for (let i = 0; i < batchSize; i++) {
            const playerIndex = batch * batchSize + i;
            if (playerIndex >= totalPlayers) break;
            
            // 각 플레이어마다 별도의 Firebase 앱 인스턴스 생성
            const playerDb = createFirebaseApp(playerIndex);
            const playerId = `test-player-${Date.now()}-${playerIndex}`;
            const playerData = {
                department: `부서${(playerIndex % 5) + 1}`,
                name: `테스트${playerIndex + 1}`,
                foundCount: 0,
                completed: false,
                completionTime: null,
                joinedAt: Date.now()
            };
            
            const playerDataRef = playerDb.ref(`players/${playerId}`);
            const presenceRef = playerDb.ref(`presence/${playerId}`);
            const connectedRef = playerDb.ref('.info/connected');
            
            const playerRef = {
                playerId: playerId,
                playerDataRef: playerDataRef,
                presenceRef: presenceRef,
                db: playerDb
            };
            
            // 플레이어 생성 프로세스
            const promise = new Promise((resolve, reject) => {
                // 연결 확인
                connectedRef.on('value', async (snapshot) => {
                    if (snapshot.val() === true) {
                        try {
                            // 플레이어 데이터 저장
                            await playerDataRef.set(playerData);
                            
                            // presence 설정
                            await presenceRef.set({
                                connected: true,
                                department: playerData.department,
                                name: playerData.name,
                                timestamp: Date.now()
                            });
                            
                            // 연결이 끊어지면 presence 자동 제거 설정
                            presenceRef.onDisconnect().remove();
                            
                            console.log(`✓ 플레이어 ${playerIndex + 1}/${totalPlayers} 생성 완료 (${playerData.department} - ${playerData.name})`);
                            resolve(playerRef);
                        } catch (error) {
                            console.error(`플레이어 ${playerIndex + 1} 생성 실패:`, error.message);
                            reject(error);
                        }
                    }
                });
            });
            
            promises.push(promise);
        }
        
        // 배치가 완료될 때까지 대기
        const batchResults = await Promise.all(promises);
        playerRefs.push(...batchResults);
        
        // 다음 배치 전에 약간의 지연 (서버 부하 방지)
        if (batch < totalPlayers / batchSize - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    console.log(`\n✅ 모든 플레이어(${totalPlayers}명) 생성 완료!`);
    console.log(`📊 Firebase 콘솔에서 /presence 노드를 확인하세요.`);
    console.log(`👤 관리자 모드에서 "참가 대기 인원"이 ${totalPlayers}명으로 표시되어야 합니다.\n`);
    console.log(`⏸️  테스트 데이터는 계속 유지됩니다.`);
    console.log(`🛑 종료하려면 Ctrl+C를 누르세요.\n`);
    console.log(`💡 관리자 모드에서 "게임 시작" 버튼을 눌러 테스트를 진행하세요.\n`);
    
    // 사용자가 Ctrl+C를 누르면 정리
    process.on('SIGINT', async () => {
        console.log('\n\n🧹 테스트 데이터 정리 중...');
        let cleaned = 0;
        
        for (const playerRef of playerRefs) {
            try {
                // presence와 player 데이터 제거
                await Promise.all([
                    playerRef.presenceRef.remove(),
                    playerRef.playerDataRef.remove()
                ]);
                cleaned++;
                
                // Firebase 앱 연결 해제 (선택사항)
                if (playerRef.db && playerRef.db.app) {
                    try {
                        await playerRef.db.app.delete();
                    } catch (e) {
                        // 무시
                    }
                }
            } catch (error) {
                console.error(`정리 중 오류 (${playerRef.playerId}):`, error.message);
            }
        }
        
        console.log(`✅ ${cleaned}명의 테스트 데이터 정리 완료`);
        process.exit(0);
    });
    
    // 연결 유지
    console.log('연결을 유지하는 중... (Ctrl+C로 종료)');
}

// 실행
simulatePlayers().catch(error => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
});

