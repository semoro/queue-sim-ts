import './App.css'
import Simulation from './components/Simulation'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Queue Simulation</h1>
      </header>
      <main>
        <Simulation />
      </main>
      <footer className="app-footer">
        <p>Queue Simulation - Tasks flow from Source to Buffer to Executor to Done</p>
      </footer>
    </div>
  )
}

export default App
