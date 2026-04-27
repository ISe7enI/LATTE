# 拿铁 (LATTE) - 前端开发规范

**版本**: v1.0  
**平台**: iOS (SwiftUI)  
**最后更新**: 2026年3月15日

---

## 1. 代码规范

### 1.1 命名规范

| 类型 | 规范 | 示例 |
|-----|------|------|
| 类/结构体 | PascalCase | `WorkoutSessionView`, `ExerciseRecord` |
| 函数/方法 | camelCase | `startWorkout()`, `calculateTotalVolume()` |
| 变量 | camelCase | `currentWorkout`, `restTimer` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_REST_TIME`, `MAX_SETS` |
| 枚举 | PascalCase + 小写case | `enum SyncStatus { case pending, synced, failed }` |
| 协议 | PascalCase + 后缀 | `WorkoutServiceProtocol`, `DataStoreProtocol` |
| 文件 | PascalCase + 后缀 | `WorkoutSessionView.swift`, `WorkoutViewModel.swift` |

### 1.2 文件组织

```
Latte/
├── App/
│   ├── LatteApp.swift              # App入口
│   ├── AppDelegate.swift           # 生命周期
│   └── Info.plist
│
├── Core/
│   ├── Models/                     # 数据模型
│   │   ├── WorkoutSession.swift
│   │   ├── Exercise.swift
│   │   ├── SetRecord.swift
│   │   └── UserProfile.swift
│   │
│   ├── Services/                   # 业务服务
│   │   ├── WorkoutService.swift
│   │   ├── SyncService.swift
│   │   ├── TimerService.swift
│   │   └── AnalyticsService.swift
│   │
│   ├── Repositories/               # 数据仓库
│   │   ├── WorkoutRepository.swift
│   │   ├── ExerciseRepository.swift
│   │   └── UserRepository.swift
│   │
│   └── Utilities/                  # 工具类
│       ├── DateFormatter+Ext.swift
│       ├── Double+Ext.swift
│       └── View+Ext.swift
│
├── Data/
│   ├── Local/                      # 本地存储
│   │   ├── CoreData/
│   │   │   ├── LatteModel.xcdatamodeld
│   │   │   ├── WorkoutSessionEntity.swift
│   │   │   └── ExerciseEntity.swift
│   │   └── UserDefaultsManager.swift
│   │
│   └── Remote/                     # 远程API
│       ├── GraphQL/
│       │   ├── schema.json
│       │   ├── queries.graphql
│       │   └── mutations.graphql
│       └── NetworkManager.swift
│
├── Features/                       # 功能模块
│   ├── Home/                       # 首页
│   │   ├── Views/
│   │   │   ├── HomeView.swift
│   │   │   └── DashboardCard.swift
│   │   └── ViewModels/
│   │       └── HomeViewModel.swift
│   │
│   ├── TrainingLogger/             # 训练记录
│   │   ├── Views/
│   │   │   ├── TrainingLoggerView.swift
│   │   │   ├── ExerciseCard.swift
│   │   │   ├── SetRow.swift
│   │   │   └── RestTimerView.swift
│   │   ├── ViewModels/
│   │   │   └── TrainingLoggerViewModel.swift
│   │   └── Components/
│   │       ├── WeightPicker.swift
│   │       └── RepsStepper.swift
│   │
│   ├── TrainingPlans/              # 训练计划
│   │   ├── Views/
│   │   │   ├── PlansView.swift
│   │   │   ├── PlanDetailView.swift
│   │   │   └── PlanCreatorView.swift
│   │   └── ViewModels/
│   │       └── PlansViewModel.swift
│   │
│   ├── ExerciseLibrary/            # 动作库
│   │   ├── Views/
│   │   │   ├── ExerciseLibraryView.swift
│   │   │   ├── ExerciseDetailView.swift
│   │   │   └── AnimationViewer.swift
│   │   └── ViewModels/
│   │       └── ExerciseLibraryViewModel.swift
│   │
│   ├── History/                    # 历史日历
│   │   ├── Views/
│   │   │   ├── HistoryView.swift
│   │   │   ├── CalendarView.swift
│   │   │   └── WorkoutDetailView.swift
│   │   └── ViewModels/
│   │       └── HistoryViewModel.swift
│   │
│   ├── Analytics/                  # 数据分析
│   │   ├── Views/
│   │   │   ├── AnalyticsView.swift
│   │   │   ├── VolumeChart.swift
│   │   │   └── ProgressChart.swift
│   │   └── ViewModels/
│   │       └── AnalyticsViewModel.swift
│   │
│   └── Profile/                    # 个人中心
│       ├── Views/
│       │   ├── ProfileView.swift
│       │   ├── SettingsView.swift
│       │   └── BodyMetricsView.swift
│       └── ViewModels/
│           └── ProfileViewModel.swift
│
├── UI/                             # UI组件
│   ├── Components/                 # 通用组件
│   │   ├── PrimaryButton.swift
│   │   ├── SecondaryButton.swift
│   │   ├── LoadingView.swift
│   │   ├── EmptyStateView.swift
│   │   └── ErrorView.swift
│   │
│   ├── DesignSystem/               # 设计系统
│   │   ├── Colors.swift
│   │   ├── Fonts.swift
│   │   ├── Spacing.swift
│   │   └── Shadows.swift
│   │
│   └── Modifiers/                  # View修饰器
│       ├── CardStyle.swift
│       └── RoundedCorner.swift
│
├── Resources/                      # 资源文件
│   ├── Assets.xcassets/
│   ├── Animations/                 # 3D动画文件
│   ├── Sounds/                     # 音效文件
│   │   └── timer_end.mp3
│   └── Localizable.strings
│
└── Preview Content/
    └── Preview Assets.xcassets/
```

### 1.3 SwiftUI 代码规范

#### View结构

```swift
import SwiftUI

// MARK: - View
struct TrainingLoggerView: View {
    
    // MARK: - Properties
    @StateObject private var viewModel = TrainingLoggerViewModel()
    @State private var showingAddExercise = false
    
    // MARK: - Body
    var body: some View {
        VStack(spacing: 0) {
            headerView
            exerciseList
            bottomActionBar
        }
        .sheet(isPresented: $showingAddExercise) {
            ExerciseLibraryView()
        }
    }
}

// MARK: - Subviews
private extension TrainingLoggerView {
    
    var headerView: some View {
        HStack {
            Text(viewModel.workoutDuration.formatted())
                .font(.headline)
            Spacer()
            Text("容量: \(viewModel.totalVolume.formatted())kg")
                .font(.subheadline)
        }
        .padding()
    }
    
    var exerciseList: some View {
        List {
            ForEach(viewModel.exercises) { exercise in
                ExerciseCard(exercise: exercise)
            }
        }
    }
    
    var bottomActionBar: some View {
        HStack {
            Button("添加动作") {
                showingAddExercise = true
            }
            .buttonStyle(PrimaryButtonStyle())
            
            Button("完成训练") {
                viewModel.finishWorkout()
            }
            .buttonStyle(SecondaryButtonStyle())
        }
        .padding()
    }
}

// MARK: - Preview
#Preview {
    TrainingLoggerView()
}
```

#### ViewModel结构

```swift
import Foundation
import Combine

// MARK: - ViewModel
@MainActor
final class TrainingLoggerViewModel: ObservableObject {
    
    // MARK: - Published Properties
    @Published private(set) var workoutSession: WorkoutSession
    @Published private(set) var exercises: [ExerciseRecord] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?
    
    // MARK: - Computed Properties
    var workoutDuration: TimeInterval {
        workoutSession.duration
    }
    
    var totalVolume: Double {
        exercises.reduce(0) { $0 + $1.totalVolume }
    }
    
    // MARK: - Dependencies
    private let workoutService: WorkoutServiceProtocol
    private let timerService: TimerServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    init(
        workoutService: WorkoutServiceProtocol = WorkoutService(),
        timerService: TimerServiceProtocol = TimerService()
    ) {
        self.workoutService = workoutService
        self.timerService = timerService
        self.workoutSession = WorkoutSession()
    }
    
    // MARK: - Public Methods
    func startWorkout() {
        workoutSession.start()
        timerService.start()
    }
    
    func addExercise(_ exercise: Exercise) {
        let record = ExerciseRecord(exercise: exercise)
        exercises.append(record)
    }
    
    func completeSet(exerciseId: UUID, setIndex: Int, weight: Double, reps: Int) {
        guard let exerciseIndex = exercises.firstIndex(where: { $0.id == exerciseId }) else { return }
        exercises[exerciseIndex].completeSet(at: setIndex, weight: weight, reps: reps)
        timerService.startRestTimer()
    }
    
    func finishWorkout() {
        workoutSession.finish()
        saveWorkout()
    }
    
    // MARK: - Private Methods
    private func saveWorkout() {
        Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                try await workoutService.save(workoutSession)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
```

---

## 2. 设计系统

### 2.1 颜色系统

```swift
// MARK: - Colors
extension Color {
    
    // Primary
    static let lattePrimary = Color("Primary")
    static let lattePrimaryLight = Color("PrimaryLight")
    static let lattePrimaryDark = Color("PrimaryDark")
    
    // Secondary
    static let latteSecondary = Color("Secondary")
    static let latteSecondaryLight = Color("SecondaryLight")
    
    // Semantic
    static let latteSuccess = Color("Success")
    static let latteWarning = Color("Warning")
    static let latteError = Color("Error")
    static let latteInfo = Color("Info")
    
    // Background
    static let latteBackground = Color("Background")
    static let latteSurface = Color("Surface")
    static let latteSurfaceVariant = Color("SurfaceVariant")
    
    // Text
    static let latteTextPrimary = Color("TextPrimary")
    static let latteTextSecondary = Color("TextSecondary")
    static let latteTextDisabled = Color("TextDisabled")
    
    // Chart Colors
    static let chartVolume = Color("ChartVolume")
    static let chartFrequency = Color("ChartFrequency")
    static let chartProgress = Color("ChartProgress")
}

// Assets.xcassets/Colors/Primary.colorset
{
  "colors": [
    {
      "idiom": "universal",
      "color": {
        "color-space": "srgb",
        "components": {
          "red": "0.20",
          "green": "0.60",
          "blue": "0.86",
          "alpha": "1.00"
        }
      }
    },
    {
      "idiom": "universal",
      "appearances": [
        {
          "appearance": "luminosity",
          "value": "dark"
        }
      ],
      "color": {
        "color-space": "srgb",
        "components": {
          "red": "0.25",
          "green": "0.65",
          "blue": "0.90",
          "alpha": "1.00"
        }
      }
    }
  ]
}
```

### 2.2 字体系统

```swift
// MARK: - Fonts
extension Font {
    
    // Display
    static let latteDisplayLarge = Font.system(size: 57, weight: .regular)
    static let latteDisplayMedium = Font.system(size: 45, weight: .regular)
    static let latteDisplaySmall = Font.system(size: 36, weight: .regular)
    
    // Headline
    static let latteHeadlineLarge = Font.system(size: 32, weight: .semibold)
    static let latteHeadlineMedium = Font.system(size: 28, weight: .semibold)
    static let latteHeadlineSmall = Font.system(size: 24, weight: .semibold)
    
    // Title
    static let latteTitleLarge = Font.system(size: 22, weight: .medium)
    static let latteTitleMedium = Font.system(size: 16, weight: .medium)
    static let latteTitleSmall = Font.system(size: 14, weight: .medium)
    
    // Body
    static let latteBodyLarge = Font.system(size: 16, weight: .regular)
    static let latteBodyMedium = Font.system(size: 14, weight: .regular)
    static let latteBodySmall = Font.system(size: 12, weight: .regular)
    
    // Label
    static let latteLabelLarge = Font.system(size: 14, weight: .medium)
    static let latteLabelMedium = Font.system(size: 12, weight: .medium)
    static let latteLabelSmall = Font.system(size: 11, weight: .medium)
}
```

### 2.3 间距系统

```swift
// MARK: - Spacing
enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}

// MARK: - Corner Radius
enum CornerRadius {
    static let sm: CGFloat = 4
    static let md: CGFloat = 8
    static let lg: CGFloat = 12
    static let xl: CGFloat = 16
    static let full: CGFloat = 9999
}
```

### 2.4 组件规范

#### 按钮

```swift
// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.latteLabelLarge)
            .foregroundColor(.white)
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
            .background(Color.lattePrimary)
            .cornerRadius(CornerRadius.md)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.latteLabelLarge)
            .foregroundColor(.lattePrimary)
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
            .background(Color.lattePrimary.opacity(0.1))
            .cornerRadius(CornerRadius.md)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
    }
}

// Usage
Button("开始训练") {
    startWorkout()
}
.buttonStyle(PrimaryButtonStyle())
```

#### 卡片

```swift
// MARK: - Card Modifier
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(Spacing.md)
            .background(Color.latteSurface)
            .cornerRadius(CornerRadius.lg)
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// Usage
VStack {
    Text("训练内容")
}
.cardStyle()
```

---

## 3. 状态管理

### 3.1 状态分类

| 状态类型 | 管理方式 | 使用场景 |
|---------|---------|---------|
| 视图状态 | @State | 纯UI状态（弹窗显示、输入焦点） |
| 共享状态 | @StateObject | 视图生命周期内的业务状态 |
| 全局状态 | @EnvironmentObject | 跨视图共享（用户、主题） |
| 持久状态 | Core Data/UserDefaults | 需要持久化的数据 |

### 3.2 状态管理示例

```swift
// MARK: - Global State
@MainActor
final class AppState: ObservableObject {
    @Published var user: User?
    @Published var isAuthenticated = false
    @Published var theme: Theme = .system
    @Published var unitSystem: UnitSystem = .metric
}

// MARK: - Environment
private struct AppStateKey: EnvironmentKey {
    static let defaultValue = AppState()
}

extension EnvironmentValues {
    var appState: AppState {
        get { self[AppStateKey.self] }
        set { self[AppStateKey.self] = newValue }
    }
}

// MARK: - Usage
@main
struct LatteApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

struct SomeView: View {
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        Text("当前单位: \(appState.unitSystem.displayName)")
    }
}
```

---

## 4. 数据流

### 4.1 单向数据流

```
View → Action → ViewModel → Service → Repository → DataSource
  ↑                                                      │
  └────────────────── State Update ←─────────────────────┘
```

### 4.2 数据流实现

```swift
// MARK: - Action
enum WorkoutAction {
    case startWorkout
    case addExercise(Exercise)
    case completeSet(exerciseId: UUID, setIndex: Int, weight: Double, reps: Int)
    case finishWorkout
}

// MARK: - ViewModel with Reducer
@MainActor
final class WorkoutStore: ObservableObject {
    @Published private(set) var state = WorkoutState()
    
    private let workoutService: WorkoutServiceProtocol
    
    init(workoutService: WorkoutServiceProtocol = WorkoutService()) {
        self.workoutService = workoutService
    }
    
    func send(_ action: WorkoutAction) {
        switch action {
        case .startWorkout:
            state.workoutSession.start()
            
        case .addExercise(let exercise):
            let record = ExerciseRecord(exercise: exercise)
            state.exercises.append(record)
            
        case .completeSet(let exerciseId, let setIndex, let weight, let reps):
            if let index = state.exercises.firstIndex(where: { $0.id == exerciseId }) {
                state.exercises[index].completeSet(at: setIndex, weight: weight, reps: reps)
            }
            
        case .finishWorkout:
            state.workoutSession.finish()
            saveWorkout()
        }
    }
    
    private func saveWorkout() {
        Task {
            do {
                try await workoutService.save(state.workoutSession)
            } catch {
                state.error = error
            }
        }
    }
}
```

---

## 5. 网络层

### 5.1 GraphQL Client

```swift
// MARK: - Network Manager
import Apollo

final class NetworkManager {
    static let shared = NetworkManager()
    
    private let client: ApolloClient
    
    private init() {
        let cache = InMemoryNormalizedCache()
        let store = ApolloStore(cache: cache)
        
        let interceptorProvider = DefaultInterceptorProvider(store: store)
        let networkTransport = RequestChainNetworkTransport(
            interceptorProvider: interceptorProvider,
            endpointURL: URL(string: "https://api.latte.app/graphql")!
        )
        
        client = ApolloClient(networkTransport: networkTransport, store: store)
    }
    
    func fetch<Query: GraphQLQuery>(
        query: Query,
        cachePolicy: CachePolicy = .returnCacheDataElseFetch
    ) async throws -> Query.Data {
        return try await withCheckedThrowingContinuation { continuation in
            client.fetch(query: query, cachePolicy: cachePolicy) { result in
                switch result {
                case .success(let response):
                    if let data = response.data {
                        continuation.resume(returning: data)
                    } else if let errors = response.errors {
                        continuation.resume(throwing: NetworkError.graphQLErrors(errors))
                    }
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    func perform<Mutation: GraphQLMutation>(mutation: Mutation) async throws -> Mutation.Data {
        return try await withCheckedThrowingContinuation { continuation in
            client.perform(mutation: mutation) { result in
                switch result {
                case .success(let response):
                    if let data = response.data {
                        continuation.resume(returning: data)
                    } else if let errors = response.errors {
                        continuation.resume(throwing: NetworkError.graphQLErrors(errors))
                    }
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }
}

// MARK: - Error Handling
enum NetworkError: Error {
    case graphQLErrors([GraphQLError])
    case noData
    case unauthorized
    case serverError
}
```

### 5.2 离线支持

```swift
// MARK: - Sync Manager
@MainActor
final class SyncManager: ObservableObject {
    @Published private(set) var pendingSyncCount = 0
    
    private let localStore: LocalDataStore
    private let remoteStore: RemoteDataStore
    private let networkMonitor: NetworkMonitor
    
    init(
        localStore: LocalDataStore = CoreDataStore(),
        remoteStore: RemoteDataStore = GraphQLDataStore(),
        networkMonitor: NetworkMonitor = NetworkMonitor()
    ) {
        self.localStore = localStore
        self.remoteStore = remoteStore
        self.networkMonitor = networkMonitor
        
        setupNetworkObserver()
    }
    
    private func setupNetworkObserver() {
        networkMonitor.$isConnected
            .filter { $0 }
            .sink { [weak self] _ in
                self?.syncPendingData()
            }
            .store(in: &cancellables)
    }
    
    func syncPendingData() async {
        let pendingWorkouts = await localStore.getPendingSyncWorkouts()
        pendingSyncCount = pendingWorkouts.count
        
        for workout in pendingWorkouts {
            do {
                try await remoteStore.save(workout)
                await localStore.markAsSynced(workout.id)
            } catch {
                print("同步失败: \(error)")
            }
        }
        
        pendingSyncCount = 0
    }
}
```

---

## 6. 性能优化

### 6.1 列表优化

```swift
// MARK: - Optimized List
struct ExerciseListView: View {
    let exercises: [Exercise]
    
    var body: some View {
        List {
            ForEach(exercises) { exercise in
                ExerciseRow(exercise: exercise)
                    .id(exercise.id)
            }
        }
        .listStyle(.plain)
    }
}

struct ExerciseRow: View {
    let exercise: Exercise
    
    var body: some View {
        HStack {
            // 使用异步图片加载
            AsyncImage(url: exercise.thumbnailURL) { image in
                image.resizable()
            } placeholder: {
                Color.gray
            }
            .frame(width: 60, height: 60)
            .cornerRadius(8)
            
            VStack(alignment: .leading) {
                Text(exercise.name)
                    .font(.latteBodyLarge)
                Text(exercise.muscleGroups.joined(separator: ", "))
                    .font(.latteBodySmall)
                    .foregroundColor(.latteTextSecondary)
            }
            
            Spacer()
        }
        .padding(.vertical, 8)
    }
}
```

### 6.2 图片缓存

```swift
// MARK: - Image Cache
import Kingfisher

extension KFImage {
    static func exerciseImage(url: URL?) -> KFImage {
        KFImage(url)
            .resizable()
            .placeholder {
                Color.latteSurfaceVariant
            }
            .fade(duration: 0.25)
            .cacheMemoryOnly()
    }
}
```

### 6.3 计算属性优化

```swift
// MARK: - Optimized Computations
struct WorkoutSummaryView: View {
    let workout: WorkoutSession
    
    // 使用memoization优化复杂计算
    private var totalVolume: Double {
        workout.exercises.reduce(0) { sum, exercise in
            sum + exercise.sets.reduce(0) { $0 + ($1.weight * Double($1.reps)) }
        }
    }
    
    var body: some View {
        Text("总容量: \(totalVolume.formatted())kg")
    }
}
```

---

## 7. 测试规范

### 7.1 单元测试

```swift
import XCTest
@testable import Latte

final class WorkoutViewModelTests: XCTestCase {
    
    var viewModel: TrainingLoggerViewModel!
    var mockWorkoutService: MockWorkoutService!
    
    override func setUp() {
        super.setUp()
        mockWorkoutService = MockWorkoutService()
        viewModel = TrainingLoggerViewModel(workoutService: mockWorkoutService)
    }
    
    override func tearDown() {
        viewModel = nil
        mockWorkoutService = nil
        super.tearDown()
    }
    
    func testStartWorkout() {
        // When
        viewModel.startWorkout()
        
        // Then
        XCTAssertNotNil(viewModel.workoutSession.startTime)
        XCTAssertTrue(viewModel.workoutSession.isActive)
    }
    
    func testAddExercise() {
        // Given
        let exercise = Exercise.mockSquat
        
        // When
        viewModel.addExercise(exercise)
        
        // Then
        XCTAssertEqual(viewModel.exercises.count, 1)
        XCTAssertEqual(viewModel.exercises.first?.exercise.id, exercise.id)
    }
    
    func testCompleteSet() {
        // Given
        let exercise = Exercise.mockSquat
        viewModel.addExercise(exercise)
        
        // When
        viewModel.completeSet(
            exerciseId: viewModel.exercises[0].id,
            setIndex: 0,
            weight: 100,
            reps: 8
        )
        
        // Then
        XCTAssertTrue(viewModel.exercises[0].sets[0].isCompleted)
        XCTAssertEqual(viewModel.exercises[0].sets[0].weight, 100)
        XCTAssertEqual(viewModel.exercises[0].sets[0].reps, 8)
    }
}
```

### 7.2 UI测试

```swift
import XCTest

final class TrainingLoggerUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    func testStartWorkoutFlow() {
        // Tap on Logger tab
        app.tabBars.buttons["记录"].tap()
        
        // Tap start workout
        app.buttons["开始空训练"].tap()
        
        // Verify workout screen appears
        XCTAssertTrue(app.navigationBars["训练中"].exists)
        
        // Add exercise
        app.buttons["添加动作"].tap()
        app.cells["杠铃深蹲"].tap()
        
        // Verify exercise added
        XCTAssertTrue(app.staticTexts["杠铃深蹲"].exists)
    }
}
```

---

## 8. 文档规范

### 8.1 代码注释

```swift
/// 训练记录视图模型
/// 管理训练记录的创建、编辑和保存
/// - Important: 必须在主线程使用
@MainActor
final class TrainingLoggerViewModel: ObservableObject {
    
    /// 当前训练会话
    @Published private(set) var workoutSession: WorkoutSession
    
    /// 完成一组训练
    /// - Parameters:
    ///   - exerciseId: 动作ID
    ///   - setIndex: 组次索引
    ///   - weight: 重量(kg)
    ///   - reps: 次数
    /// - Throws: WorkoutError.invalidSet 如果参数无效
    func completeSet(
        exerciseId: UUID,
        setIndex: Int,
        weight: Double,
        reps: Int
    ) throws {
        // Implementation
    }
}
```

### 8.2 MARK注释

```swift
// MARK: - Properties
// MARK: - Initialization
// MARK: - Public Methods
// MARK: - Private Methods
// MARK: - Helpers
// MARK: - Extensions
// MARK: - Preview
```

---

## 9. Git工作流

### 9.1 分支规范

| 分支 | 用途 |
|-----|------|
| main | 生产环境代码 |
| develop | 开发集成 |
| feature/* | 功能开发 |
| bugfix/* | Bug修复 |
| release/* | 版本发布 |

### 9.2 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- feat: 新功能
- fix: Bug修复
- docs: 文档
- style: 格式调整
- refactor: 重构
- test: 测试
- chore: 构建/工具

**示例**:
```
feat(training): 添加超级组支持

- 支持连续记录多个动作
- 自动计算超级组容量
- 添加超级组UI标识

Closes #123
```
